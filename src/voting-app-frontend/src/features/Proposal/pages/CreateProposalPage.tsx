"use client";

import { useAuth } from "@/hooks/useAuth";
import { getUserByIdAPI, loadPersistedProfileId } from "@/ic/api";
import Button from "@/shared/components/Button";
import {
  AlertCircle,
  ArrowLeft,
  ImageIcon,
  Trash2,
  Upload,
  User,
} from "lucide-react";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import { Helmet } from "react-helmet";
import { useNavigate } from "react-router-dom";
import { useDarkMode } from "../../../context/DarkModeContext";
import FormInput from "../components/atoms/FormInput";
import FormSelect from "../components/atoms/FormSelect";
import FormTextarea from "../components/atoms/FormTextarea";
import CreateProposalByAI from "../components/CreateProposal/CreateProposalByAI";
import InfoBoxCreateProposal from "../components/CreateProposal/InfoBoxCreateProposal";

interface CreateProposalPageProps {
  onCreateProposal: (proposal: any) => Promise<void>;
}

interface UserProfile {
  id: string;
  fullname: string;
  email: string;
  image_url: string | null;
  location: string | null;
  website: string | null;
  bio: string | null;
}

export default function CreateProposalPage({
  onCreateProposal,
}: CreateProposalPageProps) {
  const { principal } = useAuth();
  const { darkMode } = useDarkMode();
  const navigate = useNavigate();

  const [hasProfile, setHasProfile] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  const [formData, setFormData] = useState({
    principal: principal || "",
    profileId: "",
    title: "",
    description: "",
    fullDescription: "",
    category: "Governance",
    duration: "7",
    image: "",
    author: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const categoryOptions = [
    { value: "Governance", label: "Governance" },
    { value: "Economics", label: "Economics" },
    { value: "Technical", label: "Technical" },
    { value: "Funding", label: "Funding" },
    { value: "Product", label: "Product" },
    { value: "Community", label: "Community" },
    { value: "Security", label: "Security" },
  ];

  const durationOptions = [
    { value: "3", label: "3 days" },
    { value: "7", label: "7 days" },
    { value: "14", label: "14 days" },
    { value: "30", label: "30 days" },
  ];

  // Check if user has a profile and load profile data
  const checkUserProfile = async () => {
    setProfileLoading(true);
    try {
      const profileId = loadPersistedProfileId();
      if (!profileId) {
        setHasProfile(false);
        setProfileLoading(false);
        return;
      }

      const profile = await getUserByIdAPI(profileId);
      if (profile) {
        setHasProfile(true);
        setUserProfile(profile);
        setFormData((prev) => ({
          ...prev,
          profileId: profile.id,
          author: profile.fullname,
        }));
      } else {
        setHasProfile(false);
      }
    } catch (error) {
      console.error("Error checking user profile:", error);
      setHasProfile(false);
    } finally {
      setProfileLoading(false);
    }
  };

  useEffect(() => {
    checkUserProfile();
  }, []);

  // If no profile, redirect to profile page
  useEffect(() => {
    if (!profileLoading && !hasProfile) {
      const confirmed = window.confirm(
        "You need to complete your profile before creating a proposal. Would you like to go to the profile page now?"
      );
      if (confirmed) {
        navigate("/profile");
      } else {
        navigate("/dashboard");
      }
    }
  }, [profileLoading, hasProfile, navigate]);

  // Convert file to base64
  const convertToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        if (typeof reader.result === "string") resolve(reader.result);
        else reject(new Error("Failed to convert file to base64"));
      };
      reader.onerror = (error) => reject(error);
    });

  // Handle file upload
  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please select an image file (PNG, JPG, GIF, etc.)");
      return;
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      alert("Image size must be less than 5MB");
      return;
    }

    setIsUploading(true);
    try {
      const base64String = await convertToBase64(file);
      setFormData((prev) => ({ ...prev, image: base64String }));
      setImagePreview(base64String);
    } catch (error) {
      console.error("Error converting image:", error);
      alert("Failed to process image. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const removeImage = () => {
    setFormData((prev) => ({ ...prev, image: "" }));
    setImagePreview("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleImageUrlChange = (url: string) => {
    setFormData((prev) => ({ ...prev, image: url }));
    setImagePreview(url);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!hasProfile || !userProfile) {
      alert("Profile is required to create proposals");
      return;
    }

    setIsSubmitting(true);

    try {
      const now = new Date();

      const proposalData = {
        principal: formData.principal,
        profileId: formData.profileId,
        title: formData.title,
        description: formData.description,
        full_description: formData.fullDescription,
        category: formData.category,
        durationDays: parseInt(formData.duration, 10),
        duration: formData.duration,
        image_url:
          formData.image && !formData.image.startsWith("data:")
            ? formData.image
            : "",
        image:
          formData.image && formData.image.startsWith("data:")
            ? formData.image
            : "",
        author: formData.author,
        createdAt: now.toISOString(),
        status: "active",
        votes: { yes: 0, no: 0 },
        totalVoters: 0,
        discussions: 0,
      };

      await onCreateProposal(proposalData);

      // Reset
      setFormData({
        principal: principal || "",
        profileId: userProfile.id,
        title: "",
        description: "",
        fullDescription: "",
        category: "Governance",
        duration: "7",
        image: "",
        author: userProfile.fullname,
      });
      setImagePreview("");
      if (fileInputRef.current) fileInputRef.current.value = "";

      navigate("/dashboard");
    } catch (err) {
      console.error("Failed to submit Proposal:", err);
      alert(
        `Failed to submit proposal${
          err instanceof Error ? `: ${err.message}` : ""
        }`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

  // Show loading state
  if (profileLoading) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center ${
          darkMode ? "bg-gray-900" : "bg-gray-50"
        }`}
      >
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className={darkMode ? "text-white" : "text-gray-900"}>
            Checking profile...
          </p>
        </div>
      </div>
    );
  }

  // Show profile required message
  if (!hasProfile) {
    return (
      <div
        className={`min-h-screen ${darkMode ? "bg-gray-900" : "bg-gray-50"}`}
      >
        <div className="max-w-2xl mx-auto px-4 py-16">
          <div
            className={`rounded-lg border p-8 text-center ${
              darkMode
                ? "bg-gray-800 border-gray-700"
                : "bg-white border-gray-200"
            }`}
          >
            <AlertCircle
              size={64}
              className={`mx-auto mb-6 ${
                darkMode ? "text-yellow-400" : "text-yellow-500"
              }`}
            />
            <h1
              className={`text-2xl font-bold mb-4 ${
                darkMode ? "text-white" : "text-gray-900"
              }`}
            >
              Profile Required
            </h1>
            <p
              className={`text-lg mb-6 ${
                darkMode ? "text-gray-300" : "text-gray-600"
              }`}
            >
              You need to complete your profile before creating a proposal. This
              helps the community know who you are.
            </p>
            <div className="flex gap-4 justify-center">
              <Button
                onClick={() => navigate("/profile")}
                variant="gradient"
                icon={User}
              >
                Complete Profile
              </Button>
              <Button
                onClick={() => navigate("/dashboard")}
                variant="secondary"
              >
                Back to Dashboard
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Create Proposal - VoteVerse</title>
      </Helmet>

      <div
        className={`min-h-screen transition-colors duration-300 ${
          darkMode ? "bg-gray-900" : "bg-gray-50"
        }`}
      >
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          {/* Header: full width */}
          <div className="mb-8">
            <Button
              onClick={() => navigate(-1)}
              variant="secondary"
              icon={ArrowLeft}
              className="mb-4"
            >
              Back
            </Button>
            <h1
              className={`text-3xl font-bold mb-2 ${
                darkMode ? "text-white" : "text-gray-900"
              }`}
            >
              Create New Proposal
            </h1>
            <p
              className={`text-lg ${
                darkMode ? "text-gray-400" : "text-gray-600"
              }`}
            >
              Submit your proposal to the community for voting
            </p>
          </div>

          {/* Profile info display */}
          {userProfile && (
            <div
              className={`mb-6 rounded-lg border p-4 ${
                darkMode
                  ? "bg-green-900/20 border-green-800"
                  : "bg-green-50 border-green-200"
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  {userProfile.image_url ? (
                    <img
                      src={userProfile.image_url}
                      alt={userProfile.fullname}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        darkMode ? "bg-gray-700" : "bg-gray-200"
                      }`}
                    >
                      <User
                        size={20}
                        className={darkMode ? "text-gray-400" : "text-gray-500"}
                      />
                    </div>
                  )}
                </div>
                <div>
                  <p
                    className={`font-medium ${
                      darkMode ? "text-green-300" : "text-green-800"
                    }`}
                  >
                    Profile Verified: {userProfile.fullname}
                  </p>
                  <p
                    className={`text-sm ${
                      darkMode ? "text-green-400" : "text-green-700"
                    }`}
                  >
                    Profile ID: {userProfile.id}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Grid 2 kolom: 2fr / 1fr */}
          <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-8 items-start">
            {/* LEFT: Form (min-w-0 untuk cegah overflow) */}
            <div className="min-w-0">
              <div
                className={`rounded-lg border p-8 ${
                  darkMode
                    ? "bg-gray-800 border-gray-700"
                    : "bg-white border-gray-200"
                }`}
              >
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Principal ID */}
                  <FormInput
                    label="Principal ID"
                    type="text"
                    name="principal"
                    value={principal}
                    onChange={(e) =>
                      handleInputChange("principal", e.target.value)
                    }
                    placeholder="Enter Your Principal ID"
                    disabled={true}
                    darkMode={darkMode}
                  />

                  {/* Profile ID - New field */}
                  <FormInput
                    label="Profile ID"
                    type="text"
                    name="profileId"
                    value={formData.profileId}
                    onChange={(e) =>
                      handleInputChange("profileId", e.target.value)
                    }
                    placeholder="Your Profile ID"
                    disabled={true}
                    darkMode={darkMode}
                    helpText="This is automatically filled from your completed profile"
                  />

                  {/* Author */}
                  <FormInput
                    label="Author"
                    type="text"
                    name="author"
                    value={formData.author}
                    onChange={(e) =>
                      handleInputChange("author", e.target.value)
                    }
                    placeholder="Enter Your Name"
                    disabled={true}
                    darkMode={darkMode}
                    helpText="This is automatically filled from your profile"
                  />

                  {/* Title */}
                  <FormInput
                    label="Proposal Title"
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={(e) => handleInputChange("title", e.target.value)}
                    placeholder="Enter a clear and concise title"
                    darkMode={darkMode}
                  />

                  {/* Category & Duration */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormSelect
                      label="Category"
                      name="category"
                      value={formData.category}
                      options={categoryOptions}
                      onChange={(value) => handleInputChange("category", value)}
                      placeholder="Select a category"
                      required={true}
                      darkMode={darkMode}
                    />
                    <FormSelect
                      label="Voting Duration"
                      name="duration"
                      value={formData.duration}
                      options={durationOptions}
                      onChange={(value) => handleInputChange("duration", value)}
                      placeholder="Select duration"
                      required={true}
                      darkMode={darkMode}
                    />
                  </div>

                  {/* Short Description */}
                  <FormTextarea
                    label="Short Description"
                    name="description"
                    value={formData.description}
                    onChange={(value) =>
                      handleInputChange("description", value)
                    }
                    placeholder="Brief summary that will appear in the proposal list"
                    rows={3}
                    required={true}
                    darkMode={darkMode}
                  />

                  {/* Full Description */}
                  <FormTextarea
                    label="Detailed Description"
                    name="fullDescription"
                    value={formData.fullDescription}
                    onChange={(value) =>
                      handleInputChange("fullDescription", value)
                    }
                    placeholder="Provide a comprehensive explanation of your proposal..."
                    rows={8}
                    required={true}
                    darkMode={darkMode}
                  />

                  {/* Image Upload */}
                  <div>
                    <label
                      className={`block text-sm font-medium mb-3 ${
                        darkMode ? "text-white" : "text-gray-900"
                      }`}
                    >
                      Proposal Image (Optional)
                    </label>

                    <div className="space-y-4">
                      {/* File Upload */}
                      <div>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleFileUpload}
                          className="hidden"
                          id="image-upload"
                        />
                        <label
                          htmlFor="image-upload"
                          className={`flex items-center justify-center w-full px-6 py-8 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                            darkMode
                              ? "border-gray-600 hover:border-purple-500 bg-gray-700/50"
                              : "border-gray-300 hover:border-purple-500 bg-gray-50"
                          } ${
                            isUploading ? "pointer-events-none opacity-50" : ""
                          }`}
                        >
                          <div className="flex flex-col items-center space-y-3">
                            {isUploading ? (
                              <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                              <Upload
                                size={32}
                                className={
                                  darkMode ? "text-gray-400" : "text-gray-500"
                                }
                              />
                            )}
                            <div className="text-center">
                              <p
                                className={`text-base font-medium ${
                                  darkMode ? "text-white" : "text-gray-900"
                                }`}
                              >
                                {isUploading ? "Uploading..." : "Upload Image"}
                              </p>
                              <p
                                className={`text-sm mt-1 ${
                                  darkMode ? "text-gray-400" : "text-gray-500"
                                }`}
                              >
                                PNG, JPG, GIF up to 5MB
                              </p>
                            </div>
                          </div>
                        </label>
                      </div>

                      {/* OR */}
                      <div className="flex items-center">
                        <div
                          className={`flex-1 border-t ${
                            darkMode ? "border-gray-600" : "border-gray-300"
                          }`}
                        />
                        <span
                          className={`px-4 text-sm ${
                            darkMode ? "text-gray-400" : "text-gray-500"
                          }`}
                        >
                          OR
                        </span>
                        <div
                          className={`flex-1 border-t ${
                            darkMode ? "border-gray-600" : "border-gray-300"
                          }`}
                        />
                      </div>

                      {/* URL Input */}
                      <div className="relative">
                        <input
                          type="url"
                          value={
                            formData.image.startsWith("data:")
                              ? ""
                              : formData.image
                          }
                          onChange={(e) => handleImageUrlChange(e.target.value)}
                          placeholder="https://example.com/image.jpg"
                          className={`w-full px-4 py-3 pl-12 rounded-lg border transition-colors ${
                            darkMode
                              ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-purple-500"
                              : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-purple-500"
                          } focus:outline-none focus:ring-2 focus:ring-purple-500/20`}
                        />
                        <ImageIcon
                          size={20}
                          className={`absolute left-4 top-1/2 -translate-y-1/2 ${
                            darkMode ? "text-gray-400" : "text-gray-500"
                          }`}
                        />
                      </div>
                    </div>

                    {/* Preview */}
                    {imagePreview && (
                      <div className="mt-6">
                        <div className="relative inline-block">
                          <img
                            src={imagePreview || "/placeholder.svg"}
                            alt="Preview"
                            className="max-w-full h-48 object-cover rounded-lg border"
                          />
                          <button
                            type="button"
                            onClick={removeImage}
                            className="absolute -top-2 -right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                        <p
                          className={`text-sm mt-2 ${
                            darkMode ? "text-gray-400" : "text-gray-500"
                          }`}
                        >
                          {formData.image.startsWith("data:")
                            ? "Uploaded image"
                            : "Image from URL"}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Info Box */}
                  <InfoBoxCreateProposal darkMode={darkMode} />

                  {/* Actions */}
                  <div className="flex space-x-4 pt-6">
                    <Button
                      type="button"
                      onClick={() => navigate(-1)}
                      variant="secondary"
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={isSubmitting || isUploading || !hasProfile}
                      variant="gradient"
                      className="flex-1"
                    >
                      {isSubmitting ? (
                        <div className="flex items-center justify-center space-x-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Creating...</span>
                        </div>
                      ) : (
                        "Create Proposal"
                      )}
                    </Button>
                  </div>
                </form>
              </div>
            </div>

            {/* RIGHT: Sidebar sticky */}
            <aside>
              <CreateProposalByAI
                defaults={{
                  principal: formData.principal,
                  author: formData.author,
                  category: formData.category,
                  durationDays: parseInt(formData.duration, 10),
                  image: formData.image,
                  profileId: formData.profileId,
                }}
                onCreated={(newId) => {
                  // arahkan ke detail proposal atau dashboard
                  navigate(`/proposal/${formData.principal}/${newId}`);
                }}
              />
            </aside>
          </div>
        </div>
      </div>
    </>
  );
}
