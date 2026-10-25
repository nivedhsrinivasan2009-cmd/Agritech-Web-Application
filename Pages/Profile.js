import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { createPageUrl } from "../utils";
import { api } from "@/api/localDataService";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  User,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Settings,
  LogOut,
  Edit2,
  Save,
  X,
  Ticket,
  Clock,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

export default function Profile() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState({});

  // Fetch user data
  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ["currentUser"],
    queryFn: () => api.auth.getCurrentUser(),
    retry: false,
    onError: () => {
      navigate(createPageUrl("Login"));
    },
  });

  // Fetch user bookings
  const { data: bookings = [], isLoading: bookingsLoading } = useQuery({
    queryKey: ["userBookings"],
    queryFn: () => api.bookings.list(),
    enabled: !!user,
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: (data) => api.auth.updateProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries(["currentUser"]);
      setIsEditing(false);
      toast.success("Profile updated successfully!");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update profile");
    },
  });

  // Cancel booking mutation
  const cancelBookingMutation = useMutation({
    mutationFn: (bookingId) => api.bookings.cancel(bookingId),
    onSuccess: () => {
      queryClient.invalidateQueries(["userBookings"]);
      toast.success("Booking cancelled");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to cancel booking");
    },
  });

  useEffect(() => {
    if (user) {
      setEditedData({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
      });
    }
  }, [user]);

  const handleLogout = async () => {
    try {
      await api.auth.logout();
      queryClient.clear();
      navigate(createPageUrl("Home"));
      toast.success("Logged out successfully");
    } catch (error) {
      toast.error("Failed to logout");
    }
  };

  const handleSaveProfile = () => {
    updateProfileMutation.mutate(editedData);
  };

  if (userLoading) {
    return (
      <div className="pb-24 lg:pb-8">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Skeleton className="h-32 rounded-2xl mb-6" />
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="pb-24 lg:pb-8">
        <div className="max-w-4xl mx-auto px-4 py-16 text-center">
          <div className="w-16 h-16 rounded-full bg-stone-100 flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8 text-stone-400" />
          </div>
          <h2 className="text-xl font-bold text-stone-900 mb-2">Not signed in</h2>
          <p className="text-stone-500 mb-6">Please sign in to view your profile</p>
          <Link to={createPageUrl("Login")}>
            <Button className="bg-[#2D5016] hover:bg-[#4A7C23]">Sign In</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-24 lg:pb-8">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#2D5016] to-[#4A7C23] text-white">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-4"
          >
            <div className="w-20 h-20 rounded-2xl bg-white/20 flex items-center justify-center">
              {user.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt={user.name}
                  className="w-full h-full rounded-2xl object-cover"
                />
              ) : (
                <User className="w-10 h-10" />
              )}
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold">{user.name || "Visitor"}</h1>
              <p className="text-white/80">{user.email}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              className="text-white hover:bg-white/20"
            >
              <LogOut className="w-5 h-5" />
            </Button>
          </motion.div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Profile Info */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="bg-white rounded-2xl border border-stone-100 overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-stone-100">
              <h2 className="font-semibold text-stone-900">Profile Information</h2>
              {isEditing ? (
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsEditing(false)}
                  >
                    <X className="w-4 h-4 mr-1" />
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSaveProfile}
                    disabled={updateProfileMutation.isPending}
                    className="bg-[#2D5016] hover:bg-[#4A7C23]"
                  >
                    <Save className="w-4 h-4 mr-1" />
                    Save
                  </Button>
                </div>
              ) : (
                <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
                  <Edit2 className="w-4 h-4 mr-1" />
                  Edit
                </Button>
              )}
            </div>

            <div className="p-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-stone-500 mb-1">
                    Full Name
                  </label>
                  {isEditing ? (
                    <Input
                      value={editedData.name}
                      onChange={(e) =>
                        setEditedData((prev) => ({ ...prev, name: e.target.value }))
                      }
                    />
                  ) : (
                    <p className="text-stone-900">{user.name || "Not set"}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-stone-500 mb-1">
                    Email
                  </label>
                  {isEditing ? (
                    <Input
                      type="email"
                      value={editedData.email}
                      onChange={(e) =>
                        setEditedData((prev) => ({ ...prev, email: e.target.value }))
                      }
                    />
                  ) : (
                    <p className="text-stone-900">{user.email}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-stone-500 mb-1">
                    Phone
                  </label>
                  {isEditing ? (
                    <Input
                      type="tel"
                      value={editedData.phone}
                      onChange={(e) =>
                        setEditedData((prev) => ({ ...prev, phone: e.target.value }))
                      }
                      placeholder="+1 (555) 123-4567"
                    />
                  ) : (
                    <p className="text-stone-900">{user.phone || "Not set"}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-stone-500 mb-1">
                    Member Since
                  </label>
                  <p className="text-stone-900">
                    {user.created_at
                      ? format(new Date(user.created_at), "MMMM d, yyyy")
                      : "Unknown"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Bookings */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="bg-white rounded-2xl border border-stone-100 overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-stone-100">
              <h2 className="font-semibold text-stone-900 flex items-center gap-2">
                <Ticket className="w-5 h-5 text-[#2D5016]" />
                My Bookings
              </h2>
              <Link to={createPageUrl("Events")}>
                <Button variant="ghost" size="sm">
                  Browse Events
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>

            <div className="p-4">
              {bookingsLoading ? (
                <div className="space-y-3">
                  {[1, 2].map((i) => (
                    <Skeleton key={i} className="h-20 rounded-xl" />
                  ))}
                </div>
              ) : bookings.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center mx-auto mb-3">
                    <Calendar className="w-6 h-6 text-stone-400" />
                  </div>
                  <p className="text-stone-500 mb-4">No bookings yet</p>
                  <Link to={createPageUrl("Events")}>
                    <Button variant="outline" size="sm">
                      Explore Events
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {bookings.map((booking) => (
                    <div
                      key={booking.id}
                      className="flex items-center gap-4 p-4 bg-stone-50 rounded-xl"
                    >
                      <div className="w-12 h-12 rounded-lg bg-[#2D5016]/10 flex items-center justify-center flex-shrink-0">
                        <Calendar className="w-6 h-6 text-[#2D5016]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-stone-900 truncate">
                          {booking.event_title}
                        </h4>
                        <div className="flex items-center gap-3 text-sm text-stone-500 mt-1">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {format(new Date(booking.event_date), "MMM d, h:mm a")}
                          </span>
                          {booking.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5" />
                              {booking.location}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          className={
                            booking.status === "confirmed"
                              ? "bg-green-100 text-green-700"
                              : booking.status === "cancelled"
                              ? "bg-red-100 text-red-700"
                              : "bg-amber-100 text-amber-700"
                          }
                        >
                          {booking.status}
                        </Badge>
                        {booking.status !== "cancelled" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => cancelBookingMutation.mutate(booking.id)}
                            className="text-stone-500 hover:text-red-600"
                          >
                            Cancel
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </motion.section>

        {/* Quick Actions */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Link to={createPageUrl("Events")}>
              <div className="bg-white rounded-xl border border-stone-100 p-4 hover:shadow-md transition-shadow">
                <Calendar className="w-6 h-6 text-emerald-600 mb-2" />
                <p className="font-medium text-stone-900 text-sm">Events</p>
              </div>
            </Link>
            <Link to={createPageUrl("Activities")}>
              <div className="bg-white rounded-xl border border-stone-100 p-4 hover:shadow-md transition-shadow">
                <MapPin className="w-6 h-6 text-lime-600 mb-2" />
                <p className="font-medium text-stone-900 text-sm">Activities</p>
              </div>
            </Link>
            <Link to={createPageUrl("MapZones")}>
              <div className="bg-white rounded-xl border border-stone-100 p-4 hover:shadow-md transition-shadow">
                <MapPin className="w-6 h-6 text-blue-600 mb-2" />
                <p className="font-medium text-stone-900 text-sm">Map</p>
              </div>
            </Link>
            <Link to={createPageUrl("Assistant")}>
              <div className="bg-white rounded-xl border border-stone-100 p-4 hover:shadow-md transition-shadow">
                <Settings className="w-6 h-6 text-purple-600 mb-2" />
                <p className="font-medium text-stone-900 text-sm">AI Help</p>
              </div>
            </Link>
          </div>
        </motion.section>
      </div>
    </div>
  );
}
