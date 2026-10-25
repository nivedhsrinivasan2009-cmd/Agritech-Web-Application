import React, { useEffect, useState } from "react";
import { Link, Outlet, useNavigate, useLocation } from "react-router-dom";
import { api } from "@/api/localDataService";
import { useQuery } from "@tanstack/react-query";
import {
  LayoutDashboard,
  Calendar,
  MapPin,
  Store,
  Compass,
  Bell,
  Users,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronRight,
  ExternalLink,
  Home,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/admin", area: null },
  { icon: Calendar, label: "Events", path: "/admin/events", area: "events" },
  { icon: Compass, label: "Activities", path: "/admin/activities", area: "activities" },
  { icon: Store, label: "Shops", path: "/admin/shops", area: "shops" },
  { icon: MapPin, label: "Locations", path: "/admin/zones", area: "zones" },
  { icon: Bell, label: "Announcements", path: "/admin/announcements", area: "announcements" },
  { icon: Users, label: "Staff", path: "/admin/staff", area: "staff" },
];

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { data: staff, isLoading, refetch } = useQuery({
    queryKey: ["currentStaff"],
    queryFn: () => api.adminAuth.getCurrentStaff(),
    retry: false,
  });

  useEffect(() => {
    if (!isLoading && !staff) {
      navigate("/admin/login");
    }
  }, [staff, isLoading, navigate]);

  const handleLogout = async () => {
    try {
      await api.adminAuth.logout();
      toast.success("Logged out successfully");
      navigate("/admin/login");
    } catch (error) {
      toast.error("Failed to logout");
    }
  };

  const canAccessArea = (area) => {
    if (!area) return true; // Dashboard is accessible to all
    if (!staff?.rolePermissions) return false;
    return staff.rolePermissions.areas.includes(area) || staff.rolePermissions.areas.includes("all");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-stone-100 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-[#2D5016] border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!staff) {
    return null;
  }

  return (
    <div className="min-h-screen bg-stone-100">
      {/* Mobile Header */}
      <div className="lg:hidden sticky top-0 z-50 bg-white border-b border-stone-200 px-4 py-3 flex items-center justify-between">
        <button
          onClick={() => setSidebarOpen(true)}
          className="p-2 hover:bg-stone-100 rounded-lg"
        >
          <Menu className="w-6 h-6" />
        </button>
        <span className="font-semibold text-stone-900">Admin Dashboard</span>
        <div className="flex items-center gap-1">
          <Link
            to="/"
            className="p-2 hover:bg-stone-100 rounded-lg text-[#2D5016]"
            title="Back to Visitor App"
          >
            <Home className="w-5 h-5" />
          </Link>
          <button
            onClick={handleLogout}
            className="p-2 hover:bg-stone-100 rounded-lg text-red-600"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-50"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-50 h-full w-64 bg-white border-r border-stone-200 transform transition-transform duration-300 lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Logo */}
        <div className="p-6 border-b border-stone-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#2D5016] rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-lg">G</span>
              </div>
              <div>
                <h1 className="font-bold text-stone-900">Gracia Admin</h1>
                <p className="text-xs text-stone-500">Staff Portal</p>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1 hover:bg-stone-100 rounded"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            const hasAccess = canAccessArea(item.area);

            if (!hasAccess) return null;

            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-colors",
                  isActive
                    ? "bg-[#2D5016] text-white"
                    : "text-stone-600 hover:bg-stone-100"
                )}
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
                {isActive && <ChevronRight className="w-4 h-4 ml-auto" />}
              </Link>
            );
          })}

          {/* Divider */}
          <div className="my-4 border-t border-stone-200" />

          {/* Back to Visitor App */}
          <Link
            to="/"
            onClick={() => setSidebarOpen(false)}
            className="flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-[#2D5016] hover:bg-green-50 border border-[#2D5016]/20"
          >
            <ExternalLink className="w-5 h-5" />
            <span className="font-medium">View Visitor App</span>
          </Link>
        </nav>

        {/* User Info */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-stone-200 bg-white">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-stone-100 rounded-full flex items-center justify-center">
              <span className="font-medium text-stone-600">
                {staff.name?.charAt(0) || "S"}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-stone-900 truncate">{staff.name}</p>
              <p className="text-xs text-stone-500 capitalize">
                {staff.rolePermissions?.label || staff.role}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="w-full text-red-600 border-red-200 hover:bg-red-50"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:ml-64 min-h-screen">
        <Outlet context={{ staff, refetchStaff: refetch }} />
      </main>
    </div>
  );
}
