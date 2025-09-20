"use client";

import type { Proposal } from "@/@types/proposal";
import Button from "@/shared/components/Button";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle,
  Clock,
  TrendingUp,
  Users,
  XCircle,
  ShieldCheck,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useDarkMode } from "../../../context/DarkModeContext";
import { callVoteProposal } from "@/ic/call";

/** =========================
 *  Helpers (inline)
 *  ========================= */

// Phase helper untuk Commit–Reveal
type Phase = "COMMIT" | "REVEAL" | "CLOSED";
const NS_PER_MS = 1_000_000;
const DAY_MS = 86_400_000;

function getPhase(opts: {
  created_at_ns?: bigint;
  createdAt?: string | number;
  duration_days: number;
  reveal_days?: number;
}): Phase {
  const now = Date.now();

  // dukung 2 bentuk createdAt (string/number) atau created_at_ns (bigint)
  let createdMs: number;
  if (typeof opts.created_at_ns === "bigint") {
    createdMs = Number(opts.created_at_ns) / NS_PER_MS;
  } else if (typeof opts.createdAt === "number") {
    createdMs = opts.createdAt;
  } else if (typeof opts.createdAt === "string") {
    createdMs = Date.parse(opts.createdAt);
  } else {
    createdMs = now; // fallback
  }

  const commitEnd = createdMs + (opts.duration_days || 0) * DAY_MS;
  const revealDays = opts.reveal_days || 0;

  if (revealDays > 0) {
    const revealEnd = commitEnd + revealDays * DAY_MS;
    if (now < commitEnd) return "COMMIT";
    if (now < revealEnd) return "REVEAL";
    return "CLOSED";
  }
  // PublicInstant: hanya commit window (alias masa voting)
  return now < commitEnd ? "COMMIT" : "CLOSED";
}

