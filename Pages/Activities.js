import React, { useState } from "react";
import { api } from "@/api/localDataService";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import ActivityCard from "../Components/shared/ActivityCard";
import { Leaf, Search, X, TreePine, Baby, Bird, Wrench, Compass } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export default function Activities() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeType, setActiveType] = useState("all");

  const { data: activities = [], isLoading } = useQuery({
    queryKey: ["activities"],
    queryFn: () => api.entities.Activity.list(),
  });

  const { data: locations = [] } = useQuery({
    queryKey: ["locations"],
    queryFn: () => api.entities.Location.list(),
  });

  const getLocation = (id) => locations.find((l) => l.id === id);

  const types = [
    { id: "all", label: "All Activities", icon: Leaf },
    { id: "farm_walk", label: "Farm Walks", icon: TreePine },
    { id: "kids_zone", label: "Kids Zone", icon: Baby },
    { id: "feeding", label: "Feeding Sessions", icon: Bird },
    { id: "workshop", label: "Workshops", icon: Wrench },
    { id: "exploration", label: "Exploration", icon: Compass },
  ];

  const filteredActivities = activities.filter((activity) => {
    const matchesSearch =
      activity.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activity.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = activeType === "all" || activity.type === activeType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="pb-24 lg:pb-8">
      {/* Header */}
      <div className="bg-white border-b border-stone-200 sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-lime-100 flex items-center justify-center">
              <Leaf className="w-5 h-5 text-lime-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-stone-900">Activities</h1>
              <p className="text-sm text-stone-500">
                Explore farm experiences and fun zones
              </p>
            </div>
          </div>

          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            <Input
              placeholder="Search activities..."
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

          {/* Type Filters */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {types.map((type) => {
              const Icon = type.icon;
              return (
                <Badge
                  key={type.id}
                  variant={activeType === type.id ? "default" : "outline"}
                  className={cn(
                    "cursor-pointer whitespace-nowrap flex items-center gap-1.5",
                    activeType === type.id
                      ? "bg-stone-900 hover:bg-stone-800"
                      : "hover:bg-stone-100"
                  )}
                  onClick={() => setActiveType(type.id)}
                >
                  <Icon className="w-3 h-3" />
                  {type.label}
                </Badge>
              );
            })}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Activities Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-72 rounded-2xl" />
            ))}
          </div>
        ) : filteredActivities.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-full bg-stone-100 flex items-center justify-center mx-auto mb-4">
              <Leaf className="w-8 h-8 text-stone-400" />
            </div>
            <h3 className="font-semibold text-stone-900 mb-2">
              No activities found
            </h3>
            <p className="text-stone-500 text-sm">
              Try adjusting your filters or search term
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence>
              {filteredActivities.map((activity, index) => (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <ActivityCard
                    activity={activity}
                    location={getLocation(activity.location_id)}
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