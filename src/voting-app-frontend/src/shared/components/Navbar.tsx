"use client";

import type React from "react";
import { useEffect, useRef, useState } from "react";

import VoteVerse from "@/assets/img/logo_vote_verse.png";
import Button from "@/shared/components/Button";
import Logo from "@/shared/components/Logo";
import {
  BookOpen,
  ChevronDown,
  DollarSign,
  Home,
  Info,
  LogOut,
  Mail,
  Menu,
  Moon,
  Settings,
  Sun,
  User,
  Vote,
  Wallet,
  X,
} from "lucide-react";
import { PlugWalletButton } from "@/features/wallet/PlugWalletButton";
import { payProposalFee } from "@/ic/payProposal";

interface AdaptiveNavbarProps {
  darkMode: boolean;
  toggleDarkMode: () => void;
  isAuthenticated: boolean;
  onLogin: () => void;
  onLogout: () => void;
  onCreateProposal: () => void;
  principal?: string;
  votingPower?: number;
  currentPage?: string;
  onNavigate?: (page: string) => void;
  userAvatar?: string;
  userName?: string;
}

// Navigation Link Type
type NavLink = {
  name: string;
  href: string;
  icon: React.ComponentType<any>;
  external?: boolean;
};

const guestNavLinks: NavLink[] = [
  { name: "Home", href: "", icon: Home },
  { name: "Pricing", href: "pricing", icon: DollarSign },
  { name: "About", href: "about", icon: Info },
  { name: "Contact Us", href: "contact-us", icon: Mail },
  {
    name: "Blog",
    href: "https://blog-voteverse.netlify.app/blog",
    icon: BookOpen,
    external: true,
  },
];

const authenticatedNavLinks: NavLink[] = [
  { name: "Dashboard", href: "dashboard", icon: Home },
  { name: "Active Votes", href: "votes", icon: Vote },
];

