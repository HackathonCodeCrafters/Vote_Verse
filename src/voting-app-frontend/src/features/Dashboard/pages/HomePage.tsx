"use client";

import type { Proposal } from "@/@types";
import PaginationInfo from "@/features/Dashboard/components/PaginationInfo";
import StatCard from "@/features/Dashboard/components/StatCard";
import CreateProposalModal from "@/features/Proposal/components/CreateProposal/CreateProposalCard";
import ProposalDetailModal from "@/features/Proposal/components/DetailProposal/DetailProposalCard";
import ProposalCard from "@/features/Proposal/components/ProposalCard";
import { useAuth } from "@/hooks/useAuth";
import { usePagination } from "@/hooks/usePagination";
import { getUserByIdAPI, loadPersistedProfileId } from "@/ic/api";
import Button from "@/shared/components/Button";
import Card from "@/shared/components/Card";
import Pagination from "@/shared/components/Pagination";
import { Award, Plus, TrendingUp, User, Users, Vote } from "lucide-react";
import { useEffect, useState } from "react";
import { Helmet } from "react-helmet";
import { useNavigate } from "react-router-dom";
import { voting_app_backend as backend } from "../../../../../declarations/voting-app-backend";
import { useDarkMode } from "../../../context/DarkModeContext";
import AgentAICard from "../components/AgentAICard";
import RecentActivitySection from "../components/RecentActivitySection";

interface DashboardProps {
  onCreateProposal: () => void;
}

const recentActivity = [
  {
    action: "Voted Yes",
    proposal: "Increase Block Reward",
    time: "2 hours ago",
    type: "vote",
  },
  {
    action: "Created Proposal",
    proposal: "New Staking Mechanism",
    time: "1 day ago",
    type: "create",
  },
  {
    action: "Voted No",
    proposal: "Fee Structure Change",
    time: "2 days ago",
    type: "vote",
  },
  {
    action: "Delegated VP",
    proposal: "To CoreDev Team",
    time: "3 days ago",
    type: "delegate",
  },
];

