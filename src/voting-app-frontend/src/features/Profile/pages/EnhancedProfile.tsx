// src/features/Profile/pages/EnhancedProfile.tsx

"use client";

import type { Proposal } from "@/@types";
import ProposalCard from "@/features/Proposal/components/ProposalCard";
import { useAuth } from "@/hooks/useAuth";
import Button from "@/shared/components/Button";
import Card from "@/shared/components/Card";
import Pagination from "@/shared/components/Pagination";
import {
  Activity,
  AlertCircle,
  Award,
  Calendar,
  Edit3,
  FileText,
  Lock,
  Plus,
  Settings,
  Shield,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Helmet } from "react-helmet";
import { useNavigate } from "react-router-dom";
import { voting_app_backend as backend } from "../../../../../declarations/voting-app-backend";
import { useDarkMode } from "../../../context/DarkModeContext";
import ProfileInformation from "../components/ProfileInformation";
import type { Profile } from "../types/profile";

/** ──────────────────────────────────────────────────────────────
 * Candid Option<T> helper: Some(T) => [T], None => []
 * ────────────────────────────────────────────────────────────── */
function unwrapOpt<T>(o: any, fallback?: T): T | undefined {
  if (Array.isArray(o)) return o[0] as T;
  if (o === null || o === undefined) return fallback;
  return o as T;
}

/** Principal normalizer that avoids TS narrowing issues */
type PrincipalLike =
  | string
  | { toText?: () => string; toString?: () => string }
  | null
  | undefined;

const toPrincipalText = (p: PrincipalLike, fallback = ""): string => {
  if (!p) return fallback;
  if (typeof p === "string") return p;
  if (typeof (p as any).toText === "function") return (p as any).toText();
  if (typeof (p as any).toString === "function") return (p as any).toString();
  return fallback;
};

interface EnhancedProfilePageProps {
  darkMode?: boolean;
  principal?: string;
  userName?: string;
  userAvatar?: string;
  votingPower?: number;
  onUpdateProfile?: (data: any) => void;
}

