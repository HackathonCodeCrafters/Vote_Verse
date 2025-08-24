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
import { useState } from "react";
import ProfileInformation from "../components/ProfileInformation";
import type { Profile } from "../types/profile";
import { createProfileAPI } from "@/ic/api";

interface ProfilePageProps {
  darkMode?: boolean;
  principal?: string;
  userName?: string;
  userAvatar?: string;
  votingPower?: number;
  onUpdateProfile?: (data: any) => void;
}

export default function ProfilePage({
  darkMode = false,
  principal = "rdmx6-jaaaa-aaaah-qcaiq-cai",
  userName = "John Doe",
  userAvatar,
  votingPower = 1250,
  onUpdateProfile,
}: ProfilePageProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [showPrincipal, setShowPrincipal] = useState(false);

  // Profile form state
  const [profileData, setProfileData] = useState<Profile>({
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
  try {
    setIsEditing(false); 
    const newId = await createProfileAPI({
      image_url: profileData.avatar || null,
      fullname: profileData.name ?? "",
      email: profileData.email,
      location: profileData.location || null,
      website: profileData.website || null,
      bio: profileData.bio || null,
    });

    setProfileData((prev) => ({ ...prev, id: newId, updatedAt: new Date().toISOString() }));

    setIsEditing(false);
  } catch (e:any) {
    console.error(e.message ?? "Failed to create profile");
  }
};

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
  ];

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
  ];

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
    <div
      className={`min-h-screen transition-colors duration-300 ${
        darkMode ? "bg-gray-900" : "bg-gray-50"
      }`}
    >
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1
            className={`text-3xl font-bold mb-2 ${
              darkMode ? "text-white" : "text-gray-900"
            }`}
          >
            Profile
          </h1>
          <p
            className={`text-lg ${
              darkMode ? "text-gray-400" : "text-gray-600"
            }`}
          >
            Manage your account settings and preferences
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Profile Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Profile Information Card */}
            <ProfileInformation
              profileData={profileData}
              setProfileData={(data) => setProfileData(data)}
              darkMode={darkMode}
              isEditing={isEditing}
              setIsEditing={setIsEditing}
              handleSaveProfile={handleSaveProfile}
            />

            {/* Settings Card */}
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
                        checked={settings[setting.key as keyof typeof settings]}
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

          {/* Right Column - Stats & Info */}
          <div className="space-y-6">
            {/* Statistics Card */}
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

              <div className="space-y-4">
                {stats.map((stat, index) => {
                  const IconComponent = stat.icon;
                  return (
                    <div
                      key={index}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-3">
                        <div
                          className={`p-2 rounded-lg ${
                            darkMode ? "bg-gray-700" : "bg-gray-100"
                          }`}
                        >
                          <IconComponent
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
                        className={`px-2 py-1 text-xs font-medium rounded-full ${getColorClasses(
                          stat.color
                        )}`}
                      >
                        {stat.value}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Account Information Card */}
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
      </div>
    </div>
  );
}
