"use client";

import type { Proposal } from "@/@types";
import PaginationInfo from "@/features/Dashboard/components/PaginationInfo";
import StatCard from "@/features/Dashboard/components/StatCard";
import CreateProposalModal from "@/features/Proposal/components/CreateProposal/CreateProposalCard";
import ProposalDetailModal from "@/features/Proposal/components/DetailProposal/DetailProposalCard";
import ProposalCard from "@/features/Proposal/components/ProposalCard";
import { useAuth } from "@/hooks/useAuth";
import { usePagination } from "@/hooks/usePagination";
import Button from "@/shared/components/Button";
import Card from "@/shared/components/Card";
import Pagination from "@/shared/components/Pagination";
import { Award, Plus, TrendingUp, Users, Vote } from "lucide-react";
import { useEffect, useState } from "react";
import { Helmet } from "react-helmet";
import { voting_app_backend as backend } from "../../../../../declarations/voting-app-backend";
import { useDarkMode } from "../../../context/DarkModeContext";

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
  const { principal } = useAuth();

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

  // Fixed handleVote function for your Dashboard component

  // Fixed handleVote function for your Dashboard component

  const handleVote = async (proposalId: string, vote: "yes" | "no") => {
    try {
      if (!principal) {
        alert("Please connect your wallet first");
        return;
      }

      const proposalIdString = String(proposalId);
      const userPrincipal = principal.toString(); // pastikan ini string
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
    fetchProposals();
    fetchProposalStats();
  }, []);

  const handleProposalClick = (proposal: Proposal.Proposal) => {
    setSelectedProposal(proposal);
    setIsDetailModalOpen(true);
  };

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
                onClick={() => setIsCreateModalOpen(true)}
                variant="gradient"
                icon={Plus}
                size="lg"
              >
                Create Proposal
              </Button>
            </div>
          </div>
        </div>

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
          <div className="lg:col-span-2">
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
                  onClick={() => setIsCreateModalOpen(true)}
                  variant="gradient"
                  icon={Plus}
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

          {/* Recent Activity Section */}
          <div>
            <h2
              className={`text-2xl font-bold mb-6 ${
                darkMode ? "text-white" : "text-gray-900"
              }`}
            >
              Recent Activity
            </h2>
            <Card className="p-6" darkMode={darkMode}>
              <div className="space-y-4">
                {recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        activity.type === "vote"
                          ? "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
                          : activity.type === "create"
                          ? "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
                          : "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400"
                      }`}
                    >
                      {activity.type === "vote" ? (
                        <Vote size={16} />
                      ) : activity.type === "create" ? (
                        <TrendingUp size={16} />
                      ) : (
                        <Users size={16} />
                      )}
                    </div>
                    <div className="flex-1">
                      <p
                        className={`text-sm font-medium ${
                          darkMode ? "text-white" : "text-gray-900"
                        }`}
                      >
                        {activity.action}
                      </p>
                      <p
                        className={`text-sm ${
                          darkMode ? "text-gray-400" : "text-gray-600"
                        }`}
                      >
                        {activity.proposal}
                      </p>
                      <p
                        className={`text-xs ${
                          darkMode ? "text-gray-500" : "text-gray-500"
                        }`}
                      >
                        {activity.time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
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
