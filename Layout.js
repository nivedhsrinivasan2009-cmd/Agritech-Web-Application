import React, { useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "./utils";
import {
  Home, Calendar, Leaf, Store, Map, Info, MessageCircle, Menu, X, User, LogIn, Shield
} from "lucide-react";
import { cn } from "@/lib/utils";
import AIPersona from "./Components/ai/AIPersona";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/api/localDataService";

export default function Layout({ children, currentPageName }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Check if user is logged in
  const { data: user } = useQuery({
    queryKey: ["currentUser"],
    queryFn: () => api.auth.getCurrentUser(),
    retry: false,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });

  const navItems = [
    { name: "Home", page: "Home", icon: Home },
    { name: "Events", page: "Events", icon: Calendar },
    { name: "Activities", page: "Activities", icon: Leaf },
    { name: "Shops", page: "Shops", icon: Store },
    { name: "Map", page: "MapZones", icon: Map },
    { name: "About", page: "About", icon: Info },
    { name: "AI Assistant", page: "Assistant", icon: MessageCircle },
  ];

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Skip to main content link for accessibility */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <style>{`
        :root {
          --primary: #2D5016;
          --primary-light: #4A7C23;
          --secondary: #F5F0E8;
          --accent: #D4A574;
          --text-primary: #1A1A1A;
          --text-secondary: #6B7280;
        }
      `}</style>

      {/* Top Navigation Bar */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-stone-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to={createPageUrl("Home")} className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#2D5016] to-[#4A7C23] flex items-center justify-center">
                <Leaf className="w-5 h-5 text-white" />
              </div>
              <span className="font-semibold text-lg text-[#2D5016] hidden sm:block">Gracia</span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-1" role="navigation" aria-label="Main navigation">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentPageName === item.page;
                return (
                  <Link
                    key={item.page}
                    to={createPageUrl(item.page)}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                      isActive
                        ? "bg-[#2D5016] text-white"
                        : "text-stone-600 hover:bg-stone-100 hover:text-[#2D5016]"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}

              {/* Profile / Login Button */}
              <div className="ml-2 pl-2 border-l border-stone-200 flex items-center gap-1">
                <Link
                  to={createPageUrl(user ? "Profile" : "Login")}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                    currentPageName === "Profile" || currentPageName === "Login"
                      ? "bg-[#2D5016] text-white"
                      : "text-stone-600 hover:bg-stone-100 hover:text-[#2D5016]"
                  )}
                >
                  {user ? (
                    <>
                      <User className="w-4 h-4" />
                      <span>{user.name?.split(" ")[0] || "Profile"}</span>
                    </>
                  ) : (
                    <>
                      <LogIn className="w-4 h-4" />
                      <span>Sign In</span>
                    </>
                  )}
                </Link>
                {/* Staff Portal Link */}
                <Link
                  to="/login?portal=staff"
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 text-stone-600 hover:bg-stone-100 hover:text-[#2D5016]"
                  title="Staff Portal"
                >
                  <Shield className="w-4 h-4" />
                </Link>
              </div>
            </nav>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg hover:bg-stone-100 transition-colors"
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-menu"
              aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" aria-hidden="true" /> : <Menu className="w-6 h-6" aria-hidden="true" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <nav id="mobile-menu" className="lg:hidden bg-white border-t border-stone-200 py-2 px-4 shadow-lg" role="navigation" aria-label="Mobile navigation">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPageName === item.page;
              return (
                <Link
                  key={item.page}
                  to={createPageUrl(item.page)}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all",
                    isActive
                      ? "bg-[#2D5016]/10 text-[#2D5016]"
                      : "text-stone-600 hover:bg-stone-50"
                  )}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.name}</span>
                </Link>
              );
            })}

            {/* Profile / Login link in mobile menu */}
            <div className="border-t border-stone-100 mt-2 pt-2">
              <Link
                to={createPageUrl(user ? "Profile" : "Login")}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all",
                  currentPageName === "Profile" || currentPageName === "Login"
                    ? "bg-[#2D5016]/10 text-[#2D5016]"
                    : "text-stone-600 hover:bg-stone-50"
                )}
              >
                {user ? (
                  <>
                    <User className="w-5 h-5" />
                    <span>My Profile</span>
                  </>
                ) : (
                  <>
                    <LogIn className="w-5 h-5" />
                    <span>Sign In</span>
                  </>
                )}
              </Link>
              {/* Staff Portal link in mobile menu */}
              <Link
                to="/login?portal=staff"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all text-stone-600 hover:bg-stone-50"
              >
                <Shield className="w-5 h-5" />
                <span>Staff Portal</span>
              </Link>
            </div>
          </nav>
        )}
      </header>

      {/* Main Content */}
      <main id="main-content" className="pt-16 min-h-screen" role="main" aria-label="Main content">
        {children}
      </main>

      {/* Mobile Bottom Quick Access */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-stone-200 safe-area-inset-bottom">
        <div className="flex items-center justify-around py-2">
          {[
            { name: "Home", page: "Home", icon: Home },
            { name: "Events", page: "Events", icon: Calendar },
            { name: "Map", page: "MapZones", icon: Map },
            { name: "AI", page: "Assistant", icon: MessageCircle },
          ].map((item) => {
            const Icon = item.icon;
            const isActive = currentPageName === item.page;
            return (
              <Link
                key={item.page}
                to={createPageUrl(item.page)}
                className={cn(
                  "flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-lg transition-all",
                  isActive ? "text-[#2D5016]" : "text-stone-400"
                )}
              >
                <Icon className={cn("w-5 h-5", isActive && "fill-current")} />
                <span className="text-xs font-medium">{item.name}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* AI Persona - Floating Avatar */}
      <AIPersona currentPageName={currentPageName} />
    </div>
  );
}