export default function AdaptiveNavbar({
  darkMode,
  toggleDarkMode,
  isAuthenticated,
  onLogin,
  onLogout,
  onCreateProposal,
  principal,
  votingPower = 1250,
  currentPage = "",
  onNavigate,
  userAvatar,
  userName,
}: AdaptiveNavbarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navLinks = isAuthenticated ? authenticatedNavLinks : guestNavLinks;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsProfileDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleNavigation = (href: string) => {
    if (href.startsWith("http")) {
      window.open(href, "_blank");
      return;
    }

    if (onNavigate) {
      onNavigate(href);
    }

    setIsMenuOpen(false);
  };

  const formatPrincipal = (principalText: string) => {
    if (!principalText) return "";
    if (principalText.length <= 10) return principalText;
    return `${principalText.slice(0, 6)}...${principalText.slice(-4)}`;
  };

  const getInitials = (name?: string, principal?: string) => {
    if (name) {
      return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    if (principal) {
      return principal.slice(0, 2).toUpperCase();
    }
    return "II";
  };

  const handleProfileAction = (action: string) => {
    setIsProfileDropdownOpen(false);
    switch (action) {
      case "profile":
        if (onNavigate) {
          onNavigate("profile");
        }
        break;
      case "settings":
        if (onNavigate) {
          onNavigate("settings");
        }
        break;
      case "logout":
        onLogout();
        break;
      default:
        break;
    }
  };

  return (
    <nav
      className={`sticky top-0 z-50 backdrop-blur-md border-b transition-all duration-300 ${darkMode
          ? "bg-gray-900/80 border-gray-800"
          : "bg-white/80 border-gray-200"
        }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Logo name="VoteVerse" imageSrc={VoteVerse} showPulse={false} />

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => {
              const IconComponent = link.icon;
              const isActive = currentPage === link.href;

              return link.external ? (
                <a
                  key={link.name}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-200 hover:scale-105 ${darkMode
                      ? "text-gray-300 hover:text-white hover:bg-gray-800"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                    }`}
                >
                  <IconComponent size={16} />
                  <span className="font-medium">{link.name}</span>
                </a>
              ) : (
                <button
                  key={link.name}
                  onClick={() => handleNavigation(link.href)}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-200 hover:scale-105 ${isActive
                      ? darkMode
                        ? "bg-gray-800 text-white"
                        : "bg-gray-100 text-gray-900"
                      : darkMode
                        ? "text-gray-300 hover:text-white hover:bg-gray-800"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                    }`}
                >
                  <IconComponent size={16} />
                  <span className="font-medium">{link.name}</span>
                </button>
              );
            })}
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-4">
            {/* Dark Mode Toggle */}
            <button
              onClick={toggleDarkMode}
              className={`p-2 rounded-lg transition-all duration-200 hover:scale-110 ${darkMode
                  ? "bg-gray-800 text-yellow-400 hover:bg-gray-700"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
            >
              {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            {/* Authentication Section */}
            {!isAuthenticated ? (
              <Button onClick={onLogin} variant="gradient" icon={Wallet}>
                <span className="hidden sm:inline">Connect Identity</span>
                <span className="sm:hidden">Connect</span>
              </Button>
            ) : (
              <div className="flex items-center space-x-3">
                {/* Voting Power Badge - Desktop Only */}
                {/*<div*/}
                {/*    className={`hidden sm:flex items-center space-x-2 px-3 py-2 rounded-lg ${*/}
                {/*        darkMode ? "bg-gray-800 text-white" : "bg-gray-100 text-gray-900"*/}
                {/*    }`}*/}
                {/*>*/}
                {/*  <div className="w-2 h-2 bg-green-400 rounded-full"></div>*/}
                {/*  <span className="text-sm font-medium">{votingPower.toLocaleString()} VP</span>*/}
                {/*</div>*/}
                <PlugWalletButton
                  darkMode={darkMode}
                  isAuthenticated={isAuthenticated}
                  onPayProposal={async () => {
                    await payProposalFee(); // ganti kalau kamu punya handler lain
                  }}
                />

                {/* Profile Dropdown */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() =>
                      setIsProfileDropdownOpen(!isProfileDropdownOpen)
                    }
                    className={`flex items-center space-x-2 p-2 rounded-lg transition-all duration-200  ${darkMode
                        ? "bg-gray-800 text-white hover:bg-gray-700"
                        : "bg-gray-100 text-gray-900 hover:bg-gray-200"
                      }`}
                  >
                    {/* Custom Avatar */}
                    <div className="relative">
                      {userAvatar ? (
                        <img
                          src={userAvatar || "/placeholder.svg"}
                          alt={userName || "User"}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${darkMode
                              ? "bg-gray-600 text-white"
                              : "bg-gray-300 text-gray-700"
                            }`}
                        >
                          {getInitials(userName, principal)}
                        </div>
                      )}
                      {/* Online Status Indicator */}
                      <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-white dark:border-gray-900"></div>
                    </div>

                    {/* User Info - Hidden on Mobile */}
                    <div className="hidden sm:block text-left">
                      <div className="text-sm font-medium">
                        {userName || "Internet Identity"}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {formatPrincipal(principal || "")}
                      </div>
                    </div>

                    <ChevronDown
                      size={16}
                      className={`transition-transform duration-200 ${isProfileDropdownOpen ? "rotate-180" : ""
                        }`}
                    />
                  </button>

                  {/* Dropdown Menu */}
                  {isProfileDropdownOpen && (
                    <div
                      className={`absolute right-0 mt-2 w-64 rounded-lg shadow-lg border z-50 ${darkMode
                          ? "bg-gray-900 border-gray-700"
                          : "bg-white border-gray-200"
                        }`}
                    >
                      {/* User Info Header */}
                      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                        <div className="flex items-center space-x-3">
                          {userAvatar ? (
                            <img
                              src={userAvatar || "/placeholder.svg"}
                              alt={userName || "User"}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <div
                              className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${darkMode
                                  ? "bg-gray-600 text-white"
                                  : "bg-gray-300 text-gray-700"
                                }`}
                            >
                              {getInitials(userName, principal)}
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium truncate">
                              {userName || "Internet Identity"}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                              {formatPrincipal(principal || "")}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Mobile Voting Power */}
                      <div className="sm:hidden px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                          <span className="text-sm text-gray-600 dark:text-gray-300">
                            {votingPower.toLocaleString()} Voting Power
                          </span>
                        </div>
                      </div>

                      {/* Menu Items */}
                      <div className="py-2">
                        <button
                          onClick={() => handleProfileAction("profile")}
                          className={`w-full flex items-center space-x-3 px-4 py-2 text-sm transition-colors ${darkMode
                              ? "text-gray-300 hover:bg-gray-800 hover:text-white"
                              : "text-gray-700 hover:bg-gray-100"
                            }`}
                        >
                          <User size={16} />
                          <span>Profile</span>
                        </button>

                        <button
                          onClick={() => handleProfileAction("settings")}
                          className={`w-full flex items-center space-x-3 px-4 py-2 text-sm transition-colors ${darkMode
                              ? "text-gray-300 hover:bg-gray-800 hover:text-white"
                              : "text-gray-700 hover:bg-gray-100"
                            }`}
                        >
                          <Settings size={16} />
                          <span>Settings</span>
                        </button>

                        <div className="border-t border-gray-200 dark:border-gray-700 my-2"></div>

                        <button
                          onClick={() => handleProfileAction("logout")}
                          className={`w-full flex items-center space-x-3 px-4 py-2 text-sm transition-colors text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20`}
                        >
                          <LogOut size={16} />
                          <span>Log out</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className={`md:hidden p-2 rounded-lg ${darkMode
                  ? "text-white hover:bg-gray-800"
                  : "text-gray-900 hover:bg-gray-100"
                }`}
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMenuOpen && (
          <div
            className={`md:hidden border-t ${darkMode ? "border-gray-800" : "border-gray-200"
              }`}
          >
            <div className="px-2 pt-2 pb-3 space-y-1">
              {navLinks.map((link) => {
                const IconComponent = link.icon;
                const isActive = currentPage === link.href;

                return link.external ? (
                  <a
                    key={link.name}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors text-left ${darkMode
                        ? "text-gray-300 hover:text-white hover:bg-gray-800"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                      }`}
                  >
                    <IconComponent size={18} />
                    <span className="font-medium">{link.name}</span>
                  </a>
                ) : (
                  <button
                    key={link.name}
                    onClick={() => handleNavigation(link.href)}
                    className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors text-left ${isActive
                        ? darkMode
                          ? "bg-gray-800 text-white"
                          : "bg-gray-100 text-gray-900"
                        : darkMode
                          ? "text-gray-300 hover:text-white hover:bg-gray-800"
                          : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                      }`}
                  >
                    <IconComponent size={18} />
                    <span className="font-medium">{link.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
