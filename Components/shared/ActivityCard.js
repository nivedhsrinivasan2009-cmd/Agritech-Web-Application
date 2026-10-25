import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../../utils";
import { Clock, MapPin, TreePine, Baby, Bird, Wrench, Compass, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ActivityCard({ activity, location }) {
  const typeIcons = {
    farm_walk: TreePine,
    kids_zone: Baby,
    feeding: Bird,
    workshop: Wrench,
    exploration: Compass,
  };

  const typeColors = {
    farm_walk: "from-green-500 to-emerald-600",
    kids_zone: "from-pink-500 to-rose-600",
    feeding: "from-orange-500 to-amber-600",
    workshop: "from-blue-500 to-indigo-600",
    exploration: "from-purple-500 to-violet-600",
  };

  const Icon = typeIcons[activity.type] || Compass;
  const colorGradient = typeColors[activity.type] || "from-stone-500 to-stone-600";

  return (
    <Link to={`/activities/${activity.id}`} className="block bg-white rounded-2xl overflow-hidden border border-stone-100 hover:shadow-lg transition-all duration-300 group">
      {/* Image or Gradient Header */}
      <div className="relative h-36 overflow-hidden">
        {activity.image_url ? (
          <>
            <img 
              src={activity.image_url} 
              alt={activity.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          </>
        ) : (
          <div className={`w-full h-full bg-gradient-to-br ${colorGradient}`} />
        )}
        
        <div className="absolute bottom-3 left-3">
          <div className="w-12 h-12 rounded-xl bg-white/90 backdrop-blur-sm flex items-center justify-center">
            <Icon className="w-6 h-6 text-stone-700" />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        <span className="inline-block px-2.5 py-1 bg-stone-100 rounded-full text-xs font-medium text-stone-600 capitalize mb-3">
          {activity.type?.replace(/_/g, " ")}
        </span>
        
        <h3 className="text-lg font-semibold text-stone-900 mb-2">{activity.name}</h3>
        
        {activity.description && (
          <p className="text-sm text-stone-500 mb-4 line-clamp-2">{activity.description}</p>
        )}
        
        <div className="flex flex-wrap items-center gap-3 text-sm text-stone-500 mb-4">
          {activity.typical_time && (
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              <span>{activity.typical_time}</span>
            </div>
          )}
          {location && (
            <div className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4" />
              <span>{location.zone_name}</span>
            </div>
          )}
        </div>
        
        {activity.location_id && (
          <Link
            to={createPageUrl(`MapZones?zone=${activity.location_id}`)}
            onClick={(e) => e.stopPropagation()}
          >
            <Button variant="outline" size="sm" className="w-full text-[#2D5016] border-[#2D5016]/30 hover:bg-[#2D5016]/5">
              <Navigation className="w-4 h-4 mr-2" />
              View on Map
            </Button>
          </Link>
        )}
      </div>
    </Link>
  );
}