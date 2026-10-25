import React, { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { api } from "@/api/localDataService";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  ArrowLeft,
  Ticket,
  Share2,
  Heart,
  Loader2,
  Check,
  Navigation,
} from "lucide-react";
import { format, isToday, isTomorrow, isPast, isFuture } from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { createPageUrl } from "../utils";
import { cn } from "@/lib/utils";

export default function EventDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isBooking, setIsBooking] = useState(false);

  // Same query the Profile page uses, so a booking made here shows up there and vice versa
  const { data: bookings = [] } = useQuery({
    queryKey: ["userBookings"],
    queryFn: () => api.bookings.list(),
  });
  const isBooked = bookings.some((b) => b.event_id === id && b.status !== "cancelled");

  const { data: event, isLoading } = useQuery({
    queryKey: ["event", id],
    queryFn: () => api.entities.Event.get(id),
  });

  const { data: locations = [] } = useQuery({
    queryKey: ["locations"],
    queryFn: () => api.entities.Location.list(),
  });

  const location = locations.find((l) => l.id === event?.location_id);

  const handleBookEvent = async () => {
    setIsBooking(true);
    try {
      await api.bookings.create(event.id, {
        event_title: event.title,
        event_date: event.start_time,
        location: location?.zone_name,
      });
      await queryClient.invalidateQueries({ queryKey: ["userBookings"] });
      toast.success("Event booked successfully!");
    } catch (error) {
      if (error.message?.includes("login") || error.message?.includes("auth")) {
        toast.error("Please sign in to book events");
        navigate(createPageUrl("Login"));
      } else {
        toast.error(error.message || "Failed to book event");
      }
    } finally {
      setIsBooking(false);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: event.title,
          text: event.description,
          url: window.location.href,
        });
      } catch (err) {
        // User cancelled sharing
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied to clipboard!");
    }
  };

  if (isLoading) {
    return (
      <div className="pb-24 lg:pb-8">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <Skeleton className="h-64 rounded-2xl mb-6" />
          <Skeleton className="h-8 w-2/3 mb-4" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="pb-24 lg:pb-8">
        <div className="max-w-4xl mx-auto px-4 py-16 text-center">
          <h2 className="text-xl font-bold mb-2">Event not found</h2>
          <p className="text-stone-500 mb-6">This event doesn't exist or has been removed.</p>
          <Link to={createPageUrl("Events")}>
            <Button>View All Events</Button>
          </Link>
        </div>
      </div>
    );
  }

  const startDate = new Date(event.start_time);
  const endDate = event.end_time ? new Date(event.end_time) : null;
  const now = new Date();
  const isOngoing = startDate <= now && (!endDate || endDate >= now);
  const isUpcoming = isFuture(startDate);
  const canBook = isUpcoming && !isPast(startDate);

  const getDateLabel = () => {
    if (isToday(startDate)) return "Today";
    if (isTomorrow(startDate)) return "Tomorrow";
    return format(startDate, "EEEE, MMMM d, yyyy");
  };

  const categoryColors = {
    families: "bg-pink-100 text-pink-700",
    schools: "bg-blue-100 text-blue-700",
    entrepreneurs: "bg-purple-100 text-purple-700",
    general: "bg-stone-100 text-stone-700",
  };

  return (
    <div className="pb-24 lg:pb-8">
      {/* Back Button */}
      <div className="sticky top-16 z-40 bg-white/95 backdrop-blur-sm border-b border-stone-200">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-stone-600 hover:text-stone-900"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back</span>
          </button>
          <button
            onClick={handleShare}
            className="p-2 hover:bg-stone-100 rounded-lg"
            aria-label="Share event"
          >
            <Share2 className="w-5 h-5 text-stone-600" />
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Hero Image */}
        {event.image_url && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative h-64 md:h-80 rounded-2xl overflow-hidden mb-6"
          >
            <img
              src={event.image_url}
              alt={event.title}
              className="w-full h-full object-cover"
            />
            {isOngoing && (
              <div className="absolute top-4 left-4">
                <Badge className="bg-green-500 text-white border-0">
                  <span className="w-2 h-2 bg-white rounded-full animate-pulse mr-2" />
                  Happening Now
                </Badge>
              </div>
            )}
          </motion.div>
        )}

        {/* Event Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          {/* Category & Date */}
          <div className="flex items-center gap-3 mb-4">
            <Badge className={cn("capitalize", categoryColors[event.category] || categoryColors.general)}>
              <Users className="w-3 h-3 mr-1" />
              {event.category}
            </Badge>
            <span className="text-sm font-medium text-[#2D5016]">{getDateLabel()}</span>
          </div>

          {/* Title */}
          <h1 className="text-2xl md:text-3xl font-bold text-stone-900 mb-4">
            {event.title}
          </h1>

          {/* Time & Location */}
          <div className="flex flex-wrap gap-4 mb-6">
            <div className="flex items-center gap-2 text-stone-600">
              <Clock className="w-5 h-5" />
              <span>
                {format(startDate, "h:mm a")}
                {endDate && ` - ${format(endDate, "h:mm a")}`}
              </span>
            </div>
            {location && (
              <div className="flex items-center gap-2 text-stone-600">
                <MapPin className="w-5 h-5" />
                <span>{location.zone_name}</span>
              </div>
            )}
          </div>

          {/* Description */}
          <div className="prose prose-stone max-w-none mb-8">
            <p className="text-stone-600 text-lg leading-relaxed">
              {event.description}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            {canBook && (
              <Button
                size="lg"
                onClick={handleBookEvent}
                disabled={isBooking || isBooked}
                className={cn(
                  "flex-1",
                  isBooked
                    ? "bg-green-600 hover:bg-green-600"
                    : "bg-[#2D5016] hover:bg-[#4A7C23]"
                )}
              >
                {isBooking ? (
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                ) : isBooked ? (
                  <Check className="w-5 h-5 mr-2" />
                ) : (
                  <Ticket className="w-5 h-5 mr-2" />
                )}
                {isBooked ? "Booked!" : "Book This Event"}
              </Button>
            )}

            {event.location_id && (
              <Link to={createPageUrl(`MapZones?zone=${event.location_id}`)} className="flex-1">
                <Button variant="outline" size="lg" className="w-full">
                  <Navigation className="w-5 h-5 mr-2" />
                  View on Map
                </Button>
              </Link>
            )}
          </div>
        </motion.div>

        {/* Location Details */}
        {location && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-8 p-6 bg-stone-50 rounded-2xl"
          >
            <h2 className="font-semibold text-stone-900 mb-3 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-[#2D5016]" />
              Location
            </h2>
            <h3 className="font-medium text-stone-900">{location.zone_name}</h3>
            {location.description && (
              <p className="text-stone-600 mt-2">{location.description}</p>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}