export default function EnhancedProfilePage({
  principal: propPrincipal,
  userName = "John Doe",
  userAvatar,
  votingPower = 1250,
  onUpdateProfile,
}: EnhancedProfilePageProps) {
  const { darkMode } = useDarkMode();
  const { principal: authPrincipal, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [isEditing, setIsEditing] = useState(false);
  const [userProposals, setUserProposals] = useState<Proposal.Proposal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"profile" | "proposals">(
    "profile"
  );

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const proposalsPerPage = 6;
  const totalPages = Math.ceil(userProposals.length / proposalsPerPage);
  const startIndex = (currentPage - 1) * proposalsPerPage;
  const currentProposals = userProposals.slice(
    startIndex,
    startIndex + proposalsPerPage
  );

  // Profile form state
  const [profileData, setProfileData] = useState<Profile>({
    id: "user-1",
    name: userName,
    username: userName.toLowerCase().replace(/\s+/g, ""),
    email: "john.doe@example.com",
    bio: "Passionate about decentralized governance and blockchain technology. Active participant in community voting.",
    location: "San Francisco, CA",
    website: "https://johndoe.dev",
    avatar: userAvatar || "",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  const settingsConfig = [
    {
      key: "emailNotifications",
      label: "Email Notifications",
      description: "Receive email notifications for important updates",
    },
    {
      key: "voteReminders",
      label: "Vote Reminders",
      description: "Get reminded about ongoing votes",
    },
    {
      key: "proposalUpdates",
      label: "Proposal Updates",
      description: "Notifications for proposal status changes",
    },
    {
      key: "profileVisibility",
      label: "Profile Visibility",
      description: "Make your profile visible to other users",
    },
    {
      key: "activityTracking",
      label: "Activity Tracking",
      description: "Track your voting activity and statistics",
    },
  ] as const;

  const [settings, setSettings] = useState({
    emailNotifications: true,
    voteReminders: true,
    proposalUpdates: false,
    profileVisibility: true,
    activityTracking: true,
  });

  const calculateTimeLeft = (
    createdAt: number,
    durationDays: number
  ): string => {
    const now = Date.now() / 1000;
    const endTime = createdAt + durationDays * 86400;
    const timeLeft = endTime - now;
    if (timeLeft <= 0) return "Ended";
    const days = Math.floor(timeLeft / 86400);
    const hours = Math.floor((timeLeft % 86400) / 3600);
    if (days > 0) return `${days} days`;
    if (hours > 0) return `${hours} hours`;
    return "Less than 1 hour";
  };

  const getProposalStatus = (
    createdAt: number,
    durationDays: number
  ): string => {
    const now = Date.now() / 1000;
    const endTime = createdAt + durationDays * 86400;
    return now < endTime ? "active" : "ended";
  };

  /** Normalizer dari backend → type Proposal frontend (hindari snake_case di object final) */
  const normalizeProposal = (
    p: any,
    ownerPrincipal: string
  ): Proposal.Proposal => {
    const imgUrl = unwrapOpt<string>(p.image_url);
    const fullDesc =
      unwrapOpt<string>(p.full_description) ?? p.description ?? "";
    const image = unwrapOpt<string>(p.image) ?? imgUrl ?? "/placeholder.svg";
    const category = unwrapOpt<string>(p.category) ?? "General";
    const author = unwrapOpt<string>(p.author) ?? "Unknown";
    const timeLeft = unwrapOpt<string>(p.time_left);
    const status = unwrapOpt<string>(p.status);

    const votesObj = unwrapOpt<{ yes: number; no: number }>(p.votes);
    const yes = votesObj
      ? Number(votesObj.yes)
      : Number(p.yes_votes ?? p.yesVotes ?? 0);
    const no = votesObj
      ? Number(votesObj.no)
      : Number(p.no_votes ?? p.noVotes ?? 0);
    const totalVoters = Number(p.total_voters ?? p.totalVoters ?? yes + no);

    const created_at = Number(p.created_at ?? p.createdAt ?? 0);
    const duration_days = Number(p.duration_days ?? p.durationDays ?? 7);

    return {
      id: String(p.id ?? crypto.randomUUID()),
      title: p.title || "Untitled Proposal",
      description: p.description || "",
      full_description: fullDesc,

      imageUrl: imgUrl,
      image,

      votes: votesObj ?? { yes, no },
      yesVotes: yes,
      noVotes: no,

      createdAt: created_at,
      durationDays: duration_days,

      time_left: timeLeft ?? calculateTimeLeft(created_at, duration_days),
      status: status ?? getProposalStatus(created_at, duration_days),
      category,
      author,

      totalVoters: totalVoters,
      discussions: Number(p.discussions ?? 0),

      // bidang yang dipakai router
      author_principal: ownerPrincipal,
      principalId: ownerPrincipal,
    } as unknown as Proposal.Proposal;
  };

  /** Fetch Proposals by user principal (canister) */
  const fetchUserProposals = async () => {
    try {
      setIsLoading(true);

      const principalText = toPrincipalText(
        propPrincipal ?? (authPrincipal as PrincipalLike),
        ""
      );
      if (!principalText) {
        setUserProposals([]);
        return;
      }

      const rawProposals = await backend.get_proposal_by_user_id(principalText);
      const parsed: Proposal.Proposal[] = (rawProposals as any[])
        .map((p) =>
          normalizeProposal(p, unwrapOpt<string>(p.user_id) ?? principalText)
        )
        .sort(
          (a, b) => Number((b as any).createdAt) - Number((a as any).createdAt)
        );

      setUserProposals(parsed);
    } catch (err) {
      console.error("Failed to fetch user proposals:", err);
      setUserProposals([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && (propPrincipal || authPrincipal)) {
      fetchUserProposals();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, propPrincipal, authPrincipal]);

  const handleSaveProfile = () => {
    onUpdateProfile?.(profileData);
    setIsEditing(false);
  };

  const handleProposalClick = (proposal: Proposal.Proposal) => {
    const owner =
      (proposal as any).principalId ??
      (proposal as any).author_principal ??
      "unknown";
    navigate(`/proposal/${owner}/${(proposal as any).id}`);
  };

  return (
    <>
      <Helmet>
        <title>Profile - VoteVerse</title>
      </Helmet>
      <div
        className={`min-h-screen transition-colors duration-300 ${
          darkMode ? "bg-gray-900" : "bg-gray-50"
        }`}
      >
        <div className="max-w-6xl mx-auto px-4 py-8">
          {/* Header + Tabs */}
          <div className="mb-8">
            <h1
              className={`text-3xl font-bold mb-2 ${
                darkMode ? "text-white" : "text-gray-900"
              }`}
            >
              Profile
            </h1>
            <p
              className={`text-lg mb-6 ${
                darkMode ? "text-gray-400" : "text-gray-600"
              }`}
            >
              Manage your account settings and view your proposals
            </p>

            <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg w-fit">
              <button
                onClick={() => setActiveTab("profile")}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeTab === "profile"
                    ? "bg-white text-gray-900 shadow dark:bg-gray-700 dark:text-white"
                    : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                }`}
              >
                Profile Settings
              </button>
              <button
                onClick={() => setActiveTab("proposals")}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeTab === "proposals"
                    ? "bg-white text-gray-900 shadow dark:bg-gray-700 dark:text-white"
                    : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                }`}
              >
                My Proposals ({userProposals.length})
              </button>
            </div>
          </div>

          {/* Profile Tab */}
          {activeTab === "profile" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <ProfileInformation
                  profileData={profileData}
                  setProfileData={(data) => setProfileData(data)}
                  darkMode={darkMode}
                  isEditing={isEditing}
                  setIsEditing={setIsEditing}
                  handleSaveProfile={handleSaveProfile}
                />

                <div
                  className={`rounded-lg border p-6 ${
                    darkMode
                      ? "bg-gray-800 border-gray-700"
                      : "bg-white border-gray-200"
                  }`}
                >
                  <div className="flex items-center space-x-2 mb-6">
                    <Settings
                      size={20}
                      className={darkMode ? "text-white" : "text-gray-900"}
                    />
                    <h2
                      className={`text-xl font-semibold ${
                        darkMode ? "text-white" : "text-gray-900"
                      }`}
                    >
                      Notification Settings
                    </h2>
                  </div>

                  <div className="space-y-4">
                    {settingsConfig.map((setting) => (
                      <div
                        key={setting.key}
                        className="flex items-center justify-between"
                      >
                        <div className="flex-1">
                          <label
                            className={`text-sm font-medium ${
                              darkMode ? "text-gray-300" : "text-gray-700"
                            }`}
                          >
                            {setting.label}
                          </label>
                          <p
                            className={`text-xs ${
                              darkMode ? "text-gray-500" : "text-gray-500"
                            }`}
                          >
                            {setting.description}
                          </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={(settings as any)[setting.key]}
                            onChange={(e) =>
                              setSettings({
                                ...settings,
                                [setting.key]: e.target.checked,
                              })
                            }
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-2 00 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600" />
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                <div
                  className={`rounded-lg border p-6 ${
                    darkMode
                      ? "bg-gray-800 border-gray-700"
                      : "bg-white border-gray-200"
                  }`}
                >
                  <h2
                    className={`text-xl font-semibold mb-6 ${
                      darkMode ? "text-white" : "text-gray-900"
                    }`}
                  >
                    Statistics
                  </h2>

                  {[
                    {
                      label: "Voting Power",
                      value: votingPower.toLocaleString(),
                      icon: Award,
                      color: "blue",
                    },
                    {
                      label: "Proposals Created",
                      value: userProposals.length.toString(),
                      icon: Edit3,
                      color: "purple",
                    },
                    {
                      label: "Active Proposals",
                      value: userProposals
                        .filter((p: any) => p.status === "active")
                        .length.toString(),
                      icon: Activity,
                      color: "green",
                    },
                    {
                      label: "Community Rank",
                      value: "#142",
                      icon: Shield,
                      color: "orange",
                    },
                  ].map((stat, i) => {
                    const Icon = stat.icon;
                    return (
                      <div
                        key={i}
                        className="flex items-center justify-between mb-3 last:mb-0"
                      >
                        <div className="flex items-center space-x-3">
                          <div
                            className={`p-2 rounded-lg ${
                              darkMode ? "bg-gray-700" : "bg-gray-100"
                            }`}
                          >
                            <Icon
                              size={16}
                              className={
                                darkMode ? "text-gray-300" : "text-gray-600"
                              }
                            />
                          </div>
                          <span
                            className={`text-sm ${
                              darkMode ? "text-gray-300" : "text-gray-700"
                            }`}
                          >
                            {stat.label}
                          </span>
                        </div>
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${
                            {
                              blue: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
                              green:
                                "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
                              purple:
                                "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
                              orange:
                                "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
                            }[
                              stat.color as
                                | "blue"
                                | "green"
                                | "purple"
                                | "orange"
                            ]
                          }`}
                        >
                          {stat.value}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <div
                  className={`rounded-lg border p-6 ${
                    darkMode
                      ? "bg-gray-800 border-gray-700"
                      : "bg-white border-gray-200"
                  }`}
                >
                  <h2
                    className={`text-xl font-semibold mb-6 ${
                      darkMode ? "text-white" : "text-gray-900"
                    }`}
                  >
                    Account Information
                  </h2>

                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <Calendar
                        size={16}
                        className={darkMode ? "text-gray-400" : "text-gray-500"}
                      />
                      <div>
                        <p
                          className={`text-sm font-medium ${
                            darkMode ? "text-gray-300" : "text-gray-700"
                          }`}
                        >
                          Member Since
                        </p>
                        <p
                          className={`text-xs ${
                            darkMode ? "text-gray-500" : "text-gray-500"
                          }`}
                        >
                          {profileData.joinDate}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <Shield
                        size={16}
                        className={darkMode ? "text-gray-400" : "text-gray-500"}
                      />
                      <div>
                        <p
                          className={`text-sm font-medium ${
                            darkMode ? "text-gray-300" : "text-gray-700"
                          }`}
                        >
                          Account Status
                        </p>
                        <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                          Verified
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <Lock
                        size={16}
                        className={darkMode ? "text-gray-400" : "text-gray-500"}
                      />
                      <div>
                        <p
                          className={`text-sm font-medium ${
                            darkMode ? "text-gray-300" : "text-gray-700"
                          }`}
                        >
                          Identity Provider
                        </p>
                        <p
                          className={`text-xs ${
                            darkMode ? "text-gray-500" : "text-gray-500"
                          }`}
                        >
                          Internet Identity
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div
                  className={`rounded-lg border p-4 ${
                    darkMode
                      ? "bg-blue-900/20 border-blue-800"
                      : "bg-blue-50 border-blue-200"
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <AlertCircle
                      size={16}
                      className={
                        darkMode
                          ? "text-blue-300 mt-0.5"
                          : "text-blue-500 mt-0.5"
                      }
                    />
                    <div>
                      <p
                        className={`text-sm font-medium ${
                          darkMode ? "text-blue-300" : "text-blue-800"
                        }`}
                      >
                        Security Tip
                      </p>
                      <p
                        className={`text-xs mt-1 ${
                          darkMode ? "text-blue-400" : "text-blue-700"
                        }`}
                      >
                        Keep your Internet Identity secure and never share your
                        recovery phrases.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Proposals Tab */}
          {activeTab === "proposals" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2
                    className={`text-2xl font-bold ${
                      darkMode ? "text-white" : "text-gray-900"
                    }`}
                  >
                    My Proposals
                  </h2>
                  <p
                    className={`text-lg mt-1 ${
                      darkMode ? "text-gray-400" : "text-gray-600"
                    }`}
                  >
                    {userProposals.length === 0
                      ? "You haven't created any proposals yet"
                      : `Showing ${Math.min(
                          currentProposals.length,
                          userProposals.length
                        )} of ${userProposals.length} proposals`}
                  </p>
                </div>
                <Button
                  onClick={() => navigate("/create-proposal")}
                  variant="gradient"
                  icon={Plus}
                >
                  Create Proposal
                </Button>
              </div>

              {isLoading ? (
                <Card className="p-8 text-center" darkMode={darkMode}>
                  <div className="flex items-center justify-center space-x-3">
                    <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    <span
                      className={`text-lg ${
                        darkMode ? "text-gray-300" : "text-gray-600"
                      }`}
                    >
                      Loading your proposals...
                    </span>
                  </div>
                </Card>
              ) : userProposals.length === 0 ? (
                <Card className="p-12 text-center" darkMode={darkMode}>
                  <FileText
                    size={48}
                    className={`mx-auto mb-4 ${
                      darkMode ? "text-gray-400" : "text-gray-500"
                    }`}
                  />
                  <h3
                    className={`text-xl font-semibold mb-2 ${
                      darkMode ? "text-white" : "text-gray-900"
                    }`}
                  >
                    No proposals yet
                  </h3>
                  <p
                    className={`text-lg mb-6 ${
                      darkMode ? "text-gray-400" : "text-gray-600"
                    }`}
                  >
                    Get started by creating your first proposal
                  </p>
                  <Button
                    onClick={() => navigate("/create-proposal")}
                    variant="gradient"
                    icon={Plus}
                  >
                    Create Your First Proposal
                  </Button>
                </Card>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {currentProposals.map((p) => (
                      <ProposalCard
                        key={(p as any).id}
                        proposal={p}
                        onClick={handleProposalClick}
                      />
                    ))}
                  </div>

                  {totalPages > 1 && (
                    <div className="flex justify-center mt-8">
                      <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={setCurrentPage}
                        darkMode={darkMode}
                      />
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
