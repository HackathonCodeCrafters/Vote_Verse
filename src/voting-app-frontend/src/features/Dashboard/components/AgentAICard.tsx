"use client";

import Button from "@/shared/components/Button";
import Card from "@/shared/components/Card";
import type { LucideIcon } from "lucide-react";
import { Activity, Brain, Clock, LineChart, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
// Sesuaikan path ini jika alias-mu berbeda
import { voting_app_backend as backend } from "../../../../../declarations/voting-app-backend";

interface AgentAICardProps {
  darkMode?: boolean;
  className?: string;
}

type Raw = any;
type Norm = {
  title: string;
  createdAtSec: number;
  yes: number;
  no: number;
  voters: number;
};

type Insight = {
  title: string;
  description: string;
  icon: LucideIcon;
  iconClass: string;
};

// ---------- helpers ----------
const toNum = (v: any, d = 0) => {
  if (typeof v === "number") return v;
  if (typeof v === "bigint") return Number(v);
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
};

const normalize = (p: Raw): Norm | null => {
  try {
    let createdAtSec = 0;
    if (
      typeof p?.created_at === "number" ||
      typeof p?.created_at === "bigint"
    ) {
      createdAtSec = toNum(p.created_at, 0);
    } else if (typeof p?.createdAt === "number") {
      createdAtSec = Math.floor(p.createdAt);
    } else if (typeof p?.createdAt === "string") {
      createdAtSec = Math.floor(Date.parse(p.createdAt) / 1000);
    }

    const yes = toNum(p?.votes?.yes ?? p?.yes_votes ?? 0);
    const no = toNum(p?.votes?.no ?? p?.no_votes ?? 0);
    const voters = toNum(p?.total_voters ?? yes + no);
    const title = String(p?.title ?? "Untitled");

    return { title, createdAtSec, yes, no, voters };
  } catch {
    return null;
  }
};

const percentDelta = (curr: number, prev: number) => {
  if (prev <= 0 && curr <= 0) return 0;
  if (prev <= 0) return 100;
  return ((curr - prev) / prev) * 100;
};

const bestWindow2h = (rows: Norm[]) => {
  const buckets = Array.from({ length: 12 }, () => ({ n: 0, votes: 0 }));
  rows.forEach((r) => {
    if (!r.createdAtSec) return;
    const h = new Date(r.createdAtSec * 1000).getUTCHours();
    const b = Math.max(0, Math.min(11, Math.floor(h / 2)));
    buckets[b].n += 1;
    buckets[b].votes += r.yes + r.no;
  });
  let best = 0;
  let score = -1;
  buckets.forEach((b, i) => {
    const s = b.n ? b.votes / b.n : 0;
    if (s > score) {
      score = s;
      best = i;
    }
  });
  const start = best * 2;
  const end = start + 2;
  return `${start}:00–${end}:00 UTC`;
};

type HotInfo = { title: string; rate: number } | null;

const highActivity = (rows: Norm[]): HotInfo => {
  const now = Date.now() / 1000;
  let bestRate = -Infinity;
  let bestTitle = "";

  for (const r of rows) {
    const ageDays = Math.max((now - (r.createdAtSec || now)) / 86400, 0.25);
    const rate = (r.yes + r.no) / ageDays; // votes/day
    if (rate > bestRate) {
      bestRate = rate;
      bestTitle = r.title;
    }
  }

  if (!Number.isFinite(bestRate) || bestRate === -Infinity) return null;
  return { title: bestTitle, rate: Math.round(bestRate) };
};

// **Type guard** supaya TS yakin tipe-nya bukan never
const isHotInfo = (v: HotInfo): v is { title: string; rate: number } =>
  v !== null && typeof v.title === "string" && typeof v.rate === "number";

// ============== component ==============
export default function AgentAICard({
  darkMode = false,
  className = "",
}: AgentAICardProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string>("");
  const [insights, setInsights] = useState<Insight[]>([]);

  const borderCol = darkMode ? "border-white/10" : "border-gray-200";
  const titleCol = darkMode ? "text-white" : "text-gray-900";
  const mutedCol = darkMode ? "text-gray-300" : "text-gray-600";
  const chipBg = darkMode
    ? "bg-white/10 ring-white/15"
    : "bg-gray-100 ring-black/10";
  const badgeBg = darkMode
    ? "bg-white/10 text-gray-300 border-white/20"
    : "bg-gray-100 text-gray-700 border-gray-200";
  const innerBg = darkMode ? "bg-white/5" : "bg-white";
  const innerBorder = darkMode ? "border-white/10" : "border-gray-200";

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    setError("");
    try {
      const raw = await backend.get_proposals();
      const rows = (raw as Raw[]).map(normalize).filter(Boolean) as Norm[];

      const now = Date.now() / 1000;
      const last30 = rows.filter((r) => r.createdAtSec >= now - 30 * 86400);
      const prev30 = rows.filter(
        (r) =>
          r.createdAtSec < now - 30 * 86400 &&
          r.createdAtSec >= now - 60 * 86400
      );

      const votersLast = last30.reduce((s, r) => s + r.voters, 0);
      const votersPrev = prev30.reduce((s, r) => s + r.voters, 0);
      const delta = Math.round(percentDelta(votersLast, votersPrev));
      const windowLabel = bestWindow2h(rows);

      const hotInfo = highActivity(rows);
      const hotDesc = isHotInfo(hotInfo)
        ? `“${hotInfo.title}” gaining rapid traction (${hotInfo.rate} votes/day)`
        : "No unusual traction detected yet";

      const newInsights: Insight[] = [
        {
          title: `Governance Participation ${
            delta >= 0 ? "Up" : "Down"
          } ${Math.abs(delta)}%`,
          description:
            delta >= 0
              ? "Community engagement has increased this month"
              : "Community engagement decreased this month",
          icon: LineChart,
          iconClass: "text-emerald-400",
        },
        {
          title: "Optimal Voting Time",
          description: `Best time to submit proposals: ${windowLabel}`,
          icon: Clock,
          iconClass: "text-yellow-400",
        },
        {
          title: "High Activity Proposal",
          description: hotDesc,
          icon: Activity,
          iconClass: "text-orange-400",
        },
      ];

      setInsights(newInsights);
    } catch (e: any) {
      setError(e?.message || "Failed to load insights");
      setInsights([]);
    } finally {
      setIsAnalyzing(false);
    }
  };

  useEffect(() => {
    handleAnalyze();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Card className={`overflow-hidden p-0 ${className}`} darkMode={darkMode}>
      {/* Header */}
      <div className={`px-5 py-4 border-b ${borderCol} flex gap-4 items-start`}>
        <div
          className={`relative flex h-10 w-10 items-center justify-center rounded-full ${chipBg} ring-1`}
        >
          <Brain
            size={18}
            className="text-cyan-300"
            strokeWidth={2}
            aria-hidden
          />
          <span className="pointer-events-none absolute inset-0 rounded-full shadow-[0_0_30px_6px_rgba(34,211,238,0.12)]" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2">
            <h3 className={`font-semibold ${titleCol}`}>AI Governance Agent</h3>
            <span
              className={`ml-auto text-[11px] px-2 py-0.5 rounded border ${badgeBg}`}
            >
              ICP
            </span>
          </div>
          <p className={`text-sm mt-1 ${mutedCol}`}>
            Intelligent insights for better governance decisions
          </p>
        </div>
      </div>

      {/* Body */}
      <div className="p-5 space-y-3">
        {insights.map((it, i) => {
          const Icon = it.icon;
          return (
            <div
              key={i}
              className={`p-3 rounded-lg border ${innerBorder} ${innerBg} flex gap-3 items-start`}
            >
              <Icon size={18} className={`${it.iconClass} shrink-0 mt-0.5`} />
              <div className="min-w-0">
                <p className={`text-sm font-medium ${titleCol} truncate`}>
                  {it.title}
                </p>
                <p className={`text-xs ${mutedCol}`}>{it.description}</p>
              </div>
            </div>
          );
        })}

        <Button
          variant="gradient"
          onClick={handleAnalyze}
          disabled={isAnalyzing}
          className="w-full h-10 rounded-md text-sm font-medium inline-flex items-center justify-center gap-2"
        >
          {isAnalyzing ? (
            <>
              <span className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Sparkles size={16} />
              Get AI Insights
            </>
          )}
        </Button>

        {error && (
          <p
            className={`text-xs ${darkMode ? "text-red-300" : "text-red-600"}`}
          >
            {error}
          </p>
        )}

        <p className={`text-center text-xs ${mutedCol}`}>
          Powered by lightweight on-chain analytics (no LLM required)
        </p>
      </div>
    </Card>
  );
}
