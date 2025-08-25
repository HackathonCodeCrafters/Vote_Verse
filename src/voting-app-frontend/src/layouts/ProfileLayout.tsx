"use client";

import { useState } from "react";
import ProfilePage from "../features/Profile/pages/Profile";
import AdaptiveNavbar from "../shared/components/Navbar";

export default function ProfileLayout() {
  const [darkMode, setDarkMode] = useState(false);
  const [currentPage, setCurrentPage] = useState("profile");

  const mockUser = {
    principal: "rdmx6-jaaaa-aaaah-qcaiq-cai",
    userName: "John Doe",
    userAvatar: "",
    votingPower: 1250,
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  const handleNavigation = (page: string) => {
    setCurrentPage(page);
  };

  const handleLogin = () => {
    console.log("Login clicked");
  };

  const handleLogout = () => {
    console.log("Logout clicked");
  };

  const handleCreateProposal = () => {
    console.log("Create proposal clicked");
  };

  const handleUpdateProfile = (data: any) => {
    console.log("Profile updated:", data);
  };

  return (
    <div className={darkMode ? "dark" : ""}>
      <AdaptiveNavbar
        darkMode={darkMode}
        toggleDarkMode={toggleDarkMode}
        isAuthenticated={true}
        onLogin={handleLogin}
        onLogout={handleLogout}
        onCreateProposal={handleCreateProposal}
        principal={mockUser.principal}
        votingPower={mockUser.votingPower}
        currentPage={currentPage}
        onNavigate={handleNavigation}
        userAvatar={mockUser.userAvatar}
        userName={mockUser.userName}
      />

      <ProfilePage
        principal={mockUser.principal}
        userName={mockUser.userName}
        userAvatar={mockUser.userAvatar}
        votingPower={mockUser.votingPower}
        onUpdateProfile={handleUpdateProfile}
      />
    </div>
  );
}
