import React from "react";
import { Link, useOutletContext } from "react-router-dom";
import { api } from "@/api/localDataService";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Calendar,
  Compass,
  Store,
  MapPin,
  Bell,
  Ticket,
  TrendingUp,
  MessageCircle,
  Search,
  Users,
  ArrowRight,
  RotateCcw,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useConfirmDialog } from "@/components/ui/confirm-dialog";
import { format } from "date-fns";
import { toast } from "sonner";

export default function AdminDashboard() {
  const { staff } = useOutletContext();
  const queryClient = useQueryClient();
  const { confirm, ConfirmDialogComponent } = useConfirmDialog();

  const handleResetData = async () => {
    const confirmed = await confirm({
      title: "Reset Demo Data",
      message: "This will reset all data to demo/sample data. Any changes you have made will be lost. Are you sure?",
      confirmText: "Reset Data",
      cancelText: "Cancel",
      variant: "warning",
    });

    if (!confirmed) return;

    if (typeof window.resetGraciaData === "function") {
      window.resetGraciaData();
      // Invalidate all queries to refetch fresh data
      queryClient.invalidateQueries();
      toast.success("Demo data has been reset successfully!");
      // Reload to ensure everything is fresh
      setTimeout(() => window.location.reload(), 500);
    } else {
      toast.error("Reset function not available");
    }
  };

  const { data: analytics, isLoading } = useQuery({
    queryKey: ["analytics"],
    queryFn: () => api.analytics.getAnalytics(),
  });

  const { data: events } = useQuery({
    // Own key: the visitor pages cache the full list under ["events"]
    queryKey: ["adminEvents", "recent"],
    queryFn: () => api.entities.Event.list("-start_time", 5),
  });

  const statCards = [
    {
      label: "Total Events",
      value: analytics?.totalEvents || 0,
      icon: Calendar,
      color: "bg-blue-500",
      link: "/admin/events",
    },
    {
      label: "Activities",
      value: analytics?.totalActivities || 0,
      icon: Compass,
      color: "bg-green-500",
      link: "/admin/activities",
    },
    {
      label: "Shops",
      value: analytics?.totalShops || 0,
      icon: Store,
      color: "bg-purple-500",
      link: "/admin/shops",
    },
    {
      label: "Bookings",
      value: analytics?.totalBookings || 0,
      icon: Ticket,
      color: "bg-amber-500",
      link: null,
    },
  ];

  if (isLoading) {
    return (
      <div className="p-6 lg:p-8 space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-80 rounded-xl" />
          <Skeleton className="h-80 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-stone-900">
          Welcome back, {staff?.name?.split(" ")[0] || "Staff"}
        </h1>
        <p className="text-stone-500 mt-1">
          Here's what's happening at Gracia today
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            {stat.link ? (
              <Link
                to={stat.link}
                className="block bg-white rounded-xl p-6 border border-stone-200 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-stone-500">{stat.label}</p>
                    <p className="text-3xl font-bold text-stone-900 mt-1">{stat.value}</p>
                  </div>
                  <div className={`w-12 h-12 ${stat.color} rounded-xl flex items-center justify-center`}>
                    <stat.icon className="w-6 h-6 text-white" />
                  </div>
                </div>
              </Link>
            ) : (
              <div className="bg-white rounded-xl p-6 border border-stone-200">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-stone-500">{stat.label}</p>
                    <p className="text-3xl font-bold text-stone-900 mt-1">{stat.value}</p>
                  </div>
                  <div className={`w-12 h-12 ${stat.color} rounded-xl flex items-center justify-center`}>
                    <stat.icon className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Events */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-xl border border-stone-200 overflow-hidden"
        >
          <div className="p-6 border-b border-stone-100 flex items-center justify-between">
            <h2 className="font-semibold text-stone-900 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-500" />
              Recent Events
            </h2>
            <Link to="/admin/events" className="text-sm text-[#2D5016] hover:underline flex items-center gap-1">
              View all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="divide-y divide-stone-100">
            {events?.slice(0, 5).map((event) => (
              <div key={event.id} className="p-4 hover:bg-stone-50">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-medium text-stone-900">{event.title}</h3>
                    <p className="text-sm text-stone-500 mt-1">
                      {format(new Date(event.start_time), "MMM d, yyyy 'at' h:mm a")}
                    </p>
                  </div>
                  <span className="px-2 py-1 bg-stone-100 text-stone-600 text-xs font-medium rounded capitalize">
                    {event.category}
                  </span>
                </div>
              </div>
            ))}
            {(!events || events.length === 0) && (
              <div className="p-8 text-center text-stone-500">
                No events found
              </div>
            )}
          </div>
        </motion.div>

        {/* Recent Bookings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-xl border border-stone-200 overflow-hidden"
        >
          <div className="p-6 border-b border-stone-100">
            <h2 className="font-semibold text-stone-900 flex items-center gap-2">
              <Ticket className="w-5 h-5 text-amber-500" />
              Recent Bookings
            </h2>
          </div>
          <div className="divide-y divide-stone-100">
            {analytics?.recentBookings?.slice(0, 5).map((booking) => (
              <div key={booking.id} className="p-4 hover:bg-stone-50">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-medium text-stone-900">{booking.event_title}</h3>
                    <p className="text-sm text-stone-500 mt-1">
                      {format(new Date(booking.created_at), "MMM d 'at' h:mm a")}
                    </p>
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded ${
                    booking.status === "confirmed"
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}>
                    {booking.status}
                  </span>
                </div>
              </div>
            ))}
            {(!analytics?.recentBookings || analytics.recentBookings.length === 0) && (
              <div className="p-8 text-center text-stone-500">
                No bookings yet
              </div>
            )}
          </div>
        </motion.div>

        {/* Top Searches */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white rounded-xl border border-stone-200 overflow-hidden"
        >
          <div className="p-6 border-b border-stone-100">
            <h2 className="font-semibold text-stone-900 flex items-center gap-2">
              <Search className="w-5 h-5 text-purple-500" />
              Top Searches
            </h2>
          </div>
          <div className="p-4">
            {analytics?.topSearches?.length > 0 ? (
              <div className="space-y-3">
                {analytics.topSearches.map((item, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <span className="w-6 h-6 bg-stone-100 rounded text-xs font-medium flex items-center justify-center">
                      {index + 1}
                    </span>
                    <span className="flex-1 text-stone-700">{item.query}</span>
                    <span className="text-sm text-stone-500">{item.count}x</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-4 text-center text-stone-500">
                No search data yet
              </div>
            )}
          </div>
        </motion.div>

        {/* AI Questions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-white rounded-xl border border-stone-200 overflow-hidden"
        >
          <div className="p-6 border-b border-stone-100">
            <h2 className="font-semibold text-stone-900 flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-green-500" />
              Top AI Questions
            </h2>
          </div>
          <div className="p-4">
            {analytics?.topAIQuestions?.length > 0 ? (
              <div className="space-y-3">
                {analytics.topAIQuestions.map((item, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <span className="w-6 h-6 bg-stone-100 rounded text-xs font-medium flex items-center justify-center">
                      {index + 1}
                    </span>
                    <span className="flex-1 text-stone-700 truncate">{item.question}</span>
                    <span className="text-sm text-stone-500">{item.count}x</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-4 text-center text-stone-500">
                No AI questions yet
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="mt-8 p-6 bg-gradient-to-r from-[#2D5016] to-[#4A7C23] rounded-xl text-white"
      >
        <h2 className="font-semibold mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          {staff?.rolePermissions?.areas?.includes("events") || staff?.rolePermissions?.areas?.includes("all") ? (
            <Link
              to="/admin/events"
              className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors"
            >
              + Add Event
            </Link>
          ) : null}
          {staff?.rolePermissions?.areas?.includes("announcements") || staff?.rolePermissions?.areas?.includes("all") ? (
            <Link
              to="/admin/announcements"
              className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors"
            >
              + New Announcement
            </Link>
          ) : null}
          <Link
            to="/"
            className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors"
          >
            View Visitor App
          </Link>
          <button
            onClick={handleResetData}
            className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Reset Demo Data
          </button>
        </div>
      </motion.div>

      {/* Confirm Dialog */}
      {ConfirmDialogComponent}
    </div>
  );
}