// Hashing (SHA-256) untuk commitment
async function sha256Hex(input: string) {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
async function voteCommitment(choice: "YES" | "NO", salt: string) {
  // pastikan format ini sama dengan backend
  return sha256Hex(`${choice}:${salt}`);
}

// Countdown existing hook kamu
import { useCountdown } from "@/features/Dashboard/utils/proposalTime";

/** =========================
 *  Props
 *  ========================= */
interface ProposalDetailPageProps {
  backend?: any;
  principal?: string;
  onVote: (proposalId: string, vote: "yes" | "no") => void;
}

/** =========================
 *  Component
 *  ========================= */
export default function ProposalDetailPage({
  backend,
  principal,
  onVote,
}: ProposalDetailPageProps) {
  const handleInstantVote = async (which: "yes" | "no") => {
    if (!backend) return alert("Backend not ready");
    if (!proposal) return alert("Proposal not loaded");
    try {
      await callVoteProposal(backend, proposal.id, which, principal);
      alert(`Vote ${which.toUpperCase()} submitted`);
    } catch (e: any) {
      alert(e?.message ?? "Vote failed");
    }
  };
  const { darkMode } = useDarkMode();
  const { principal_id, proposalName } = useParams();
  const navigate = useNavigate();
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // UI state: Commit–Reveal
  const [choiceCR, setChoiceCR] = useState<"" | "YES" | "NO">("");
  const [saltCR, setSaltCR] = useState<string>(() => crypto.randomUUID());
  const [isCommitting, setIsCommitting] = useState(false);
  const [isRevealing, setIsRevealing] = useState(false);

  // UI state: Execute
  const [executeOpen, setExecuteOpen] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [canExecute, setCanExecute] = useState(false);

  // Fetch proposal data berdasarkan URL
  useEffect(() => {
    const fetchProposal = async () => {
      if (!backend || !principal_id || !proposalName) {
        setError("Missing required parameters");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const proposalTitle = proposalName.replace(/-/g, " ");
        const proposals = await backend.getProposals();

        const foundProposal = proposals.find((p: Proposal) => {
          const titleMatches =
            p.title.toLowerCase() === proposalTitle.toLowerCase();

          const principalMatches =
            (p as any).principalId === principal_id ||
            (p as any).author_principal === principal_id ||
            (p as any).authorPrincipal === principal_id ||
            (principal &&
              ((p as any).principalId === principal ||
                (p as any).author_principal === principal ||
                (p as any).authorPrincipal === principal));

          return titleMatches && principalMatches;
        });

        if (foundProposal) {
          setProposal(foundProposal);
        } else {
          const proposalByTitle = proposals.find(
            (p: Proposal) =>
              p.title.toLowerCase() === proposalTitle.toLowerCase()
          );

          if (proposalByTitle) {
            setProposal(proposalByTitle);
            console.warn(
              `Proposal found by title only. URL principal_id: ${principal_id}, Found proposal principal: ${(proposalByTitle as any).principalId ||
              (proposalByTitle as any).author_principal ||
              (proposalByTitle as any).authorPrincipal
              }`
            );
          } else {
            setError("Proposal not found");
            console.error(
              "Available proposals:",
              proposals.map(
                (p: {
                  title: any;
                  principalId: any;
                  author_principal: any;
                  authorPrincipal: any;
                }) => ({
                  title: p.title,
                  principalId: p.principalId,
                  author_principal: p.author_principal,
                  authorPrincipal: p.authorPrincipal,
                })
              )
            );
          }
        }
      } catch (err) {
        console.error("Error fetching proposal:", err);
        setError("Failed to load proposal");
      } finally {
        setLoading(false);
      }
    };

    fetchProposal();
  }, [backend, principal_id, proposalName, principal]);

  // Loading / Error states
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className={`text-lg ${darkMode ? "text-white" : "text-gray-900"}`}>
            Loading proposal...
          </p>
        </div>
      </div>
    );
  }

  if (error || !proposal) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
          <h1
            className={`text-2xl font-bold mb-2 ${darkMode ? "text-white" : "text-gray-900"
              }`}
          >
            Proposal Not Found
          </h1>
          <p className={`mb-6 ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
            {error || "The proposal you're looking for doesn't exist."}
          </p>
          <div className="space-y-2 mb-6 text-sm text-gray-500">
            <p>URL Principal ID: {principal_id}</p>
            <p>Authenticated Principal: {principal}</p>
            <p>Proposal Name: {proposalName}</p>
          </div>
          <Button
            onClick={() => navigate("/dashboard")}
            variant="gradient"
            icon={ArrowLeft}
          >
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  /** =========================
   *  Data normalization
   *  ========================= */
  const yesVotes = (proposal as any).votes?.yes ?? (proposal as any).yesVotes ?? 0;
  const noVotes = (proposal as any).votes?.no ?? (proposal as any).noVotes ?? 0;
  const totalVotes = yesVotes + noVotes;
  const yesPercentage = totalVotes > 0 ? (yesVotes / totalVotes) * 100 : 0;
  const noPercentage = totalVotes > 0 ? (noVotes / totalVotes) * 100 : 0;

  const imageUrl = (proposal as any).image || (proposal as any).imageUrl || "/placeholder.svg";
  const description = proposal.description;
  const detailDescription = (proposal as any).full_description;
  const totalVotersCount = (proposal as any).totalVoters ?? totalVotes;
  const categoryName = proposal.category ?? "General";
  const authorName = (proposal as any).author ?? "Anonymous";

  // Durasi (hari)
  const durationDays =
    typeof (proposal as any).durationDays === "number"
      ? (proposal as any).durationDays
      : (proposal as any).durationDays !== undefined &&
        (proposal as any).durationDays !== null
        ? parseInt(String((proposal as any).durationDays))
        : 7;

  // Reveal days (untuk Commit–Reveal)
  const revealDays =
    typeof (proposal as any).reveal_days === "number"
      ? (proposal as any).reveal_days
      : (proposal as any).revealDays !== undefined &&
        (proposal as any).revealDays !== null
        ? parseInt(String((proposal as any).revealDays))
        : 0;

  // Mode voting
  const votingMode: "PublicInstant" | "CommitReveal" =
    ((proposal as any).mode as any) ||
    ((proposal as any).votingMode as any) ||
    "PublicInstant";

  // createdAt untuk countdown existing (UI)
  const createdAtString =
    typeof (proposal as any).createdAt === "number"
      ? new Date((proposal as any).createdAt).toISOString()
      : (proposal as any).createdAt || new Date().toISOString();

  // created_at_ns (opsional) untuk phase calc
  const createdAtNs: bigint | undefined = (proposal as any).created_at_ns;

  // Existing countdown (UI)
  const timeRemaining = useCountdown(createdAtString, durationDays);

  // Phase untuk Commit–Reveal
  const phase = useMemo(
    () =>
      getPhase({
        created_at_ns: createdAtNs,
        createdAt: createdAtString,
        duration_days: durationDays,
        reveal_days: revealDays,
      }),
    [createdAtNs, createdAtString, durationDays, revealDays]
  );

  // Nonaktifkan voting instan bila expired atau commit–reveal
  const isVotingDisabled =
    timeRemaining.isExpired ||
    proposal.status === "ended" ||
    votingMode === "CommitReveal";

  // Eksekusi: tentukan apakah principal boleh execute
  useEffect(() => {
    const allowlist: string[] | undefined =
      (proposal as any).allowlist || (proposal as any).execute_allowlist;
    if (!allowlist?.length) {
      // kalau tidak ada allowlist → siapa pun (opsi sesuai backend)
      setCanExecute(true);
      return;
    }
    setCanExecute(!!principal && allowlist.includes(principal));
  }, [proposal, principal]);

  /** =========================
   *  Handlers Commit–Reveal
   *  ========================= */
  const handleCommit = async () => {
    if (!backend) return alert("Backend not ready");
    if (!principal) return alert("Please connect wallet first.");
    if (!choiceCR) return alert("Choose YES or NO first.");

    try {
      setIsCommitting(true);
      const commitment = await voteCommitment(choiceCR, saltCR);
      // Panggil canister: commit_vote(id, principal, commitment)
      await backend.commit_vote(proposal.id, principal, commitment);

      // Simpan locally agar user bisa reveal nanti
      localStorage.setItem(
        `vote:${proposal.id}`,
        JSON.stringify({ choice: choiceCR, salt: saltCR, commitment })
      );

      alert("Commit stored. Keep your salt safe for the reveal phase.");
    } catch (e: any) {
      console.error(e);
      alert(e?.message ?? "Commit failed");
    } finally {
      setIsCommitting(false);
    }
  };

  const handleReveal = async () => {
    if (!backend) return alert("Backend not ready");
    if (!principal) return alert("Please connect wallet first.");

    try {
      setIsRevealing(true);
      // ambil dari localStorage jika user tidak mengisi ulang
      const cache = JSON.parse(localStorage.getItem(`vote:${proposal.id}`) || "{}");
      const c = (choiceCR || cache.choice) as "YES" | "NO";
      const s = (saltCR || cache.salt) as string;
      if (!c || !s) return alert("Missing choice/salt. Make sure you saved it.");
      // Panggil canister: reveal_vote(id, principal, choice, salt)
      await backend.reveal_vote(proposal.id, principal, c, s);
      alert("Reveal success!");
    } catch (e: any) {
      console.error(e);
      alert(e?.message ?? "Reveal failed");
    } finally {
      setIsRevealing(false);
    }
  };

  /** =========================
   *  Handler Execute Proposal
   *  ========================= */
  const handleExecute = async () => {
    if (!backend) return;
    try {
      setExecuting(true);
      await backend.execute_proposal(proposal.id);
      setExecuteOpen(false);
      alert("Proposal executed");
    } catch (e: any) {
      console.error(e);
      alert(e?.message ?? "Execute failed");
    } finally {
      setExecuting(false);
    }
  };

  /** =========================
   *  UI Helpers
   *  ========================= */
  const formatTimeRemaining = () => {
    if (timeRemaining.isExpired) return "Expired";
    if (timeRemaining.days > 0) {
      return `${timeRemaining.days} day${timeRemaining.days !== 1 ? "s" : ""
        }, ${timeRemaining.hours} hour${timeRemaining.hours !== 1 ? "s" : ""}`;
    }
    if (timeRemaining.hours > 0) {
      return `${timeRemaining.hours} hour${timeRemaining.hours !== 1 ? "s" : ""
        }, ${timeRemaining.minutes} minute${timeRemaining.minutes !== 1 ? "s" : ""
        }`;
    }
    return `${timeRemaining.minutes} minute${timeRemaining.minutes !== 1 ? "s" : ""
      }`;
  };

  return (
    <div className={`min-h-screen ${darkMode ? "bg-gray-900" : "bg-gray-50"}`}>
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Back Button */}
        <div className="mb-6">
          <Button
            onClick={() => navigate("/dashboard")}
            variant="outline"
            icon={ArrowLeft}
            className="mb-4"
          >
            Back to Dashboard
          </Button>
        </div>

        {/* Main Card */}
        <div
          className={`rounded-2xl shadow-xl overflow-hidden ${darkMode ? "bg-gray-800" : "bg-white"
            }`}
        >
          {/* Header */}
          <div className="relative">
            <img
              src={imageUrl || "/placeholder.svg"}
              alt={proposal.title}
              className="w-full h-80 object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>

            {/* Expired Overlay */}
            {timeRemaining.isExpired && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <div className="text-white text-center">
                  <AlertCircle size={48} className="mx-auto mb-2" />
                  <span className="text-2xl font-bold">PROPOSAL ENDED</span>
                </div>
              </div>
            )}

            <div className="absolute bottom-6 left-6 text-white">
              <div className="flex items-center gap-2 mb-3">
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${timeRemaining.isExpired ? "bg-red-500" : "bg-emerald-500"
                    }`}
                >
                  {categoryName}
                </span>
                <span className="text-base opacity-90">by {authorName}</span>

                {/* Badge Executable */}
                {(proposal as any).executable && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-purple-600">
                    <ShieldCheck size={16} />
                    Executable
                  </span>
                )}

                {timeRemaining.isExpired && (
                  <span className="px-3 py-1 rounded-full text-sm font-medium bg-red-600">
                    EXPIRED
                  </span>
                )}
              </div>
              <h1 className="text-4xl font-bold leading-tight">
                {proposal.title}
              </h1>
              {/* Mode + Phase info */}
              <div className="mt-2 text-sm opacity-90">
                Mode: <b>{votingMode}</b>
                {votingMode === "CommitReveal" && (
                  <>
                    {" "}
                    — Phase:{" "}
                    <b>
                      {phase === "COMMIT"
                        ? "Commit"
                        : phase === "REVEAL"
                          ? "Reveal"
                          : "Closed"}
                    </b>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-8">
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div
                className={`p-5 rounded-xl ${darkMode ? "bg-gray-700" : "bg-gray-100"
                  }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Clock
                    size={18}
                    className={
                      timeRemaining.isExpired
                        ? "text-red-500"
                        : "text-orange-500"
                    }
                  />
                  <span className="text-sm font-medium">Time Left</span>
                </div>
                <div
                  className={`text-xl font-bold ${timeRemaining.isExpired ? "text-red-500" : ""
                    }`}
                >
                  {formatTimeRemaining()}
                </div>
              </div>
              <div
                className={`p-5 rounded-xl ${darkMode ? "bg-gray-700" : "bg-gray-100"
                  }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Users size={18} className="text-blue-500" />
                  <span className="text-sm font-medium">Total Voters</span>
                </div>
                <div className="text-xl font-bold">
                  {totalVotersCount.toLocaleString()}
                </div>
              </div>
              <div
                className={`p-5 rounded-xl ${darkMode ? "bg-gray-700" : "bg-gray-100"
                  }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp size={18} className="text-green-500" />
                  <span className="text-sm font-medium">Total Votes</span>
                </div>
                <div className="text-xl font-bold">
                  {totalVotes.toLocaleString()}
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="mb-8">
              <h2
                className={`text-2xl font-bold mb-4 ${darkMode ? "text-white" : "text-gray-900"
                  }`}
              >
                Short Description
              </h2>
              <p
                className={`text-lg leading-relaxed ${darkMode ? "text-gray-300" : "text-gray-600"
                  }`}
              >
                {description}
              </p>
            </div>

            {(detailDescription as any) && (
              <div className="mb-8">
                <h2
                  className={`text-2xl font-bold mb-4 ${darkMode ? "text-white" : "text-gray-900"
                    }`}
                >
                  Detailed Description
                </h2>
                <p
                  className={`text-lg leading-relaxed ${darkMode ? "text-gray-300" : "text-gray-600"
                    }`}
                >
                  {detailDescription}
                </p>
              </div>
            )}

            {/* Voting Results */}
            <div className="mb-8">
              <h2
                className={`text-2xl font-bold mb-6 ${darkMode ? "text-white" : "text-gray-900"
                  }`}
              >
                Current Results
              </h2>
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center gap-3">
                      <CheckCircle size={24} className="text-green-500" />
                      <span className="text-lg font-medium">Yes</span>
                      <span className="text-sm text-gray-500">
                        ({yesVotes.toLocaleString()} votes)
                      </span>
                    </div>
                    <span className="text-xl font-bold text-green-500">
                      {yesPercentage.toFixed(1)}%
                    </span>
                  </div>
                  <div
                    className={`w-full bg-gray-200 rounded-full h-4 ${darkMode ? "bg-gray-700" : ""
                      }`}
                  >
                    <div
                      className="bg-gradient-to-r from-green-500 to-emerald-500 h-4 rounded-full transition-all duration-500"
                      style={{ width: `${yesPercentage}%` }}
                    ></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center gap-3">
                      <XCircle size={24} className="text-red-500" />
                      <span className="text-lg font-medium">No</span>
                      <span className="text-sm text-gray-500">
                        ({noVotes.toLocaleString()} votes)
                      </span>
                    </div>
                    <span className="text-xl font-bold text-red-500">
                      {noPercentage.toFixed(1)}%
                    </span>
                  </div>
                  <div
                    className={`w-full bg-gray-200 rounded-full h-4 ${darkMode ? "bg-gray-700" : ""
                      }`}
                  >
                    <div
                      className="bg-gradient-to-r from-red-500 to-pink-500 h-4 rounded-full transition-all duration-500"
                      style={{ width: `${noPercentage}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Voting Area */}
            {votingMode === "PublicInstant" ? (
              !isVotingDisabled ? (
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button
                    onClick={() => handleInstantVote("yes")}
                    variant="gradient"
                    icon={CheckCircle}
                    className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 shadow-green-500/25 text-lg py-4"
                  >
                    Vote Yes
                  </Button>
                  <Button
                    onClick={() => handleInstantVote("no")}
                    variant="gradient"
                    icon={XCircle}
                    className="flex-1 bg-gradient-to-r from-red-500 to-pink-600 shadow-red-500/25 text-lg py-4"
                  >
                    Vote No
                  </Button>
                </div>
              ) : (
                <div className="text-center p-6 bg-gray-100 dark:bg-gray-700 rounded-xl">
                  <div className="flex items-center justify-center gap-2 mb-3">
                    <AlertCircle size={24} className="text-red-500" />
                    <span className="text-lg font-medium text-red-500">
                      Voting Ended
                    </span>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400">
                    This proposal has ended and is no longer accepting votes.
                  </p>
                </div>
              )
            ) : (
              // Commit–Reveal UI
              <div
                className={`p-5 rounded-xl border ${darkMode ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-gray-50"
                  }`}
              >
                <h3
                  className={`text-xl font-semibold mb-3 ${darkMode ? "text-white" : "text-gray-900"
                    }`}
                >
                  Commit–Reveal Voting
                </h3>

                {phase === "COMMIT" && (
                  <div className="space-y-4">
                    <div className="flex gap-3">
                      <Button
                        variant={choiceCR === "YES" ? "gradient" : "outline"}
                        onClick={() => setChoiceCR("YES")}
                        icon={CheckCircle}
                      >
                        YES
                      </Button>
                      <Button
                        variant={choiceCR === "NO" ? "gradient" : "outline"}
                        onClick={() => setChoiceCR("NO")}
                        icon={XCircle}
                      >
                        NO
                      </Button>
                    </div>

                    <div>
                      <label className="block text-sm mb-1 opacity-80">
                        Secret Salt
                      </label>
                      <div className="flex gap-2">
                        <input
                          className={`flex-1 px-3 py-2 rounded-lg outline-none ${darkMode ? "bg-gray-700 text-white" : "bg-white"
                            } border ${darkMode ? "border-gray-600" : "border-gray-300"}`}
                          value={saltCR}
                          onChange={(e) => setSaltCR(e.target.value)}
                          placeholder="Your secret salt (keep it safe)"
                        />
                        <Button
                          variant="outline"
                          onClick={() => setSaltCR(crypto.randomUUID())}
                        >
                          Regenerate
                        </Button>
                      </div>
                      <p className="text-xs mt-2 text-amber-500">
                        Simpan salt ini. Kamu akan membutuhkannya saat Reveal.
                      </p>
                    </div>

                    <Button
                      onClick={handleCommit}
                      disabled={isCommitting}
                      className="relative bg-gradient-to-r from-indigo-500 to-purple-600"
                    >
                      {isCommitting && (
                        <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/60 border-t-transparent align-middle" />
                      )}
                      Commit Vote
                    </Button>

                  </div>
                )}

                {phase === "REVEAL" && (
                  <div className="space-y-4">
                    <div className="flex gap-3">
                      <Button
                        variant={choiceCR === "YES" ? "gradient" : "outline"}
                        onClick={() => setChoiceCR("YES")}
                        icon={CheckCircle}
                      >
                        YES
                      </Button>
                      <Button
                        variant={choiceCR === "NO" ? "gradient" : "outline"}
                        onClick={() => setChoiceCR("NO")}
                        icon={XCircle}
                      >
                        NO
                      </Button>
                    </div>

                    <div>
                      <label className="block text-sm mb-1 opacity-80">
                        Salt (same as when committing)
                      </label>
                      <input
                        className={`w-full px-3 py-2 rounded-lg outline-none ${darkMode ? "bg-gray-700 text-white" : "bg-white"
                          } border ${darkMode ? "border-gray-600" : "border-gray-300"}`}
                        value={saltCR}
                        onChange={(e) => setSaltCR(e.target.value)}
                        placeholder="Enter the exact same salt"
                      />
                    </div>

                    <Button
                      onClick={handleReveal}
                      disabled={isRevealing}
                      className="relative bg-gradient-to-r from-indigo-500 to-purple-600"
                    >
                      {isRevealing && (
                        <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/60 border-t-transparent align-middle" />
                      )}
                      Reveal Vote
                    </Button>

                  </div>
                )}

                {phase === "CLOSED" && (
                  <div className="text-center p-4 rounded-lg bg-gray-100 dark:bg-gray-700">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <AlertCircle size={20} className="text-red-500" />
                      <span className="font-medium">Voting Closed</span>
                    </div>
                    <p className="text-sm opacity-80">
                      This proposal is closed and no longer accepts commits or reveals.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Execute Proposal */}
            {(proposal as any).executable && (
              <div className="mt-8">
                <Button
                  onClick={() => setExecuteOpen(true)}
                  disabled={!canExecute}
                  className={`${canExecute
                    ? "bg-gradient-to-r from-purple-600 to-fuchsia-600"
                    : "bg-gray-400 cursor-not-allowed"
                    }`}
                  icon={ShieldCheck}
                >
                  Execute Proposal
                </Button>

                {/* Modal konfirmasi sederhana */}
                {executeOpen && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div
                      className={`w-full max-w-md rounded-xl p-6 ${darkMode ? "bg-gray-800 text-white" : "bg-white"
                        }`}
                    >
                      <h4 className="text-xl font-semibold mb-2">
                        Konfirmasi Eksekusi
                      </h4>
                      <p className="text-sm opacity-80 mb-6">
                        Aksi ini akan menjalankan action on-chain. Lanjutkan?
                      </p>
                      <div className="flex justify-end gap-3">
                        <Button
                          variant="outline"
                          onClick={() => setExecuteOpen(false)}
                        >
                          Batal
                        </Button>
                        <Button
                          onClick={handleExecute}
                          disabled={executing}
                          className="relative bg-gradient-to-r from-purple-600 to fuchsia-600"
                        >
                          {executing && (
                            <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/60 border-t-transparent align-middle" />
                          )}
                          Eksekusi
                        </Button>

                      </div>
                    </div>
                  </div>
                )}

                {!canExecute && (
                  <p className="mt-3 text-sm text-amber-500">
                    Kamu tidak ada dalam allowlist untuk mengeksekusi proposal ini.
                  </p>
                )}
              </div>
            )}

            {/* Voting Disabled (instan) message untuk mode Commit–Reveal */}
            {votingMode === "CommitReveal" && phase !== "CLOSED" && (
              <p className="mt-6 text-sm text-gray-500">
                *Instant vote disabled because this proposal uses Commit–Reveal.
              </p>
            )}

            {/* Voting Ended (instan) untuk mode instan */}
            {votingMode === "PublicInstant" && isVotingDisabled && (
              <div className="mt-8 text-center p-6 bg-gray-100 dark:bg-gray-700 rounded-xl">
                <div className="flex items-center justify-center gap-2 mb-3">
                  <AlertCircle size={24} className="text-red-500" />
                  <span className="text-lg font-medium text-red-500">
                    Voting Ended
                  </span>
                </div>
                <p className="text-gray-600 dark:text-gray-400">
                  This proposal has ended and is no longer accepting votes.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
