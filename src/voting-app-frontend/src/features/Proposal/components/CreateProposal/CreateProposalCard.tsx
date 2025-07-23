"use client";

import { useAuth } from "@/hooks/useAuth";
import Button from "@/shared/components/Button";
import { ImageIcon, Trash2, Upload } from "lucide-react";
import type React from "react";
import { useRef, useState } from "react";
import { useDarkMode } from "../../../../context/DarkModeContext";
import BackgroundOverlay from "../atoms/BackgroundOverlay";
import FormInput from "../atoms/FormInput";
import FormSelect from "../atoms/FormSelect";
import FormTextarea from "../atoms/FormTextarea";
import HeaderCreateProposal from "./HeaderCreateProposal";
import InfoBoxCreateProposal from "./InfoBoxCreateProposal";

interface CreateProposalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateProposal: (proposal: any) => void;
}

export default function CreateProposalModal({
  isOpen,
  onClose,
  onCreateProposal,
}: CreateProposalModalProps) {
  const { principal } = useAuth();
  const { darkMode } = useDarkMode();
  const [formData, setFormData] = useState({
    principal: principal || "",
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

  if (!isOpen) return null;

  // Convert file to base64
  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        if (typeof reader.result === "string") {
          resolve(reader.result);
        } else {
          reject(new Error("Failed to convert file to base64"));
        }
      };
      reader.onerror = (error) => reject(error);
    });
  };

  // Handle file upload
  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file (PNG, JPG, GIF, etc.)");
      return;
    }

    // Validate file size (max 5MB)
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

  // Remove uploaded image
  const removeImage = () => {
    setFormData((prev) => ({ ...prev, image: "" }));
    setImagePreview("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Handle URL input
  const handleImageUrlChange = (url: string) => {
    setFormData((prev) => ({ ...prev, image: url }));
    setImagePreview(url);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const now = new Date();

      const proposalData = {
        principal: formData.principal,
        title: formData.title,
        description: formData.description,
        full_description: formData.fullDescription,
        category: formData.category,
        durationDays: parseInt(formData.duration),
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
        votes: {
          yes: 0,
          no: 0,
        },
        totalVoters: 0,
        discussions: 0,
      };

      console.log("Passing Proposal data to parent:", proposalData);
      await onCreateProposal(proposalData);

      // Reset form after successful submission
      setFormData({
        principal: principal || "",
        title: "",
        description: "",
        fullDescription: "",
        category: "Governance",
        duration: "7",
        image: "",
        author: "",
      });
      setImagePreview("");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (err) {
      console.error("Failed to submit Proposal:", err);
      if (err instanceof Error) {
        alert(`Failed to submit proposal: ${err.message}`);
      } else {
        alert("Failed to submit Proposal. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <BackgroundOverlay onClose={onClose} />

        {/* Modal */}
        <div
          className={`inline-block w-full max-w-2xl my-8 overflow-hidden text-left align-middle transition-all transform rounded-2xl shadow-xl ${
            darkMode ? "bg-gray-800" : "bg-white"
          }`}
        >
          {/* Header */}
          <HeaderCreateProposal darkMode={darkMode} onClose={onClose} />

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Principal ID */}
            <FormInput
              label="Principal ID"
              type="text"
              name="principal"
              value={principal}
              onChange={(e) => handleInputChange("principal", e.target.value)}
              placeholder="Enter Your Principal ID"
              disabled={true}
              darkMode={darkMode}
            />

            {/* Author */}
            <FormInput
              label="Author"
              type="text"
              name="author"
              value={formData.author}
              onChange={(e) => handleInputChange("author", e.target.value)}
              placeholder="Enter Your Name"
              darkMode={darkMode}
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

            {/* Category and Duration */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              onChange={(value) => handleInputChange("description", value)}
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
              onChange={(value) => handleInputChange("fullDescription", value)}
              placeholder="Provide a comprehensive explanation of your proposal..."
              rows={6}
              required={true}
              darkMode={darkMode}
            />

            {/* Image Upload Section */}
            <div>
              <label
                className={`block text-sm font-medium mb-2 ${
                  darkMode ? "text-white" : "text-gray-900"
                }`}
              >
                Proposal Image (Optional)
              </label>

              {/* Upload Options */}
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
                    className={`flex items-center justify-center w-full px-4 py-3 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                      darkMode
                        ? "border-gray-600 hover:border-purple-500 bg-gray-700/50"
                        : "border-gray-300 hover:border-purple-500 bg-gray-50"
                    } ${isUploading ? "pointer-events-none opacity-50" : ""}`}
                  >
                    <div className="flex flex-col items-center space-y-2">
                      {isUploading ? (
                        <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <Upload
                          size={24}
                          className={
                            darkMode ? "text-gray-400" : "text-gray-500"
                          }
                        />
                      )}
                      <div className="text-center">
                        <p
                          className={`text-sm font-medium ${
                            darkMode ? "text-white" : "text-gray-900"
                          }`}
                        >
                          {isUploading ? "Uploading..." : "Upload Image"}
                        </p>
                        <p
                          className={`text-xs ${
                            darkMode ? "text-gray-400" : "text-gray-500"
                          }`}
                        >
                          PNG, JPG, GIF up to 5MB
                        </p>
                      </div>
                    </div>
                  </label>
                </div>

                {/* OR Separator */}
                <div className="flex items-center">
                  <div
                    className={`flex-1 border-t ${
                      darkMode ? "border-gray-600" : "border-gray-300"
                    }`}
                  ></div>
                  <span
                    className={`px-3 text-sm ${
                      darkMode ? "text-gray-400" : "text-gray-500"
                    }`}
                  >
                    OR
                  </span>
                  <div
                    className={`flex-1 border-t ${
                      darkMode ? "border-gray-600" : "border-gray-300"
                    }`}
                  ></div>
                </div>

                {/* URL Input */}
                <div className="relative">
                  <input
                    type="url"
                    value={
                      formData.image.startsWith("data:") ? "" : formData.image
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
                    className={`absolute left-4 top-1/2 transform -translate-y-1/2 ${
                      darkMode ? "text-gray-400" : "text-gray-500"
                    }`}
                  />
                </div>
              </div>

              {/* Image Preview */}
              {imagePreview && (
                <div className="mt-4">
                  <div className="relative inline-block">
                    <img
                      src={imagePreview || "/placeholder.svg"}
                      alt="Preview"
                      className="max-w-full h-32 object-cover rounded-lg border"
                    />
                    <button
                      type="button"
                      onClick={removeImage}
                      className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <p
                    className={`text-xs mt-2 ${
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

            {/* Submit Button */}
            <div className="flex space-x-4 pt-4">
              <Button
                type="button"
                onClick={onClose}
                variant="secondary"
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || isUploading}
                variant="gradient"
                className="flex-1"
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
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
    </div>
  );
}
