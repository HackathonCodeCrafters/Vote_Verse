"use client";

import {
  Activity,
  AlertCircle,
  Award,
  Calendar,
  Edit3,
  Lock,
  Settings,
  Shield,
} from "lucide-react";
import { useEffect, useState } from "react";
import ProfileInformation from "../components/ProfileInformation";
import type { Profile } from "../types/profile";
import { 
  createProfileAPI,
  persistProfileId,
  loadPersistedProfileId,
  getUserByIdAPI,
  persistProfileCache,
  loadPersistedProfileCache, 
} from "@/ic/api";

import { useDarkMode } from "../../../context/DarkModeContext";

interface ProfilePageProps {
  darkMode?: boolean;
  principal?: string;
  userName?: string;
  userAvatar?: string;
  votingPower?: number;
  onUpdateProfile?: (data: any) => void;
}

export default function ProfilePage({
  principal = "rdmx6-jaaaa-aaaah-qcaiq-cai",
  userName = "John Doe",
  userAvatar,
  votingPower = 1250,
  onUpdateProfile,
}: ProfilePageProps) {
  const { darkMode } = useDarkMode();
  const [isEditing, setIsEditing] = useState(false);
  const [showPrincipal, setShowPrincipal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [createdId, setCreatedId] = useState<string | null>(null);
// ---------- THEME HELPERS ----------
  const bgPage = darkMode ? "bg-gray-900" : "bg-gray-50";
  const textTitle = darkMode ? "text-white" : "text-gray-900";
  const textBody = darkMode ? "text-gray-300" : "text-gray-700";
  const textMuted = darkMode ? "text-gray-400" : "text-gray-600";
  const borderCard = darkMode ? "border-gray-700" : "border-gray-200";
  const bgCard = darkMode ? "bg-gray-800" : "bg-white";
  const bgSubtle = darkMode ? "bg-gray-700" : "bg-gray-100";
  const textIcon = darkMode ? "text-gray-300" : "text-gray-600";
  const cardClass = `rounded-lg border ${borderCard} ${bgCard} p-6`;
  const pill = (tone: "blue" | "green" | "purple" | "orange") => {
    const map: Record<string, string> = {
      blue: darkMode ? "bg-blue-900 text-blue-300" : "bg-blue-100 text-blue-800",
      green: darkMode ? "bg-green-900 text-green-300" : "bg-green-100 text-green-800",
      purple: darkMode ? "bg-purple-900 text-purple-300" : "bg-purple-100 text-purple-800",
      orange: darkMode ? "bg-orange-900 text-orange-300" : "bg-orange-100 text-orange-800",
    };
    return `px-2 py-1 text-xs font-medium rounded-full ${map[tone]}`;
  };

  // Profile form state
  const [profileData, setProfileData] = useState<Profile>(() => {
  // default dummy…
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

  // Edit Profile Handlers
  const handleSaveProfile = async () => {

  setSaving(true); setErrorMsg(null);
  try {

    const newId = await createProfileAPI({
      image_url: profileData.avatar || null,
      fullname: profileData.name ?? "",
      email: profileData.email,
      location: profileData.location || null,
      website: profileData.website || null,
      bio: profileData.bio || null,
    });

    persistProfileId(newId);

    // Fetch from canister & update + cache
    const fresh = await getUserByIdAPI(newId);
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
      setProfileData((prev) => ({ ...prev, id: newId, updatedAt: new Date().toISOString() }));
    }

    setCreatedId(newId);
    setIsEditing(false);
  } catch (err: any) {
    setErrorMsg(err?.message ?? "Failed to create profile");
  } finally {
    setSaving(false);
  }
};

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
    { label: "Proposals Created", value: "3", icon: Edit3, color: "purple" },
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

  const getColorClasses = (color: string) => {
    const colorMap = {
      blue: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
      green:
        "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
      purple:
        "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
      orange:
        "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
    };
    return colorMap[color as keyof typeof colorMap] || colorMap.blue;
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${bgPage}`}>
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className={`text-3xl font-bold mb-2 ${textTitle}`}>Profile</h1>
          <p className={`text-lg ${textMuted}`}>Manage your account settings and preferences</p>

          {saving && <p className={`mt-2 text-sm ${darkMode ? "text-blue-300" : "text-blue-700"}`}>Saving to ICP canister…</p>}
          {createdId && <p className={`mt-2 text-sm ${darkMode ? "text-green-300" : "text-green-700"}`}>Profile ID: {createdId}</p>}
          {errorMsg && <p className={`mt-2 text-sm ${darkMode ? "text-red-300" : "text-red-700"}`}>{errorMsg}</p>}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Profile Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Profile Information Card */}
            <ProfileInformation
              profileData={profileData}
              setProfileData={setProfileData}
              darkMode={darkMode}
              isEditing={isEditing}
              setIsEditing={setIsEditing}
              handleSaveProfile={handleSaveProfile}
              saving={saving}
            />

            {/* Settings Card */}
            <div className={cardClass}>
              <div className="flex items-center space-x-2 mb-6">
                <Settings size={20} className={textTitle} />
                <h2 className={`text-xl font-semibold ${textTitle}`}>Notification Settings</h2>
              </div>

              <div className="space-y-4">
                {settingsConfig.map((setting) => (
                  <div key={setting.key} className="flex items-center justify-between">
                    <div className="flex-1">
                      <label className={`text-sm font-medium ${textBody}`}>{setting.label}</label>
                      <p className={`text-xs ${textMuted}`}>{setting.description}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={(settings as any)[setting.key]}
                        onChange={(e) => setSettings({ ...settings, [setting.key]: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Stats & Info */}
          <div className="space-y-6">
            {/* Statistics Card */}
            <div className={cardClass}>
              <h2 className={`text-xl font-semibold mb-6 ${textTitle}`}>Statistics</h2>
              <div className="space-y-4">
                {stats.map((stat, index) => {
                  const IconComponent = stat.icon;
                  return (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-lg ${bgSubtle}`}>
                          <IconComponent size={16} className={textIcon} />
                        </div>
                        <span className={`text-sm ${textBody}`}>{stat.label}</span>
                      </div>
                      <span className={pill(stat.color)}>{stat.value}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Account Information Card */}
            <div className={cardClass}>
              <h2 className={`text-xl font-semibold mb-6 ${textTitle}`}>Account Information</h2>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Calendar size={16} className={darkMode ? "text-gray-400" : "text-gray-500"} />
                  <div>
                    <p className={`text-sm font-medium ${textBody}`}>Member Since</p>
                    <p className={`text-xs ${textMuted}`}>{profileData.joinDate}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Shield size={16} className={darkMode ? "text-gray-400" : "text-gray-500"} />
                  <div>
                    <p className={`text-sm font-medium ${textBody}`}>Account Status</p>
                    <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                      Verified
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Lock size={16} className={darkMode ? "text-gray-400" : "text-gray-500"} />
                  <div>
                    <p className={`text-sm font-medium ${textBody}`}>Identity Provider</p>
                    <p className={`text-xs ${textMuted}`}>Internet Identity</p>
                  </div>
                </div>
              </div>

              {/* Principal toggle */}
              <div className="mt-4">
                <button onClick={() => setShowPrincipal(!showPrincipal)} className="text-xs underline">
                  {showPrincipal ? "Hide Principal" : "Show Principal"}
                </button>
                {showPrincipal && <p className={`mt-2 text-xs ${textBody}`}>{principal}</p>}
              </div>
            </div>

            {/* Security Alert */}
            <div className={`rounded-lg border p-4 ${darkMode ? "bg-blue-900/20 border-blue-800" : "bg-blue-50 border-blue-200"}`}>
              <div className="flex items-start space-x-3">
                <AlertCircle size={16} className={darkMode ? "text-blue-300 mt-0.5" : "text-blue-500 mt-0.5"} />
                <div>
                  <p className={`text-sm font-medium ${darkMode ? "text-blue-300" : "text-blue-800"}`}>Security Tip</p>
                  <p className={`text-xs mt-1 ${darkMode ? "text-blue-400" : "text-blue-700"}`}>
                    Keep your Internet Identity secure and never share your recovery phrases.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div> 
    </div>
  );
}
