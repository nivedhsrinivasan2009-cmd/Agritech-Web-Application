import React, { useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../../utils";
import { Calendar, Clock, MapPin, Users, Ticket, Loader2, Check } from "lucide-react";
import { format, isToday, isTomorrow, isPast, isFuture } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { api } from "@/api/localDataService";
import { toast } from "sonner";

export default function EventCard({ event, location, compact = false, onBookingSuccess }) {
  const [isBooking, setIsBooking] = useState(false);
  const [isBooked, setIsBooked] = useState(false);

  const startDate = new Date(event.start_time);
  const endDate = event.end_time ? new Date(event.end_time) : null;
  const now = new Date();

  const isOngoing = startDate <= now && (!endDate || endDate >= now);
  const isUpcoming = isFuture(startDate);
  const canBook = isUpcoming && !isPast(startDate);

  const handleBookEvent = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    setIsBooking(true);
    try {
      await api.bookings.create(event.id, {
        event_title: event.title,
        event_date: event.start_time,
        location: location?.zone_name,
      });
      setIsBooked(true);
      toast.success("Event booked successfully!");
      onBookingSuccess?.();
    } catch (error) {
      if (error.message?.includes("login") || error.message?.includes("auth")) {
        toast.error("Please sign in to book events");
      } else {
        toast.error(error.message || "Failed to book event");
      }
    } finally {
      setIsBooking(false);
    }
  };
  
  const getDateLabel = () => {
    if (isToday(startDate)) return "Today";
    if (isTomorrow(startDate)) return "Tomorrow";
    return format(startDate, "MMM d");
  };

  const categoryColors = {
    families: "bg-pink-100 text-pink-700 border-pink-200",
    schools: "bg-blue-100 text-blue-700 border-blue-200",
    entrepreneurs: "bg-purple-100 text-purple-700 border-purple-200",
    general: "bg-stone-100 text-stone-700 border-stone-200",
  };

  if (compact) {
    return (
      <div className="flex items-center gap-4 p-4 bg-white rounded-xl border border-stone-100 hover:border-stone-200 hover:shadow-sm transition-all">
        <div className="flex-shrink-0 w-14 h-14 rounded-lg bg-[#2D5016]/10 flex flex-col items-center justify-center">
          <span className="text-xs font-medium text-[#2D5016]">{format(startDate, "MMM")}</span>
          <span className="text-lg font-bold text-[#2D5016]">{format(startDate, "d")}</span>
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-stone-900 truncate">{event.title}</h4>
          <p className="text-sm text-stone-500">{format(startDate, "h:mm a")}</p>
        </div>
        {isOngoing && (
          <Badge className="bg-green-100 text-green-700 border-green-200">Live</Badge>
        )}
      </div>
    );
  }

  return (
    <Link to={`/events/${event.id}`} className="block bg-white rounded-2xl overflow-hidden border border-stone-100 hover:shadow-lg transition-all duration-300 group">
      {/* Image */}
      {event.image_url && (
        <div className="relative h-40 overflow-hidden">
          <img 
            src={event.image_url} 
            alt={event.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute top-3 left-3 flex gap-2">
            {isOngoing && (
              <Badge className="bg-green-500 text-white border-0">
                <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse mr-1.5" />
                Happening Now
              </Badge>
            )}
          </div>
        </div>
      )}
      
      {/* Content */}
      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <Badge 
            variant="outline" 
            className={cn("capitalize", categoryColors[event.category] || categoryColors.general)}
          >
            <Users className="w-3 h-3 mr-1" />
            {event.category}
          </Badge>
          <span className="text-sm font-medium text-[#2D5016]">{getDateLabel()}</span>
        </div>
        
        <h3 className="text-lg font-semibold text-stone-900 mb-2 line-clamp-2">{event.title}</h3>
        
        {event.description && (
          <p className="text-sm text-stone-500 mb-4 line-clamp-2">{event.description}</p>
        )}
        
        <div className="flex flex-wrap items-center gap-3 text-sm text-stone-500 mb-4">
          <div className="flex items-center gap-1.5">
            <Clock className="w-4 h-4" />
            <span>{format(startDate, "h:mm a")}</span>
            {endDate && <span>- {format(endDate, "h:mm a")}</span>}
          </div>
          {location && (
            <div className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4" />
              <span>{location.zone_name}</span>
            </div>
          )}
        </div>
        
        <div className="flex gap-2">
          {event.location_id && (
            <Link to={createPageUrl(`MapZones?zone=${event.location_id}`)} className="flex-1">
              <Button variant="outline" size="sm" className="w-full text-[#2D5016] border-[#2D5016]/30 hover:bg-[#2D5016]/5">
                <MapPin className="w-4 h-4 mr-2" />
                Map
              </Button>
            </Link>
          )}
          {canBook && (
            <Button
              size="sm"
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
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : isBooked ? (
                <>
                  <Check className="w-4 h-4 mr-1" />
                  Booked
                </>
              ) : (
                <>
                  <Ticket className="w-4 h-4 mr-1" />
                  Book
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </Link>
  );
}