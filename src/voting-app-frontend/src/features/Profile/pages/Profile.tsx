"use client";

import {
  createProfileAPI,
  getUserByIdAPI,
  loadPersistedProfileCache,
  loadPersistedProfileId,
  persistProfileCache,
  persistProfileId,
} from "@/ic/api";
import {
  Activity,
  AlertCircle,
  Award,
  Calendar,
  Edit3,
  FileText,
  Lock,
  Settings,
  Shield,
  User,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useDarkMode } from "../../../context/DarkModeContext";
import ProfileInformation from "../components/ProfileInformation";
import type { Profile } from "../types/profile";

interface ProfilePageProps {
  principal?: string;
  userName?: string;
  userAvatar?: string;
  votingPower?: number;
  darkMode?: boolean; // Add this line
  onUpdateProfile?: (data: any) => void;
}

type TabType = "profile" | "settings" | "proposals";

export default function ProfilePage({
  principal = "rdmx6-jaaaa-aaaah-qcaiq-cai",
  userName = "John Doe",
  userAvatar,
  votingPower = 1250,
  onUpdateProfile,
}: ProfilePageProps) {
  const { darkMode } = useDarkMode();
  const [activeTab, setActiveTab] = useState<TabType>("profile");
  const [isEditing, setIsEditing] = useState(false);
  const [showPrincipal, setShowPrincipal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [createdId, setCreatedId] = useState<string | null>(null);

  // Theme helpers
  const bgPage = darkMode ? "bg-gray-900" : "bg-gray-50";
  const textTitle = darkMode ? "text-white" : "text-gray-900";
  const textBody = darkMode ? "text-gray-300" : "text-gray-700";
  const textMuted = darkMode ? "text-gray-400" : "text-gray-600";
  const borderCard = darkMode ? "border-gray-700" : "border-gray-200";
  const bgCard = darkMode ? "bg-gray-800" : "bg-white";
  const bgSubtle = darkMode ? "bg-gray-700" : "bg-gray-100";
  const textIcon = darkMode ? "text-gray-300" : "text-gray-600";
  const cardClass = `rounded-lg border ${borderCard} ${bgCard} p-6`;

  // Profile form state
  const [profileData, setProfileData] = useState<Profile>(() => {
    const base: Profile = {
      id: "user-1",
      name: userName,
      username: userName.toLowerCase().replace(/\s+/g, ""),
      email: "john.doe@example.com",
      bio: "Passionate about decentralized governance and blockchain technology. Active participant in community voting.",
      location: "San Francisco, CA",
      website: "https://johndoe.dev",
      joinDate: "March 2024",
      avatar: userAvatar || "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (typeof window !== "undefined") {
      const cached = loadPersistedProfileCache();
      if (cached) {
        return {
          ...base,
          id: cached.id,
          name: cached.fullname,
          username: cached.fullname,
          email: cached.email,
          bio: cached.bio || base.bio,
          avatar: cached.image_url || base.avatar,
          location: cached.location || base.location,
          website: cached.website || base.website,
        };
      }
    }
    return base;
  });

  // Settings state
  const [settings, setSettings] = useState({
    emailNotifications: true,
    voteReminders: true,
    proposalUpdates: false,
    profileVisibility: true,
    activityTracking: true,
  });

  // Mock proposals data
  const [userProposals] = useState([
    {
      id: "1",
      title: "Implement Dark Mode Toggle",
      status: "Active",
      votes: 124,
      createdAt: "2024-03-15",
      description:
        "Add a system-wide dark mode toggle to improve user experience during different times of day.",
    },
    {
      id: "2",
      title: "Increase Voting Period",
      status: "Passed",
      votes: 89,
      createdAt: "2024-03-10",
      description:
        "Extend the default voting period from 3 days to 7 days to allow more community participation.",
    },
    {
      id: "3",
      title: "Add Mobile App Support",
      status: "Rejected",
      votes: 45,
      createdAt: "2024-03-05",
      description:
        "Develop a native mobile application for iOS and Android platforms.",
    },
  ]);

  // Save Profile Handler (berdasarkan kode asli yang sudah working)
  const handleSaveProfile = async () => {
    console.log("[handleSaveProfile] Starting save process...");
    setSaving(true);
    setErrorMsg(null);

    try {
      console.log("[handleSaveProfile] Profile data to save:", {
        image_url: profileData.avatar || null,
        fullname: profileData.name ?? "",
        email: profileData.email,
        location: profileData.location || null,
        website: profileData.website || null,
        bio: profileData.bio || null,
      });

      const newId = await createProfileAPI({
        image_url: profileData.avatar || null,
        fullname: profileData.name ?? "",
        email: profileData.email,
        location: profileData.location || null,
        website: profileData.website || null,
        bio: profileData.bio || null,
      });

      console.log("[handleSaveProfile] Created profile with ID:", newId);
      persistProfileId(newId);

      // Fetch from canister & update + cache
      const fresh = await getUserByIdAPI(newId);
      console.log("[handleSaveProfile] Fresh data from canister:", fresh);

      if (fresh) {
        persistProfileCache({
          id: fresh.id,
          fullname: fresh.fullname,
          email: fresh.email,
          image_url: fresh.image_url,
          location: fresh.location,
          website: fresh.website,
          bio: fresh.bio,
        });

        setProfileData((prev) => ({
          ...prev,
          id: fresh.id,
          name: fresh.fullname,
          username: fresh.fullname,
          email: fresh.email,
          bio: fresh.bio || prev.bio,
          avatar: fresh.image_url || prev.avatar,
          location: fresh.location || prev.location,
          website: fresh.website || prev.website,
          updatedAt: new Date().toISOString(),
        }));
      } else {
        // fallback if null
        setProfileData((prev) => ({
          ...prev,
          id: newId,
          updatedAt: new Date().toISOString(),
        }));
      }

      setCreatedId(newId);
      console.log("[handleSaveProfile] Profile saved successfully, ID:", newId);
      setIsEditing(false);

      // Call onUpdateProfile if provided
      if (onUpdateProfile) {
        onUpdateProfile(profileData);
      }
    } catch (err: any) {
      console.error("[handleSaveProfile] Error:", err);
      setErrorMsg(err?.message ?? "Failed to create profile");
    } finally {
      setSaving(false);
    }
  };

  // Load persisted profile data on mount
  useEffect(() => {
    const id = loadPersistedProfileId();
    if (!id) {
      console.log("[hydrate] no vv_profile_id in localStorage");
      return;
    }

    (async () => {
      try {
        console.log("[hydrate] loading user by id:", id);
        const u = await getUserByIdAPI(id);
        console.log("[hydrate] canister user:", u);
        if (!u) return;

        persistProfileCache({
          id: u.id,
          fullname: u.fullname,
          email: u.email,
          image_url: u.image_url,
          location: u.location,
          website: u.website,
          bio: u.bio,
        });

        setProfileData((prev) => ({
          ...prev,
          id: u.id,
          name: u.fullname,
          username: u.fullname,
          email: u.email,
          bio: u.bio || prev.bio,
          avatar: u.image_url || prev.avatar,
          location: u.location || prev.location,
          website: u.website || prev.website,
          updatedAt: new Date().toISOString(),
        }));
      } catch (e) {
        console.warn("[hydrate] failed:", e);
      }
    })();
  }, []);

  const stats = [
    {
      label: "Voting Power",
      value: votingPower.toLocaleString(),
      icon: Award,
      color: "blue",
    },
    { label: "Proposals Voted", value: "47", icon: Activity, color: "green" },
    {
      label: "Proposals Created",
      value: userProposals.length.toString(),
      icon: Edit3,
      color: "purple",
    },
    { label: "Community Rank", value: "#142", icon: Shield, color: "orange" },
  ] as const;

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

  const tabs = [
    { id: "profile", label: "Profile", icon: User },
    { id: "settings", label: "Settings", icon: Settings },
    { id: "proposals", label: "My Proposals", icon: FileText },
  ] as const;

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
        return darkMode
          ? "bg-blue-900 text-blue-300"
          : "bg-blue-100 text-blue-800";
      case "passed":
        return darkMode
          ? "bg-green-900 text-green-300"
          : "bg-green-100 text-green-800";
      case "rejected":
        return darkMode ? "bg-red-900 text-red-300" : "bg-red-100 text-red-800";
      default:
        return darkMode
          ? "bg-gray-700 text-gray-300"
          : "bg-gray-100 text-gray-800";
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "profile":
        return (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Profile Information */}
            <div className="lg:col-span-2">
              <ProfileInformation
                profileData={profileData}
                setProfileData={setProfileData}
                darkMode={darkMode}
                isEditing={isEditing}
                setIsEditing={setIsEditing}
                handleSaveProfile={handleSaveProfile}
                saving={saving}
              />
            </div>

            {/* Statistics & Account Info */}
            <div className="space-y-6">
              {/* Statistics Card */}
              <div className={cardClass}>
                <h2 className={`text-xl font-semibold mb-6 ${textTitle}`}>
                  Statistics
                </h2>
                <div className="space-y-4">
                  {stats.map((stat, index) => {
                    const IconComponent = stat.icon;
                    const pillClass =
                      stat.color === "blue"
                        ? darkMode
                          ? "bg-blue-900 text-blue-300"
                          : "bg-blue-100 text-blue-800"
                        : stat.color === "green"
                        ? darkMode
                          ? "bg-green-900 text-green-300"
                          : "bg-green-100 text-green-800"
                        : stat.color === "purple"
                        ? darkMode
                          ? "bg-purple-900 text-purple-300"
                          : "bg-purple-100 text-purple-800"
                        : darkMode
                        ? "bg-orange-900 text-orange-300"
                        : "bg-orange-100 text-orange-800";

                    return (
                      <div
                        key={index}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center space-x-3">
                          <div className={`p-2 rounded-lg ${bgSubtle}`}>
                            <IconComponent size={16} className={textIcon} />
                          </div>
                          <span className={`text-sm ${textBody}`}>
                            {stat.label}
                          </span>
                        </div>
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${pillClass}`}
                        >
                          {stat.value}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Account Information Card */}
              <div className={cardClass}>
                <h2 className={`text-xl font-semibold mb-6 ${textTitle}`}>
                  Account Information
                </h2>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <Calendar size={16} className={textMuted} />
                    <div>
                      <p className={`text-sm font-medium ${textBody}`}>
                        Member Since
                      </p>
                      <p className={`text-xs ${textMuted}`}>
                        {profileData.joinDate}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Shield size={16} className={textMuted} />
                    <div>
                      <p className={`text-sm font-medium ${textBody}`}>
                        Account Status
                      </p>
                      <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                        Verified
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Lock size={16} className={textMuted} />
                    <div>
                      <p className={`text-sm font-medium ${textBody}`}>
                        Identity Provider
                      </p>
                      <p className={`text-xs ${textMuted}`}>
                        Internet Identity
                      </p>
                    </div>
                  </div>
                </div>

                {/* Principal toggle */}
                <div className="mt-4">
                  <button
                    onClick={() => setShowPrincipal(!showPrincipal)}
                    className={`text-xs underline ${
                      darkMode ? "text-blue-400" : "text-blue-600"
                    } hover:opacity-80`}
                  >
                    {showPrincipal ? "Hide Principal" : "Show Principal"}
                  </button>
                  {showPrincipal && (
                    <p className={`mt-2 text-xs ${textBody} break-all`}>
                      {principal}
                    </p>
                  )}
                </div>
              </div>

              {/* Security Alert */}
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
                      darkMode ? "text-blue-300 mt-0.5" : "text-blue-500 mt-0.5"
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
        );

      case "settings":
        return (
          <div className="max-w-4xl">
            <div className={cardClass}>
              <div className="flex items-center space-x-2 mb-6">
                <Settings size={20} className={textTitle} />
                <h2 className={`text-xl font-semibold ${textTitle}`}>
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
                      <label className={`text-sm font-medium ${textBody}`}>
                        {setting.label}
                      </label>
                      <p className={`text-xs ${textMuted}`}>
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
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case "proposals":
        return (
          <div className="max-w-6xl">
            <div className={cardClass}>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-2">
                  <FileText size={20} className={textTitle} />
                  <h2 className={`text-xl font-semibold ${textTitle}`}>
                    My Proposals
                  </h2>
                </div>
                <span className={`text-sm ${textMuted}`}>
                  {userProposals.length} proposal
                  {userProposals.length !== 1 ? "s" : ""}
                </span>
              </div>

              {userProposals.length > 0 ? (
                <div className="space-y-4">
                  {userProposals.map((proposal) => (
                    <div
                      key={proposal.id}
                      className={`p-4 rounded-lg border ${borderCard} ${
                        darkMode ? "bg-gray-750" : "bg-gray-50"
                      }`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3
                            className={`text-lg font-medium ${textTitle} mb-1`}
                          >
                            {proposal.title}
                          </h3>
                          <p className={`text-sm ${textBody} mb-2`}>
                            {proposal.description}
                          </p>
                        </div>
                        <span
                          className={`ml-4 px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(
                            proposal.status
                          )}`}
                        >
                          {proposal.status}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center space-x-4">
                          <span className={textMuted}>
                            {proposal.votes} votes
                          </span>
                          <span className={textMuted}>
                            Created:{" "}
                            {new Date(proposal.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <FileText size={48} className={`${textMuted} mx-auto mb-4`} />
                  <h3 className={`text-lg font-medium ${textTitle} mb-2`}>
                    No proposals yet
                  </h3>
                  <p className={`${textMuted} mb-4`}>
                    You haven't created any proposals yet.
                  </p>
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    Create Proposal
                  </button>
                </div>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${bgPage}`}>
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className={`text-3xl font-bold mb-2 ${textTitle}`}>
            Profile Dashboard
          </h1>
          <p className={`text-lg ${textMuted}`}>
            Manage your account, settings, and proposals
          </p>

          {/* Status Messages */}
          {saving && (
            <div
              className={`mt-2 p-2 rounded ${
                darkMode
                  ? "bg-blue-900/20 text-blue-300"
                  : "bg-blue-50 text-blue-700"
              }`}
            >
              <p className="text-sm">Saving to ICP canister…</p>
            </div>
          )}
          {createdId && (
            <div
              className={`mt-2 p-2 rounded ${
                darkMode
                  ? "bg-green-900/20 text-green-300"
                  : "bg-green-50 text-green-700"
              }`}
            >
              <p className="text-sm font-medium">Profile ID: {createdId}</p>
            </div>
          )}
          {errorMsg && (
            <div
              className={`mt-2 p-2 rounded ${
                darkMode
                  ? "bg-red-900/20 text-red-300"
                  : "bg-red-50 text-red-700"
              }`}
            >
              <p className="text-sm">{errorMsg}</p>
            </div>
          )}
        </div>

        {/* Tabs Navigation */}
        <div className="mb-8">
          <div className={`border-b ${borderCard}`}>
            <nav className="flex space-x-8">
              {tabs.map((tab) => {
                const IconComponent = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as TabType)}
                    className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                      isActive
                        ? `border-blue-500 ${
                            darkMode ? "text-blue-400" : "text-blue-600"
                          }`
                        : `border-transparent ${textMuted} hover:${textBody} hover:border-gray-300`
                    }`}
                  >
                    <IconComponent size={16} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="pb-8">{renderTabContent()}</div>
      </div>
    </div>
  );
}