export default function Dashboard({ onCreateProposal }: DashboardProps) {
  const { darkMode } = useDarkMode();
  const [proposals, setProposals] = useState<Proposal.Proposal[]>([]);
  const [stats, setStats] = useState<Proposal.ProposalStats | null>(null);
  const [selectedProposal, setSelectedProposal] =
    useState<Proposal.Proposal | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [hasProfile, setHasProfile] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  const { principal } = useAuth();
  const navigate = useNavigate();

  // Pagination hook
  const {
    currentPage,
    totalPages,
    currentData: currentProposals,
    goToPage,
    startIndex,
    endIndex,
    totalItems,
  } = usePagination({
    data: proposals,
    itemsPerPage: 10,
    initialPage: 1,
  });

  // Check if user has a profile
  const checkUserProfile = async () => {
    setProfileLoading(true);
    try {
      const profileId = loadPersistedProfileId();
      if (!profileId) {
        setHasProfile(false);
        return;
      }

      const profile = await getUserByIdAPI(profileId);
      setHasProfile(!!profile);
    } catch (error) {
      console.error("Error checking user profile:", error);
      setHasProfile(false);
    } finally {
      setProfileLoading(false);
    }
  };

  const handleCreateProposalClick = () => {
    if (!hasProfile) {
      // Show modal asking user to complete profile first
      const confirmed = window.confirm(
        "You need to complete your profile before creating a proposal. Would you like to go to the profile page now?"
      );
      if (confirmed) {
        navigate("/profile");
      }
      return;
    }
    navigate("/create-proposal");
  };

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

  const fetchProposals = async () => {
    try {
      const rawProposals = await backend.get_proposals();
      console.log("Raw proposals from backend:", rawProposals);

      const parsedProposals: Proposal.Proposal[] = rawProposals.map(
        (p: any) => {
          const yesVotes = Number(p.yes_votes || 0);
          const noVotes = Number(p.no_votes || 0);
          const totalVoters = yesVotes + noVotes;
          const createdAt = Number(p.created_at);

          return {
            id: p.id?.toString() || Math.random().toString(),
            title: p.title || "Untitled Proposal",
            description: p.description || "",
            full_description: p.full_description || p.description || "",
            image_url: p.image_url,
            image: p.image || p.image_url || "/placeholder.svg",
            votes: p.votes || {
              yes: yesVotes,
              no: noVotes,
            },
            yes_votes: yesVotes,
            no_votes: noVotes,
            created_at: createdAt,
            duration_days: Number(p.duration_days || 7),
            time_left:
              p.time_left ||
              calculateTimeLeft(createdAt, Number(p.duration_days || 7)),
            status:
              p.status ||
              getProposalStatus(createdAt, Number(p.duration_days || 7)),
            author: p.author || "Unknown",
            category: p.category || "General",
            total_voters: p.total_voters || totalVoters,
            discussions: p.discussions || 0,
            voters: [],

            // CamelCase compatibility
            yesVotes: yesVotes,
            noVotes: noVotes,
            createdAt: createdAt,
            durationDays: Number(p.duration_days || 7),

            // Add missing properties for Proposal type
            author_principal: p.author_principal || "",
            principalId: p.principalId || "",
          };
        }
      );

      parsedProposals.sort((a, b) => b.createdAt - a.createdAt);
      setProposals(parsedProposals);
    } catch (err) {
      console.error("Failed to fetch proposals:", err);
    }
  };

  const fetchProposalStats = async () => {
    try {
      const stats = await backend.get_proposal_stats();
      console.log("Stats from backend:", stats);

      setStats({
        totalProposals: BigInt(stats.total_proposals || 0),
        totalYesVotes: BigInt(stats.total_yes_votes || 0),
        totalNoVotes: BigInt(stats.total_no_votes || 0),
        totalVotes: BigInt(stats.total_votes || 0),
      });
    } catch (err) {
      console.error("Failed to fetch Proposal stats:", err);
    }
  };

  const handleVote = async (proposalId: string, vote: "yes" | "no") => {
    try {
      if (!principal) {
        alert("Please connect your wallet first");
        return;
      }

      const proposalIdString = String(proposalId);
      const userPrincipal = principal.toString();
      const voteChoices = vote === "yes" ? { Yes: null } : { No: null };

      console.log("Voting with:", {
        proposalId: proposalIdString,
        userPrincipal,
        choice: voteChoices,
      });

      const result = await backend.vote_proposal(
        proposalIdString,
        userPrincipal,
        voteChoices
      );

      if ("Ok" in result) {
        console.log(`Voted ${vote} on proposal ${proposalId}`);
        setIsDetailModalOpen(false);
        await fetchProposals();
        await fetchProposalStats();
      } else {
        alert(`Vote failed: ${result.Err}`);
      }
    } catch (err) {
      console.error("Voting error:", err);
      alert(
        "Something went wrong during voting. Please check the console for details."
      );
    }
  };

  const handleCreateProposal = async (proposalData: {
    title: string;
    description: string;
    image_url?: string;
    duration?: string | number;
    full_description?: string;
    category?: string;
    image?: string;
    author?: string;
  }) => {
    try {
      const durationDays = Number.parseInt(
        proposalData.duration?.toString() || "7"
      );

      const proposalId = await backend.add_proposal(
        proposalData.title,
        proposalData.description,
        proposalData.image_url ? [proposalData.image_url] : [],
        durationDays,
        proposalData.full_description ? [proposalData.full_description] : [],
        proposalData.category ? [proposalData.category] : ["General"],
        proposalData.image
          ? [proposalData.image]
          : proposalData.image_url
          ? [proposalData.image_url]
          : ["/placeholder.svg"],
        proposalData.author ? [proposalData.author] : [],
        []
      );

      console.log("New Proposal created with ID:", proposalId);
      setIsCreateModalOpen(false);
      await fetchProposals();
      await fetchProposalStats();
    } catch (err) {
      console.error("Failed to create Proposal:", err);
      alert("Failed to create Proposal. Please try again.");
      throw err;
    }
  };

  useEffect(() => {
    checkUserProfile();
    fetchProposals();
    fetchProposalStats();
  }, []);

  const handleProposalClick = (proposal: Proposal.Proposal) => {
    setSelectedProposal(proposal);
    setIsDetailModalOpen(true);
  };

  // Profile incomplete notification component
  const ProfileIncompleteNotice = () => (
    <div
      className={`mb-6 rounded-lg border p-4 ${
        darkMode
          ? "bg-yellow-900/20 border-yellow-800 text-yellow-300"
          : "bg-yellow-50 border-yellow-200 text-yellow-800"
      }`}
    >
      <div className="flex items-start space-x-3">
        <User size={20} className="mt-0.5" />
        <div className="flex-1">
          <h3 className="font-medium">Complete Your Profile</h3>
          <p className="text-sm mt-1 opacity-90">
            You need to complete your profile before creating proposals. This
            helps the community know who you are.
          </p>
          <Button
            onClick={() => navigate("/profile")}
            variant="secondary"
            size="sm"
            className="mt-3"
          >
            Complete Profile
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <Helmet>
        <title>Dashboard Vote - VoteVerse</title>
      </Helmet>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className={`mb-8 ${darkMode ? "text-white" : "text-gray-900"}`}>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">
                Welcome back, Voter! 👋
              </h1>
              <p
                className={`text-lg ${
                  darkMode ? "text-gray-300" : "text-gray-600"
                }`}
              >
                Here's what's happening in the governance space
              </p>
            </div>

            <div className="hidden md:block">
              <Button
                onClick={handleCreateProposalClick}
                variant="gradient"
                icon={Plus}
                size="lg"
                disabled={profileLoading}
              >
                {profileLoading ? "Loading..." : "Create Proposal"}
              </Button>
            </div>
          </div>
        </div>

        {/* Profile incomplete notice */}
        {!profileLoading && !hasProfile && <ProfileIncompleteNotice />}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats ? (
            <>
              <StatCard
                label="Total Proposals"
                value={stats.totalProposals.toString()}
                icon={Vote}
                color="from-blue-500 to-cyan-500"
                darkMode={darkMode}
              />
              <StatCard
                label="Yes Votes"
                value={stats.totalYesVotes.toString()}
                icon={TrendingUp}
                color="from-green-500 to-emerald-500"
                darkMode={darkMode}
              />
              <StatCard
                label="No Votes"
                value={stats.totalNoVotes.toString()}
                icon={Award}
                color="from-yellow-500 to-orange-500"
                darkMode={darkMode}
              />
              <StatCard
                label="Total Voters"
                value={stats.totalVotes.toString()}
                icon={Users}
                color="from-purple-500 to-pink-500"
                darkMode={darkMode}
              />
            </>
          ) : (
            <div className="col-span-4">
              <p className="text-gray-500 text-center">Loading stats...</p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Active Proposals */}
          <div className="lg:col-span-2 rounded-2xl border backdrop-blur-sm bg-gray-800/50 border-gray-700 hover:bg-gray-800/70 overflow-hidden p-4">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2
                  className={`text-2xl font-bold ${
                    darkMode ? "text-white" : "text-gray-900"
                  }`}
                >
                  Active Proposals
                </h2>
                <PaginationInfo
                  startIndex={startIndex}
                  endIndex={endIndex}
                  totalItems={totalItems}
                  darkMode={darkMode}
                  className="mt-1"
                />
              </div>
              <div className="md:hidden">
                <Button
                  onClick={handleCreateProposalClick}
                  variant="gradient"
                  icon={Plus}
                  disabled={profileLoading}
                >
                  Create
                </Button>
              </div>
            </div>

            <div className="space-y-6 mb-8">
              {currentProposals.length > 0 ? (
                currentProposals.map((proposal) => (
                  <ProposalCard
                    key={proposal.id}
                    proposal={proposal}
                    onClick={handleProposalClick}
                  />
                ))
              ) : (
                <Card className="p-8 text-center" darkMode={darkMode}>
                  <p
                    className={`text-lg ${
                      darkMode ? "text-gray-300" : "text-gray-600"
                    }`}
                  >
                    No proposals yet. Be the first to create one!
                  </p>
                </Card>
              )}
            </div>

            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <PaginationInfo
                  startIndex={startIndex}
                  endIndex={endIndex}
                  totalItems={totalItems}
                  darkMode={darkMode}
                  className="order-2 sm:order-1"
                />
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={goToPage}
                  darkMode={darkMode}
                  className="order-1 sm:order-2"
                />
              </div>
            )}
          </div>

          <div className="lg:col-span-1 space-y-8">
            <AgentAICard darkMode={darkMode} />
            <RecentActivitySection darkMode={darkMode} />
          </div>
        </div>

        {/* Detail Proposal Modal */}
        <ProposalDetailModal
          proposal={selectedProposal}
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          onVote={handleVote}
        />

        {/* Create Proposal Modal */}
        <CreateProposalModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onCreateProposal={handleCreateProposal}
        />
      </div>
    </>
  );
}
