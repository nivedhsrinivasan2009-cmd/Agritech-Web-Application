import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, Megaphone, Info, X, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const typeConfig = {
  info: {
    icon: Info,
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
    iconColor: "text-blue-600",
    textColor: "text-blue-800",
  },
  promotion: {
    icon: Megaphone,
    bgColor: "bg-amber-50",
    borderColor: "border-amber-200",
    iconColor: "text-amber-600",
    textColor: "text-amber-800",
  },
  alert: {
    icon: Bell,
    bgColor: "bg-red-50",
    borderColor: "border-red-200",
    iconColor: "text-red-600",
    textColor: "text-red-800",
  },
};

export default function Announcements({ announcements = [], onDismiss }) {
  // Filter to only show active announcements
  const activeAnnouncements = announcements.filter((ann) => {
    if (!ann.is_active) return false;
    const now = new Date();
    // A missing start means "already started"; a missing end means "no end date"
    if (ann.start_date && now < new Date(ann.start_date)) return false;
    if (ann.end_date && now > new Date(ann.end_date)) return false;
    return true;
  });

  // Sort by priority (high first)
  const sortedAnnouncements = activeAnnouncements.sort((a, b) => {
    if (a.priority === "high" && b.priority !== "high") return -1;
    if (a.priority !== "high" && b.priority === "high") return 1;
    return 0;
  });

  if (sortedAnnouncements.length === 0) return null;

  return (
    <div className="space-y-3">
      <AnimatePresence>
        {sortedAnnouncements.map((announcement, index) => {
          const config = typeConfig[announcement.type] || typeConfig.info;
          const Icon = config.icon;

          return (
            <motion.div
              key={announcement.id}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ delay: index * 0.1 }}
              className={cn(
                "relative rounded-xl border p-4",
                config.bgColor,
                config.borderColor,
                announcement.priority === "high" && "ring-2 ring-offset-2 ring-amber-300"
              )}
            >
              <div className="flex gap-3">
                <div
                  className={cn(
                    "flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center",
                    config.bgColor
                  )}
                >
                  <Icon className={cn("w-5 h-5", config.iconColor)} />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className={cn("font-semibold text-sm mb-1", config.textColor)}>
                    {announcement.title}
                  </h4>
                  <p className="text-sm text-stone-600 line-clamp-2">
                    {announcement.message}
                  </p>
                </div>
                {onDismiss && (
                  <button
                    onClick={() => onDismiss(announcement.id)}
                    className="flex-shrink-0 p-1 hover:bg-white/50 rounded-lg transition-colors"
                    aria-label="Dismiss announcement"
                  >
                    <X className="w-4 h-4 text-stone-400" />
                  </button>
                )}
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
