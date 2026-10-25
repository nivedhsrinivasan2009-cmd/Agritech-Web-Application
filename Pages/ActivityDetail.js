import React from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { api } from "@/api/localDataService";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Leaf,
  Clock,
  MapPin,
  ArrowLeft,
  Share2,
  Navigation,
  TreePine,
  Baby,
  Bird,
  Wrench,
  Compass,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { createPageUrl } from "../utils";
import { cn } from "@/lib/utils";

export default function ActivityDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: activity, isLoading } = useQuery({
    queryKey: ["activity", id],
    queryFn: () => api.entities.Activity.get(id),
  });

  const { data: locations = [] } = useQuery({
    queryKey: ["locations"],
    queryFn: () => api.entities.Location.list(),
  });

  const location = locations.find((l) => l.id === activity?.location_id);

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: activity.name,
          text: activity.description,
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

  const typeConfig = {
    farm_walk: { icon: TreePine, color: "bg-green-100 text-green-700", label: "Farm Walk" },
    feeding: { icon: Bird, color: "bg-amber-100 text-amber-700", label: "Feeding Session" },
    kids_zone: { icon: Baby, color: "bg-pink-100 text-pink-700", label: "Kids Zone" },
    workshop: { icon: Wrench, color: "bg-blue-100 text-blue-700", label: "Workshop" },
    exploration: { icon: Compass, color: "bg-purple-100 text-purple-700", label: "Exploration" },
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

  if (!activity) {
    return (
      <div className="pb-24 lg:pb-8">
        <div className="max-w-4xl mx-auto px-4 py-16 text-center">
          <h2 className="text-xl font-bold mb-2">Activity not found</h2>
          <p className="text-stone-500 mb-6">This activity doesn't exist or has been removed.</p>
          <Link to={createPageUrl("Activities")}>
            <Button>View All Activities</Button>
          </Link>
        </div>
      </div>
    );
  }

  const config = typeConfig[activity.type] || typeConfig.exploration;
  const TypeIcon = config.icon;

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
            aria-label="Share activity"
          >
            <Share2 className="w-5 h-5 text-stone-600" />
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Hero Image */}
        {activity.image_url && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative h-64 md:h-80 rounded-2xl overflow-hidden mb-6"
          >
            <img
              src={activity.image_url}
              alt={activity.name}
              className="w-full h-full object-cover"
            />
          </motion.div>
        )}

        {/* Activity Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          {/* Type Badge */}
          <div className="flex items-center gap-3 mb-4">
            <Badge className={cn("capitalize", config.color)}>
              <TypeIcon className="w-3 h-3 mr-1" />
              {config.label}
            </Badge>
          </div>

          {/* Title */}
          <h1 className="text-2xl md:text-3xl font-bold text-stone-900 mb-4">
            {activity.name}
          </h1>

          {/* Time & Location */}
          <div className="flex flex-wrap gap-4 mb-6">
            {activity.typical_time && (
              <div className="flex items-center gap-2 text-stone-600">
                <Clock className="w-5 h-5" />
                <span>{activity.typical_time}</span>
              </div>
            )}
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
              {activity.description}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            {activity.location_id && (
              <Link to={createPageUrl(`MapZones?zone=${activity.location_id}`)} className="flex-1">
                <Button size="lg" className="w-full bg-[#2D5016] hover:bg-[#4A7C23]">
                  <Navigation className="w-5 h-5 mr-2" />
                  Navigate to Activity
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

        {/* Tips Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-6 p-6 bg-lime-50 border border-lime-200 rounded-2xl"
        >
          <h2 className="font-semibold text-stone-900 mb-3 flex items-center gap-2">
            <Leaf className="w-5 h-5 text-lime-600" />
            Tips for this Activity
          </h2>
          <ul className="space-y-2 text-stone-600">
            <li className="flex items-start gap-2">
              <span className="text-lime-600">•</span>
              Wear comfortable shoes suitable for walking
            </li>
            <li className="flex items-start gap-2">
              <span className="text-lime-600">•</span>
              Bring sunscreen and a hat on sunny days
            </li>
            <li className="flex items-start gap-2">
              <span className="text-lime-600">•</span>
              Children should be supervised at all times
            </li>
          </ul>
        </motion.div>
      </div>
    </div>
  );
}
