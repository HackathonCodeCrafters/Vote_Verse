import {
  Camera,
  Edit3,
  Eye,
  EyeOff,
  Globe,
  Mail,
  MapPin,
  Save,
  Loader2,
} from "lucide-react";
import { useState } from "react";
import { Profile } from "../types/profile";

interface ProfileInformationProps {
  profileData: Profile;
  setProfileData: (data: Profile) => void;
  darkMode: boolean;
  isEditing: boolean;
  setIsEditing: (editing: boolean) => void;
  handleSaveProfile: () => void;
  saving?: boolean;
}

function ProfileInformation({
  profileData,
  setProfileData,
  darkMode,
  isEditing,
  setIsEditing,
  handleSaveProfile,
  saving = false,
}: ProfileInformationProps) {
  const [showPrincipal, setShowPrincipal] = useState(false);

  const formatPrincipal = (principalText: string) => {
    if (!principalText) return "";
    if (showPrincipal) return principalText;
    if (principalText.length <= 10) return principalText;
    return `${principalText.slice(0, 6)}...${principalText.slice(-4)}`;
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };
  const saveBtnBase =
    "inline-flex items-center px-3 py-2 text-sm font-medium rounded-lg border transition-colors";
  const saveBtnStyle = isEditing
    ? "bg-green-600 text-white border-green-600 hover:bg-green-700"
    : darkMode
    ? "border-gray-600 text-gray-300 hover:bg-gray-700"
    : "border-gray-300 text-gray-700 hover:bg-gray-50";

  return (
    <div
      className={`rounded-lg border p-6 ${
        darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
      }`}
    >
      <div className="flex items-center justify-between mb-6">
        <h2
          className={`text-xl font-semibold ${
            darkMode ? "text-white" : "text-gray-900"
          }`}
        >
          Profile Information
        </h2>

        <button
          onClick={() => (isEditing ? handleSaveProfile() : setIsEditing(true))}
          disabled={isEditing && saving}            
          aria-busy={isEditing && saving ? true : undefined}
          className={`${saveBtnBase} ${saveBtnStyle} ${
            isEditing && saving ? "opacity-60 cursor-not-allowed" : ""
          }`}
        >
          {isEditing ? (
            <>
              {saving ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              {saving ? "Saving…" : "Save"}
            </>
          ) : (
            <>
              <Edit3 className="w-4 h-4 mr-2" />
              Edit
            </>
          )}
        </button>
      </div>

      <div className="space-y-6">
        {/* Avatar Section */}
        <div className="flex items-center space-x-4">
          <div className="relative">
            {profileData.avatar ? (
              <img
                src={
                  profileData.avatar || "/placeholder.svg?height=80&width=80"
                }
                alt={profileData.name}
                className="w-20 h-20 rounded-full object-cover"
              />
            ) : (
              <div
                className={`w-20 h-20 rounded-full flex items-center justify-center text-xl font-medium ${
                  darkMode
                    ? "bg-gray-600 text-white"
                    : "bg-gray-300 text-gray-700"
                }`}
              >
                {getInitials(profileData.name ?? "")}
              </div>
            )}
            {isEditing && (
              <button
                className={`absolute -bottom-1 -right-1 p-1.5 rounded-full transition-opacity hover:opacity-80 ${
                  darkMode
                    ? "bg-gray-700 text-white"
                    : "bg-gray-100 text-gray-600"
                }`}
                disabled={saving}                
              >
                <Camera className="w-4 h-4" />
              </button>
            )}
          </div>
          <div className="flex-1">
            <h3
              className={`text-xl font-semibold ${
                darkMode ? "text-white" : "text-gray-900"
              }`}
            >
              {profileData.name}
            </h3>
            <div className="flex items-center space-x-2 mt-1">
              <span
                className={`text-sm ${
                  darkMode ? "text-gray-400" : "text-gray-600"
                }`}
              >
                {formatPrincipal((profileData as any).principal ?? "")}
              </span>
              <button
                onClick={() => setShowPrincipal(!showPrincipal)}
                className={`p-1 rounded transition-colors ${
                  darkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"
                }`}
              >
                {showPrincipal ? (
                  <EyeOff className="w-3 h-3" />
                ) : (
                  <Eye className="w-3 h-3" />
                )}
              </button>
            </div>
          </div>
        </div>

        <hr className={`${darkMode ? "border-gray-700" : "border-gray-200"}`} />

        {/* Form Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Full Name */}
          <div>
            <label
              className={`block text-sm font-medium mb-2 ${
                darkMode ? "text-gray-300" : "text-gray-700"
              }`}
            >
              Full Name
            </label>
            {isEditing ? (
              <input
                type="text"
                value={profileData.name}
                onChange={(e) =>
                  setProfileData({
                    ...profileData,
                    name: e.target.value,
                  })
                }
                disabled={saving}                        
                className={`w-full px-3 py-2 rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  darkMode
                    ? "bg-gray-700 border-gray-600 text-white"
                    : "bg-white border-gray-300 text-gray-900"
                } ${saving ? "opacity-60 cursor-not-allowed" : ""}`}
              />
            ) : (
              <p
                className={`py-2 ${
                  darkMode ? "text-gray-300" : "text-gray-900"
                }`}
              >
                {profileData.name}
              </p>
            )}
          </div>

          {/* Email */}
          <div>
            <label
              className={`block text-sm font-medium mb-2 ${
                darkMode ? "text-gray-300" : "text-gray-700"
              }`}
            >
              Email
            </label>
            {isEditing ? (
              <input
                type="email"
                value={profileData.email}
                onChange={(e) =>
                  setProfileData({
                    ...profileData,
                    email: e.target.value,
                  })
                }
                disabled={saving}
                className={`w-full px-3 py-2 rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  darkMode
                    ? "bg-gray-700 border-gray-600 text-white"
                    : "bg-white border-gray-300 text-gray-900"
                } ${saving ? "opacity-60 cursor-not-allowed" : ""}`}
              />
            ) : (
              <div className="flex items-center space-x-2 py-2">
                <Mail size={16} className={darkMode ? "text-gray-400" : "text-gray-600"} />
                <span className={darkMode ? "text-gray-300" : "text-gray-900"}>
                  {profileData.email}
                </span>
              </div>
            )}
          </div>

          {/* Location */}
          <div>
            <label
              className={`block text-sm font-medium mb-2 ${
                darkMode ? "text-gray-300" : "text-gray-700"
              }`}
            >
              Location
            </label>
            {isEditing ? (
              <input
                type="text"
                value={profileData.location}
                onChange={(e) =>
                  setProfileData({
                    ...profileData,
                    location: e.target.value,
                  })
                }
                disabled={saving}
                className={`w-full px-3 py-2 rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  darkMode
                    ? "bg-gray-700 border-gray-600 text-white"
                    : "bg-white border-gray-300 text-gray-900"
                } ${saving ? "opacity-60 cursor-not-allowed" : ""}`}
              />
            ) : (
              <div className="flex items-center space-x-2 py-2">
                <MapPin size={16} className={darkMode ? "text-gray-400" : "text-gray-600"} />
                <span className={darkMode ? "text-gray-300" : "text-gray-900"}>
                  {profileData.location}
                </span>
              </div>
            )}
          </div>

          {/* Website */}
          <div>
            <label
              className={`block text-sm font-medium mb-2 ${
                darkMode ? "text-gray-300" : "text-gray-700"
              }`}
            >
              Website
            </label>
            {isEditing ? (
              <input
                type="url"
                value={profileData.website}
                onChange={(e) =>
                  setProfileData({
                    ...profileData,
                    website: e.target.value,
                  })
                }
                disabled={saving}
                className={`w-full px-3 py-2 rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  darkMode
                    ? "bg-gray-700 border-gray-600 text-white"
                    : "bg-white border-gray-300 text-gray-900"
                } ${saving ? "opacity-60 cursor-not-allowed" : ""}`}
              />
            ) : (
              <div className="flex items-center space-x-2 py-2">
                <Globe size={16} className={darkMode ? "text-gray-400" : "text-gray-600"} />
                <a
                  href={profileData.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:text-blue-600"
                >
                  {profileData.website}
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Bio */}
        <div>
          <label
            className={`block text-sm font-medium mb-2 ${
              darkMode ? "text-gray-300" : "text-gray-700"
            }`}
          >
            Bio
          </label>
          {isEditing ? (
            <textarea
              value={profileData.bio}
              onChange={(e) =>
                setProfileData({ ...profileData, bio: e.target.value })
              }
              rows={3}
              disabled={saving}
              className={`w-full px-3 py-2 rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none ${
                darkMode
                  ? "bg-gray-700 border-gray-600 text-white"
                  : "bg-white border-gray-300 text-gray-900"
              } ${saving ? "opacity-60 cursor-not-allowed" : ""}`}
            />
          ) : (
            <p className={`py-2 ${darkMode ? "text-gray-300" : "text-gray-900"}`}>
              {profileData.bio}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProfileInformation;
