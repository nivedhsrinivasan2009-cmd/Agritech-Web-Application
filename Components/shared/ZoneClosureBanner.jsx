import React from "react";
import { AlertTriangle, Clock, ShieldAlert, Info } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

const severityConfig = {
  critical: {
    icon: ShieldAlert,
    bgColor: "bg-red-100",
    borderColor: "border-red-300",
    iconColor: "text-red-600",
    textColor: "text-red-900",
    title: "Safety Alert - Do Not Enter",
  },
  high: {
    icon: AlertTriangle,
    bgColor: "bg-red-50",
    borderColor: "border-red-200",
    iconColor: "text-red-500",
    textColor: "text-red-800",
    title: "Zone Closed",
  },
  medium: {
    icon: AlertTriangle,
    bgColor: "bg-orange-50",
    borderColor: "border-orange-200",
    iconColor: "text-orange-500",
    textColor: "text-orange-800",
    title: "Temporarily Unavailable",
  },
  low: {
    icon: Info,
    bgColor: "bg-yellow-50",
    borderColor: "border-yellow-200",
    iconColor: "text-yellow-600",
    textColor: "text-yellow-800",
    title: "Limited Access",
  },
};

export default function ZoneClosureBanner({
  severity = "medium",
  reason,
  endTime,
  zoneName,
  compact = false
}) {
  const config = severityConfig[severity] || severityConfig.medium;
  const Icon = config.icon;

  if (compact) {
    return (
      <div className={cn(
        "flex items-center gap-2 px-3 py-2 rounded-lg",
        config.bgColor, config.borderColor, "border"
      )}>
        <Icon className={cn("w-4 h-4", config.iconColor)} />
        <span className={cn("text-sm font-medium", config.textColor)}>
          {config.title}
        </span>
      </div>
    );
  }

  return (
    <div className={cn(
      "p-4 rounded-lg border",
      config.bgColor, config.borderColor
    )}>
      <div className="flex items-start gap-3">
        <Icon className={cn("w-5 h-5 flex-shrink-0 mt-0.5", config.iconColor)} />
        <div className="flex-1">
          <h4 className={cn("font-semibold", config.textColor)}>
            {config.title}
          </h4>
          {zoneName && (
            <p className={cn("text-sm font-medium mt-0.5", config.textColor)}>
              {zoneName}
            </p>
          )}
          {reason && (
            <p className="text-sm text-stone-600 mt-1">{reason}</p>
          )}
          {endTime && (
            <p className="text-xs text-stone-500 mt-2 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Expected to reopen {formatDistanceToNow(new Date(endTime), { addSuffix: true })}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
