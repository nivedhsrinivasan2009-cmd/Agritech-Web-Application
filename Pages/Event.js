import React, { useState, useEffect } from "react";
import { api } from "@/api/localDataService";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import EventCard from "../Components/shared/EventCard";
import { Calendar, Filter, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { isToday, isTomorrow, isThisWeek, isFuture, isPast } from "date-fns";
import { cn } from "@/lib/utils";

export default function Events() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [activeTimeFilter, setActiveTimeFilter] = useState("upcoming");

  const urlParams = new URLSearchParams(window.location.search);
  const highlightId = urlParams.get("highlight");

  const { data: events = [], isLoading } = useQuery({
    queryKey: ["events"],
    queryFn: () => api.entities.Event.list("-start_time"),
  });

  const { data: locations = [] } = useQuery({
    queryKey: ["locations"],
    queryFn: () => api.entities.Location.list(),
  });

  const getLocation = (id) => locations.find((l) => l.id === id);

  const categories = [
    { id: "all", label: "All Events" },
    { id: "families", label: "Families" },
    { id: "schools", label: "Schools" },
    { id: "entrepreneurs", label: "Entrepreneurs" },
  ];

  const timeFilters = [
    { id: "upcoming", label: "Upcoming" },
    { id: "today", label: "Today" },
    { id: "this_week", label: "This Week" },
    { id: "past", label: "Past" },
  ];

  const filteredEvents = events
    .filter((event) => {
      const matchesSearch =
        event.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.description?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory =
        activeCategory === "all" || event.category === activeCategory;

      const eventDate = new Date(event.start_time);
      let matchesTime = true;
      if (activeTimeFilter === "today") {
        matchesTime = isToday(eventDate);
      } else if (activeTimeFilter === "this_week") {
        matchesTime = isThisWeek(eventDate) && isFuture(eventDate);
      } else if (activeTimeFilter === "upcoming") {
        matchesTime = isFuture(eventDate) || isToday(eventDate);
      } else if (activeTimeFilter === "past") {
        matchesTime = isPast(eventDate) && !isToday(eventDate);
      }

      return matchesSearch && matchesCategory && matchesTime;
    })
    .sort((a, b) => {
      if (activeTimeFilter === "past") {
        return new Date(b.start_time) - new Date(a.start_time);
      }
      return new Date(a.start_time) - new Date(b.start_time);
    });

  // Find ongoing/next events
  const now = new Date();
  const ongoingEvents = events.filter((e) => {
    const start = new Date(e.start_time);
    const end = e.end_time ? new Date(e.end_time) : null;
    return start <= now && (!end || end >= now);
  });

  const nextEvent = events
    .filter((e) => new Date(e.start_time) > now)
    .sort((a, b) => new Date(a.start_time) - new Date(b.start_time))[0];

  useEffect(() => {
    if (highlightId) {
      const element = document.getElementById(`event-${highlightId}`);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  }, [highlightId, events]);

  return (
    <div className="pb-24 lg:pb-8">
      {/* Header */}
      <div className="bg-white border-b border-stone-200 sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-stone-900">Events</h1>
              <p className="text-sm text-stone-500">
                Discover what's happening at Gracia
              </p>
            </div>
          </div>

          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            <Input
              placeholder="Search events..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-stone-50 border-stone-200"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                <X className="w-4 h-4 text-stone-400" />
              </button>
            )}
          </div>

          {/* Time Filters */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide mb-3">
            {timeFilters.map((filter) => (
              <Button
                key={filter.id}
                variant={activeTimeFilter === filter.id ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveTimeFilter(filter.id)}
                className={cn(
                  "whitespace-nowrap",
                  activeTimeFilter === filter.id &&
                    "bg-[#2D5016] hover:bg-[#4A7C23]"
                )}
              >
                {filter.label}
              </Button>
            ))}
          </div>

          {/* Category Filters */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {categories.map((category) => (
              <Badge
                key={category.id}
                variant={activeCategory === category.id ? "default" : "outline"}
                className={cn(
                  "cursor-pointer whitespace-nowrap",
                  activeCategory === category.id
                    ? "bg-stone-900 hover:bg-stone-800"
                    : "hover:bg-stone-100"
                )}
                onClick={() => setActiveCategory(category.id)}
              >
                {category.label}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Ongoing/Next Event Highlight */}
        {(ongoingEvents.length > 0 || nextEvent) &&
          activeTimeFilter === "upcoming" && (
            <div className="mb-6">
              {ongoingEvents.length > 0 && (
                <div className="mb-4">
                  <h2 className="text-sm font-semibold text-green-600 uppercase tracking-wide mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    Happening Now
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {ongoingEvents.map((event) => (
                      <EventCard
                        key={event.id}
                        event={event}
                        location={getLocation(event.location_id)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {nextEvent && ongoingEvents.length === 0 && (
                <div className="mb-4">
                  <h2 className="text-sm font-semibold text-[#2D5016] uppercase tracking-wide mb-3">
                    Up Next
                  </h2>
                  <EventCard
                    event={nextEvent}
                    location={getLocation(nextEvent.location_id)}
                  />
                </div>
              )}
            </div>
          )}

        {/* Events Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-72 rounded-2xl" />
            ))}
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-full bg-stone-100 flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-8 h-8 text-stone-400" />
            </div>
            <h3 className="font-semibold text-stone-900 mb-2">
              No events found
            </h3>
            <p className="text-stone-500 text-sm">
              Try adjusting your filters or search term
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence>
              {filteredEvents.map((event, index) => (
                <motion.div
                  key={event.id}
                  id={`event-${event.id}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.05 }}
                  className={cn(
                    highlightId === event.id &&
                      "ring-2 ring-[#2D5016] ring-offset-2 rounded-2xl"
                  )}
                >
                  <EventCard
                    event={event}
                    location={getLocation(event.location_id)}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}