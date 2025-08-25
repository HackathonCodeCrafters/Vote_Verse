// src/pages/ProposalDetailPage.tsx

import type { Proposal } from "@/@types/proposal";
import { useDarkMode } from "@/context/DarkModeContext";
import { useCountdown } from "@/features/Dashboard/utils/proposalTime";
import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

// Chakra UI - gunakan alias utk Avatar agar tidak konflik v2/v3
import {
  Avatar,
  Badge,
  Box,
  Button,
  Container,
  Grid,
  GridItem,
  HStack,
  Text,
  VStack,
} from "@chakra-ui/react";

// Icons
import {
  ArrowLeft,
  BarChart3,
  Bookmark,
  Calendar,
  Eye,
  MessageCircle,
} from "lucide-react";

// Reusable local components
import ProposalDescription from "@/features/Proposal/components/DetailProposal/DescriptionDetailProposal";
import ProposalHeader from "@/features/Proposal/components/DetailProposal/HeaderDetailProposal";
import ProposalStats from "@/features/Proposal/components/DetailProposal/StatsDetailProposal";
import VotingButtons from "@/features/Proposal/components/DetailProposal/VotingButtonDetailProposal";
import VotingResults from "@/features/Proposal/components/DetailProposal/VotingResultDetailProposal";

export default function GetProposalPage() {
  const { user = "", id = "" } = useParams<{ user: string; id: string }>();
  const navigate = useNavigate();
  const { darkMode } = useDarkMode();

  const [proposal, setProposal] = useState<Proposal | null>(null);

  // ---- Normalisasi waktu dari berbagai bentuk field ----
  const createdAtString = useMemo(() => {
    if (!proposal) return new Date().toISOString();

    // number epoch (detik)
    if (typeof proposal.createdAt === "number") {
      return new Date(proposal.createdAt * 1000).toISOString();
    }

    // backend snake_case: created_at (number)
    const backendCreatedAt = (proposal as any).created_at;
    if (typeof backendCreatedAt === "number") {
      return new Date(backendCreatedAt * 1000).toISOString();
    }

    // string ISO fallback
    return (proposal as any).createdAt || new Date().toISOString();
  }, [proposal]);

  const durationDays = useMemo(() => {
    if (!proposal) return 7;
    const frontend = (proposal as any).durationDays;
    const backend = (proposal as any).duration_days;
    const d = frontend ?? backend ?? 7;
    return typeof d === "number" ? d : Number.parseInt(String(d), 10) || 7;
  }, [proposal]);

  const timeRemaining = useCountdown(createdAtString, durationDays);

  // ---- Normalisasi votes (mendukung votes{yes,no}, yesVotes/noVotes, yes_votes/no_votes) ----
  const yesVotes = useMemo(() => {
    if (!proposal) return 0;
    return (
      (proposal as any).votes?.yes ??
      (proposal as any).yesVotes ??
      (proposal as any).yes_votes ??
      0
    );
  }, [proposal]);

  const noVotes = useMemo(() => {
    if (!proposal) return 0;
    return (
      (proposal as any).votes?.no ??
      (proposal as any).noVotes ??
      (proposal as any).no_votes ??
      0
    );
  }, [proposal]);

  const totalVotes = yesVotes + noVotes;
  const yesPercentage = totalVotes > 0 ? (yesVotes / totalVotes) * 100 : 0;
  const noPercentage = totalVotes > 0 ? (noVotes / totalVotes) * 100 : 0;

  const imageUrl =
    (proposal as any)?.image ??
    (proposal as any)?.imageUrl ??
    (proposal as any)?.image_url ??
    "/placeholder.svg";
  const description = (proposal as any)?.description ?? "";
  // ⬇️ gunakan key gabungan agar tidak error TS
  const detailDescription =
    (proposal as any)?.full_description ??
    (proposal as any)?.fullDescription ??
    "";
  const totalVotersCount =
    (proposal as any)?.total_voters ??
    (proposal as any)?.totalVoters ??
    totalVotes;
  const categoryName = (proposal as any)?.category ?? "General";
  const authorName = (proposal as any)?.author ?? "Anonymous";

  const formatTimeRemaining = () => {
    if (timeRemaining.isExpired) return "Expired";
    if (timeRemaining.days > 0)
      return `${timeRemaining.days}d ${timeRemaining.hours}h`;
    if (timeRemaining.hours > 0)
      return `${timeRemaining.hours}h ${timeRemaining.minutes}m`;
    return `${timeRemaining.minutes}m`;
  };

  const isVotingDisabled =
    timeRemaining.isExpired || (proposal as any)?.status === "ended";

  const handleVote = async (proposalId: string, vote: "yes" | "no") => {
    try {
      console.log(`You voted ${vote.toUpperCase()} on ${proposalId}`);
      // TODO: panggil canister vote_proposal
    } catch {
      console.error("Failed to submit vote");
    }
  };

  // Theming
  const cardBg = darkMode ? "gray.800" : "white";
  const borderCol = darkMode ? "whiteAlpha.300" : "blackAlpha.200";
  const textMuted = darkMode ? "gray.300" : "gray.600";

  const CustomDivider = ({ my = 6 }: { my?: number }) => (
    <Box height="1px" bg={borderCol} my={my} width="100%" />
  );

  return (
    <Box minH="100vh" bg={darkMode ? "#0A0A0F" : "gray.50"}>
      <Container maxW="7xl" py={{ base: 6, md: 10 }}>
        {/* Back */}
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          colorScheme={darkMode ? "whiteAlpha" : "gray"}
          mb={6}
        >
          <HStack>
            <ArrowLeft size={16} />
            <Text>Back</Text>
          </HStack>
        </Button>

        <Grid templateColumns={{ base: "1fr", lg: "2fr 1fr" }} gap={8}>
          {/* Main */}
          <GridItem>
            {proposal && (
              <Box
                bg={cardBg}
                borderWidth="1px"
                borderColor={borderCol}
                rounded="2xl"
                p={{ base: 4, md: 6 }}
                mb={6}
              >
                <ProposalHeader
                  title={(proposal as any).title}
                  imageUrl={imageUrl}
                  categoryName={categoryName}
                  authorName={authorName}
                  isExpired={timeRemaining.isExpired}
                  onClose={() => navigate(-1)}
                />

                <HStack mt={4} color={textMuted} flexWrap="wrap" gap={4}>
                  <HStack>
                    <Calendar size={16} />
                    <Text fontSize="sm">
                      Created {new Date(createdAtString).toLocaleDateString()}
                    </Text>
                  </HStack>
                  <HStack>
                    <Eye size={16} />
                    <Text fontSize="sm">{totalVotersCount} voters</Text>
                  </HStack>
                  <HStack>
                    <MessageCircle size={16} />
                    <Text fontSize="sm">{totalVotes} votes</Text>
                  </HStack>
                </HStack>
              </Box>
            )}

            <Box
              bg={cardBg}
              borderWidth="1px"
              borderColor={borderCol}
              rounded="2xl"
              p={{ base: 4, md: 6 }}
            >
              <ProposalStats
                timeRemaining={formatTimeRemaining()}
                isExpired={timeRemaining.isExpired}
                totalVoters={totalVotersCount}
                totalVotes={totalVotes}
                darkMode={darkMode}
              />

              <CustomDivider my={6} />

              <ProposalDescription
                description={description}
                detailDescription={detailDescription}
                darkMode={darkMode}
              />

              <CustomDivider my={6} />

              <VotingResults
                yesVotes={yesVotes}
                noVotes={noVotes}
                yesPercentage={yesPercentage}
                noPercentage={noPercentage}
                darkMode={darkMode}
              />
            </Box>
          </GridItem>

          {/* Sidebar */}
          <GridItem>
            <VStack gap={6}>
              <Box
                bg={cardBg}
                borderWidth="1px"
                borderColor={borderCol}
                rounded="2xl"
                p={5}
                w="full"
              >
                <Text fontWeight="bold" mb={3}>
                  Quick Stats
                </Text>
                <VStack gap={3} align="stretch">
                  <HStack justify="space-between">
                    <Text color={textMuted}>Total Votes</Text>
                    <Text fontWeight="semibold">{totalVotes}</Text>
                  </HStack>
                  <HStack justify="space-between">
                    <Text color={textMuted}>Approval</Text>
                    <Text fontWeight="semibold">
                      {yesPercentage.toFixed(0)}%
                    </Text>
                  </HStack>
                  <HStack justify="space-between">
                    <Text color={textMuted}>Time Left</Text>
                    <Badge
                      colorScheme={timeRemaining.isExpired ? "red" : "green"}
                    >
                      {formatTimeRemaining()}
                    </Badge>
                  </HStack>
                </VStack>

                <Button
                  mt={4}
                  w="full"
                  variant="outline"
                  onClick={() => navigate(`/proposal/${user}/${id}/analytics`)}
                >
                  <HStack>
                    <BarChart3 size={16} />
                    <Text>View Analytics</Text>
                  </HStack>
                </Button>
              </Box>

              <Box
                bg={cardBg}
                borderWidth="1px"
                borderColor={borderCol}
                rounded="2xl"
                p={5}
                w="full"
              >
                <Text fontWeight="bold" mb={3}>
                  Cast Your Vote
                </Text>
                <VotingButtons
                  proposalId={(proposal as any)?.id || id}
                  isVotingDisabled={isVotingDisabled}
                  onVote={handleVote}
                  darkMode={darkMode}
                />
              </Box>

              <Box
                bg={cardBg}
                borderWidth="1px"
                borderColor={borderCol}
                rounded="2xl"
                p={5}
                w="full"
              >
                <HStack justify="space-between">
                  <HStack>
                    {" "}
                    <Avatar.Root size="sm">
                      <Avatar.Image src={imageUrl} alt={authorName} />{" "}
                      <Avatar.Fallback>
                        {(authorName || "?").slice(0, 1).toUpperCase()}{" "}
                      </Avatar.Fallback>{" "}
                    </Avatar.Root>
                    <Text>@{authorName}</Text>{" "}
                  </HStack>
                  <Button variant="ghost">
                    <HStack>
                      <Bookmark size={16} />
                      <Text>Save</Text>
                    </HStack>
                  </Button>
                </HStack>
              </Box>
            </VStack>
          </GridItem>
        </Grid>
      </Container>
    </Box>
  );
}
