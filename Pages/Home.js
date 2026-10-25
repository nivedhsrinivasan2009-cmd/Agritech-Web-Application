import React from "react";
import { api } from "@/api/localDataService";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import HeroCarousel from "../Components/home/HeroCarousel";
import QuickAccessGrid from "../Components/home/QuickAccessGrid";
import Announcements from "../Components/home/Announcements";
import EventCard from "../Components/shared/EventCard";
import ZoneClosureBanner from "../Components/shared/ZoneClosureBanner";
import { useMultipleRealtimeSubscriptions } from "@/hooks/useRealtimeSubscription";
import { Leaf, ArrowRight, AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export default function Home() {
  const { data: events = [], isLoading: eventsLoading } = useQuery({
    queryKey: ["events"],
    // Fetch all events (same as the Events page, which shares this cache key) so the
    // soonest upcoming events can't be cut off by a limit
    queryFn: () => api.entities.Event.list("-start_time"),
  });

  const { data: locations = [] } = useQuery({
    queryKey: ["locations"],
    queryFn: () => api.entities.Location.list(),
  });

  const { data: announcements = [] } = useQuery({
    queryKey: ["announcements"],
    queryFn: () => api.entities.Announcement.list(),
  });

  // Subscribe to real-time updates for events, locations, and announcements
  useMultipleRealtimeSubscriptions([
    { table: "events", queryKey: "events" },
    { table: "locations", queryKey: "locations" },
    { table: "announcements", queryKey: "announcements" },
  ]);

  const upcomingEvents = events
    .filter((e) => new Date(e.start_time) >= new Date())
    .sort((a, b) => new Date(a.start_time) - new Date(b.start_time))
    .slice(0, 3);

  // Filter for high/critical zone closures to show on home page
  const criticalClosures = locations.filter(
    (loc) => loc.is_closed && (loc.closure_severity === "critical" || loc.closure_severity === "high")
  );

  const getLocation = (id) => locations.find((l) => l.id === id);

  return (
    <div className="pb-24 lg:pb-8">
      {/* Hero Section */}
      <section className="px-4 pt-4 md:px-6 md:pt-6 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {eventsLoading ? (
            <Skeleton className="h-64 md:h-80 lg:h-96 rounded-2xl" />
          ) : (
            <HeroCarousel events={events} />
          )}
        </motion.div>
      </section>

      {/* Announcements */}
      {announcements.length > 0 && (
        <section className="px-4 pt-6 md:px-6 max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <Announcements announcements={announcements} />
          </motion.div>
        </section>
      )}

      {/* Zone Alerts - Show high/critical closures */}
      {criticalClosures.length > 0 && (
        <section className="px-4 pt-4 md:px-6 max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-3"
          >
            <h3 className="text-sm font-medium text-stone-500 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              Zone Alerts
            </h3>
            {criticalClosures.map((zone) => (
              <ZoneClosureBanner
                key={zone.id}
                severity={zone.closure_severity}
                zoneName={zone.zone_name}
                reason={zone.closure_reason}
                endTime={zone.closure_end_time}
              />
            ))}
          </motion.div>
        </section>
      )}

      {/* Welcome Message */}
      <section className="px-4 py-8 md:px-6 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex items-center gap-3 mb-2"
        >
          <div className="w-10 h-10 rounded-full bg-[#2D5016]/10 flex items-center justify-center">
            <Leaf className="w-5 h-5 text-[#2D5016]" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-stone-900">
              Welcome to Gracia
            </h1>
            <p className="text-stone-500">
              Explore our farm, events, and experiences
            </p>
          </div>
        </motion.div>
      </section>

      {/* Quick Access */}
      <section className="px-4 pb-8 md:px-6 max-w-7xl mx-auto">
        <motion.h2
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-lg font-semibold text-stone-900 mb-4"
        >
          Quick Access
        </motion.h2>
        <QuickAccessGrid />
      </section>

      {/* Upcoming Events */}
      {upcomingEvents.length > 0 && (
        <section className="px-4 pb-8 md:px-6 max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-stone-900">
                Upcoming Events
              </h2>
              <Link to={createPageUrl("Events")}>
                <Button variant="ghost" size="sm" className="text-[#2D5016]">
                  View All
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {upcomingEvents.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  location={getLocation(event.location_id)}
                />
              ))}
            </div>
          </motion.div>
        </section>
      )}

      {/* AI Assistant Promo */}
      <section className="px-4 pb-8 md:px-6 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Link to={createPageUrl("Assistant")}>
            <div className="bg-gradient-to-r from-[#2D5016] to-[#4A7C23] rounded-2xl p-6 text-white hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                  <svg
                    className="w-8 h-8"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M12 2a10 10 0 1 0 10 10H12V2z" />
                    <path d="M12 2a10 10 0 0 1 10 10" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-1">
                    Need Help? Ask Gracia AI
                  </h3>
                  <p className="text-white/80 text-sm">
                    Get instant answers about events, activities, and navigation
                  </p>
                </div>
                <ArrowRight className="w-5 h-5 flex-shrink-0" />
              </div>
            </div>
          </Link>
        </motion.div>
      </section>
    </div>
  );
}