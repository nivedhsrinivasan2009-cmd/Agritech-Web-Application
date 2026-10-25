import React, { useState, useEffect } from "react";
import { api } from "@/api/localDataService";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Map, X, Calendar, Leaf, Store, MapPin, TreePine, PawPrint, GraduationCap, Baby, ShoppingCart, Car, DoorOpen, AlertTriangle, Navigation, Locate, MapPinOff, Footprints, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { cn } from "@/lib/utils";
import { format, isToday, isFuture } from "date-fns";
import ZoneClosureBanner from "../Components/shared/ZoneClosureBanner";
import useGeolocation from "@/hooks/useGeolocation";
import GpsTrackOverlay from "../Components/map/GpsTrackOverlay";
import SignalProcessingPanel from "../Components/map/SignalProcessingPanel";

export default function MapZones() {
  const [selectedZone, setSelectedZone] = useState(null);
  const [showLocationInfo, setShowLocationInfo] = useState(false);
  const [showSignalProcessing, setShowSignalProcessing] = useState(false);

  const urlParams = new URLSearchParams(window.location.search);
  const zoneId = urlParams.get("zone");

  const { data: locations = [], isLoading: locationsLoading } = useQuery({
    queryKey: ["locations"],
    queryFn: () => api.entities.Location.list(),
  });

  // GPS location tracking with signal processing (Kalman filter, outlier rejection, zone detection)
  const {
    loading: geoLoading,
    error: geoError,
    position,
    mapPosition,
    isWithinVenue,
    accuracy,
    rawAccuracy,
    speed,
    currentZone,
    tracks,
    stats,
    calibration,
    demoMode,
    demoProgress,
    startDemoWalk,
    stopDemoWalk,
    getDistanceToZone,
  } = useGeolocation({ watch: true, zones: locations });
  const signalPanelVisible = demoMode || showSignalProcessing;

  const { data: events = [] } = useQuery({
    queryKey: ["events"],
    queryFn: () => api.entities.Event.list(),
  });

  const { data: activities = [] } = useQuery({
    queryKey: ["activities"],
    queryFn: () => api.entities.Activity.list(),
  });

  const { data: shops = [] } = useQuery({
    queryKey: ["shops"],
    queryFn: () => api.entities.Shop.list(),
  });

  useEffect(() => {
    if (zoneId && locations.length > 0) {
      const zone = locations.find((l) => l.id === zoneId);
      if (zone) setSelectedZone(zone);
    }
  }, [zoneId, locations]);

  const zoneIcons = {
    greenhouse: TreePine,
    animal_yard: PawPrint,
    training_centre: GraduationCap,
    kids_zone: Baby,
    shops: ShoppingCart,
    entrance: DoorOpen,
    parking: Car,
  };

  const zoneColors = {
    greenhouse: { bg: "bg-green-500", text: "text-green-700", light: "bg-green-100" },
    animal_yard: { bg: "bg-amber-500", text: "text-amber-700", light: "bg-amber-100" },
    training_centre: { bg: "bg-blue-500", text: "text-blue-700", light: "bg-blue-100" },
    kids_zone: { bg: "bg-pink-500", text: "text-pink-700", light: "bg-pink-100" },
    shops: { bg: "bg-purple-500", text: "text-purple-700", light: "bg-purple-100" },
    entrance: { bg: "bg-stone-500", text: "text-stone-700", light: "bg-stone-100" },
    parking: { bg: "bg-slate-500", text: "text-slate-700", light: "bg-slate-100" },
  };

  // Closure severity colors for markers
  const closureSeverityColors = {
    critical: "bg-red-600",
    high: "bg-red-500",
    medium: "bg-orange-500",
    low: "bg-yellow-500",
  };

  // Get marker background color (override for closed zones)
  const getMarkerBgColor = (location) => {
    if (location.is_closed && location.closure_severity) {
      return closureSeverityColors[location.closure_severity] || closureSeverityColors.medium;
    }
    const colors = zoneColors[location.zone_type] || zoneColors.entrance;
    return colors.bg;
  };

  const getZoneEvents = (zoneId) => {
    return events.filter(
      (e) => e.location_id === zoneId && (isToday(new Date(e.start_time)) || isFuture(new Date(e.start_time)))
    ).slice(0, 3);
  };

  const getZoneActivities = (zoneId) => {
    return activities.filter((a) => a.location_id === zoneId).slice(0, 3);
  };

  const getZoneShops = (zoneId) => {
    return shops.filter((s) => s.location_id === zoneId).slice(0, 3);
  };

  return (
    <div className="pb-24 lg:pb-8 min-h-screen">
      {/* Header */}
      <div className="bg-white border-b border-stone-200 sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                <Map className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-stone-900">Map & Zones</h1>
                <p className="text-sm text-stone-500">
                  Explore the venue and navigate to areas
                </p>
              </div>
            </div>

            {/* Location Status Button */}
            <button
              onClick={() => setShowLocationInfo(!showLocationInfo)}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all",
                geoLoading && "bg-stone-100 text-stone-500",
                geoError && "bg-red-50 text-red-600",
                !geoLoading && !geoError && isWithinVenue && "bg-blue-50 text-blue-600",
                !geoLoading && !geoError && !isWithinVenue && position && "bg-amber-50 text-amber-600",
                demoMode && "bg-purple-50 text-purple-600"
              )}
            >
              {geoLoading ? (
                <>
                  <Locate className="w-4 h-4 animate-pulse" />
                  <span className="hidden sm:inline">Locating...</span>
                </>
              ) : geoError ? (
                <>
                  <MapPinOff className="w-4 h-4" />
                  <span className="hidden sm:inline">Location off</span>
                </>
              ) : demoMode ? (
                <>
                  <Navigation className="w-4 h-4" />
                  <span className="hidden sm:inline">Demo mode</span>
                </>
              ) : isWithinVenue ? (
                <>
                  <Navigation className="w-4 h-4" />
                  <span className="hidden sm:inline">You're here</span>
                </>
              ) : (
                <>
                  <MapPinOff className="w-4 h-4" />
                  <span className="hidden sm:inline">Outside venue</span>
                </>
              )}
            </button>
          </div>

          {/* Location Info Panel */}
          <AnimatePresence>
            {showLocationInfo && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="mt-3 p-3 bg-stone-50 rounded-lg">
                  {geoLoading ? (
                    <p className="text-sm text-stone-500">Getting your location...</p>
                  ) : geoError ? (
                    <div>
                      <p className="text-sm text-red-600 font-medium">{geoError}</p>
                      <p className="text-xs text-stone-500 mt-1">
                        Enable location in your browser settings to see your position on the map.
                      </p>
                      <Button
                        size="sm"
                        variant="outline"
                        className="mt-2"
                        onClick={() => startDemoWalk()}
                      >
                        Simulate GPS walk
                      </Button>
                    </div>
                  ) : demoMode ? (
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-purple-600 font-medium">Demo Mode Active</p>
                        <p className="text-xs text-stone-500">
                          Simulated GPS walk{currentZone ? ` · now in ${currentZone.name}` : ""}
                        </p>
                      </div>
                      <Button size="sm" variant="outline" onClick={stopDemoWalk}>
                        Exit Demo
                      </Button>
                    </div>
                  ) : isWithinVenue ? (
                    <div>
                      <p className="text-sm text-blue-600 font-medium">
                        {currentZone ? `You're at ${currentZone.name}` : "You're inside the venue!"}
                      </p>
                      <p className="text-xs text-stone-500 mt-1">
                        Your filtered location is shown on the map. Accuracy: ±{Math.round(accuracy || 0)}m
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-sm text-amber-600 font-medium">You're outside the venue</p>
                      <p className="text-xs text-stone-500 mt-1">
                        Your position will appear on the map when you arrive.
                      </p>
                      <Button
                        size="sm"
                        variant="outline"
                        className="mt-2"
                        onClick={() => startDemoWalk()}
                      >
                        Simulate GPS walk
                      </Button>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Interactive Map Area */}
        <div className="relative bg-gradient-to-br from-green-100 via-lime-50 to-emerald-100 rounded-2xl overflow-hidden mb-6 aspect-[4/3] md:aspect-[16/9]">
          {/* Stylized Map Background */}
          <div className="absolute inset-0">
            <svg className="w-full h-full opacity-20" viewBox="0 0 100 100" preserveAspectRatio="none">
              <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                <path d="M 10 0 L 0 0 0 10" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-green-600" />
              </pattern>
              <rect width="100" height="100" fill="url(#grid)" />
            </svg>
          </div>

          {/* Map Title */}
          <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg px-4 py-2 shadow-sm">
            <h3 className="font-semibold text-stone-900">Gracia Visitor Centre</h3>
            <p className="text-xs text-stone-500">Tap a zone to explore</p>
          </div>

          {/* Zone Markers */}
          {locationsLoading ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <Skeleton className="w-16 h-16 rounded-full" />
            </div>
          ) : (
            locations.map((location, index) => {
              const Icon = zoneIcons[location.zone_type] || MapPin;
              const colors = zoneColors[location.zone_type] || zoneColors.entrance;
              const x = location.map_x || (15 + (index % 4) * 25);
              const y = location.map_y || (20 + Math.floor(index / 4) * 35);
              const isClosed = location.is_closed;
              const isCritical = location.closure_severity === "critical";

              return (
                <motion.button
                  key={location.id}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => setSelectedZone(location)}
                  className={cn(
                    "absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-300 group",
                    selectedZone?.id === location.id && "z-10",
                    isCritical && "animate-pulse"
                  )}
                  style={{ left: `${x}%`, top: `${y}%` }}
                >
                  <div className={cn(
                    "w-12 h-12 md:w-14 md:h-14 rounded-xl flex items-center justify-center shadow-lg transition-transform group-hover:scale-110 relative",
                    getMarkerBgColor(location),
                    selectedZone?.id === location.id && "ring-4 ring-white scale-110"
                  )}>
                    <Icon className="w-6 h-6 md:w-7 md:h-7 text-white" />
                    {/* Closure warning overlay */}
                    {isClosed && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-white rounded-full flex items-center justify-center shadow-md">
                        <AlertTriangle className="w-3 h-3 text-red-500" />
                      </div>
                    )}
                  </div>
                  <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-white rounded-lg px-2 py-1 shadow-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-xs font-medium text-stone-700">
                      {location.zone_name}
                      {isClosed && <span className="text-red-500 ml-1">(Closed)</span>}
                    </span>
                  </div>
                </motion.button>
              );
            })
          )}

          {/* GPS tracks (raw vs filtered) and position uncertainty */}
          <GpsTrackOverlay
            tracks={tracks}
            mapPosition={mapPosition}
            sigma={accuracy}
            metersPerMapUnit={calibration.metersPerMapUnit}
            showTracks={signalPanelVisible}
          />

          {/* "You are here" marker (Kalman-filtered position) */}
          {mapPosition && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none"
              style={{
                left: `${mapPosition.x}%`,
                top: `${mapPosition.y}%`,
              }}
            >
              {/* Accuracy circle */}
              <div className="absolute inset-0 -m-4 w-12 h-12 bg-blue-500/20 rounded-full animate-ping" />
              <div className="absolute inset-0 -m-3 w-10 h-10 bg-blue-500/30 rounded-full" />
              {/* Center dot */}
              <div className="relative w-4 h-4 bg-blue-600 rounded-full border-2 border-white shadow-lg">
                <div className="absolute inset-0 bg-blue-400 rounded-full animate-pulse" />
              </div>
              {/* Label */}
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-blue-600 text-white rounded-lg px-2 py-1 shadow-md whitespace-nowrap">
                <span className="text-xs font-medium">You are here</span>
              </div>
            </motion.div>
          )}
        </div>

        {/* GPS signal processing: live stats, or a simulated walk for demos/indoors */}
        {signalPanelVisible ? (
          <SignalProcessingPanel
            demoMode={demoMode}
            demoProgress={demoProgress}
            stats={stats}
            accuracy={accuracy}
            rawAccuracy={rawAccuracy}
            speed={speed}
            currentZone={currentZone}
            calibration={calibration}
            onStartDemo={startDemoWalk}
            onStopDemo={() => {
              stopDemoWalk();
              setShowSignalProcessing(false);
            }}
          />
        ) : (
          <div className="flex justify-end -mt-4 mb-4">
            <button
              onClick={() => setShowSignalProcessing(true)}
              className="flex items-center gap-1.5 text-xs text-stone-500 hover:text-[#2D5016] transition-colors"
            >
              <Activity className="w-3.5 h-3.5" />
              Show GPS signal processing
            </button>
          </div>
        )}

        {/* Zone List */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {locations.map((location) => {
            const Icon = zoneIcons[location.zone_type] || MapPin;
            const colors = zoneColors[location.zone_type] || zoneColors.entrance;
            const zoneEvents = getZoneEvents(location.id);
            const zoneActivities = getZoneActivities(location.id);
            const isClosed = location.is_closed;
            const distance = mapPosition ? getDistanceToZone(location) : null;

            return (
              <button
                key={location.id}
                onClick={() => setSelectedZone(location)}
                className={cn(
                  "bg-white rounded-xl p-4 border border-stone-100 hover:shadow-md transition-all text-left relative",
                  selectedZone?.id === location.id && "ring-2 ring-[#2D5016] border-transparent",
                  isClosed && "border-orange-200"
                )}
              >
                {/* Closure badge */}
                {isClosed && (
                  <Badge
                    className={cn(
                      "absolute top-2 right-2 text-xs",
                      location.closure_severity === "critical" && "bg-red-500 animate-pulse",
                      location.closure_severity === "high" && "bg-red-500",
                      location.closure_severity === "medium" && "bg-orange-500",
                      location.closure_severity === "low" && "bg-yellow-500 text-yellow-900"
                    )}
                  >
                    {location.closure_severity === "critical" ? "!" : "Closed"}
                  </Badge>
                )}
                <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center mb-3", colors.light)}>
                  <Icon className={cn("w-5 h-5", colors.text)} />
                </div>
                <h4 className="font-medium text-stone-900 text-sm mb-1">{location.zone_name}</h4>

                {/* Distance info */}
                {distance && (
                  <div className="flex items-center gap-1 text-xs text-blue-600 mb-2">
                    <Footprints className="w-3 h-3" />
                    <span>{distance.walkTime}</span>
                  </div>
                )}

                <div className="flex flex-wrap gap-1">
                  {zoneEvents.length > 0 && (
                    <Badge variant="secondary" className="text-xs px-1.5">{zoneEvents.length} events</Badge>
                  )}
                  {zoneActivities.length > 0 && (
                    <Badge variant="secondary" className="text-xs px-1.5">{zoneActivities.length} activities</Badge>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Zone Detail Modal */}
      <AnimatePresence>
        {selectedZone && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center justify-center p-4"
            onClick={() => setSelectedZone(null)}
          >
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-t-2xl md:rounded-2xl w-full max-w-lg max-h-[80vh] overflow-hidden"
            >
              {/* Header */}
              <div className="sticky top-0 bg-white border-b border-stone-100 p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {(() => {
                    const Icon = zoneIcons[selectedZone.zone_type] || MapPin;
                    const colors = zoneColors[selectedZone.zone_type] || zoneColors.entrance;
                    return (
                      <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", colors.light)}>
                        <Icon className={cn("w-5 h-5", colors.text)} />
                      </div>
                    );
                  })()}
                  <div>
                    <h2 className="font-semibold text-stone-900">{selectedZone.zone_name}</h2>
                    <span className="text-xs text-stone-500 capitalize">{selectedZone.zone_type?.replace(/_/g, " ")}</span>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setSelectedZone(null)}>
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {/* Content */}
              <div className="p-4 overflow-y-auto max-h-[60vh]">
                {/* Distance info */}
                {(() => {
                  const distance = mapPosition ? getDistanceToZone(selectedZone) : null;
                  if (!distance) return null;
                  return (
                    <div className="mb-4 p-3 bg-blue-50 rounded-lg flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <Navigation className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-blue-700">{distance.walkTime}</p>
                        <p className="text-xs text-blue-600">{distance.formatted}</p>
                      </div>
                    </div>
                  );
                })()}

                {/* Safety Banner for closed zones */}
                {selectedZone.is_closed && (
                  <div className="mb-4">
                    <ZoneClosureBanner
                      severity={selectedZone.closure_severity}
                      reason={selectedZone.closure_reason}
                      endTime={selectedZone.closure_end_time}
                    />
                  </div>
                )}

                {selectedZone.description && (
                  <p className="text-stone-600 mb-6">{selectedZone.description}</p>
                )}

                {/* Events in Zone */}
                {getZoneEvents(selectedZone.id).length > 0 && (
                  <div className="mb-6">
                    <h3 className="font-medium text-stone-900 mb-3 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-[#2D5016]" />
                      Upcoming Events
                    </h3>
                    <div className="space-y-2">
                      {getZoneEvents(selectedZone.id).map((event) => (
                        <Link
                          key={event.id}
                          to={createPageUrl(`Events?highlight=${event.id}`)}
                          className="block p-3 bg-stone-50 rounded-lg hover:bg-stone-100 transition-colors"
                        >
                          <h4 className="font-medium text-sm text-stone-900">{event.title}</h4>
                          <p className="text-xs text-stone-500 mt-1">
                            {format(new Date(event.start_time), "MMM d, h:mm a")}
                          </p>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* Activities in Zone */}
                {getZoneActivities(selectedZone.id).length > 0 && (
                  <div className="mb-6">
                    <h3 className="font-medium text-stone-900 mb-3 flex items-center gap-2">
                      <Leaf className="w-4 h-4 text-lime-600" />
                      Activities
                    </h3>
                    <div className="space-y-2">
                      {getZoneActivities(selectedZone.id).map((activity) => (
                        <div
                          key={activity.id}
                          className="p-3 bg-stone-50 rounded-lg"
                        >
                          <h4 className="font-medium text-sm text-stone-900">{activity.name}</h4>
                          {activity.typical_time && (
                            <p className="text-xs text-stone-500 mt-1">{activity.typical_time}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Shops in Zone */}
                {getZoneShops(selectedZone.id).length > 0 && (
                  <div>
                    <h3 className="font-medium text-stone-900 mb-3 flex items-center gap-2">
                      <Store className="w-4 h-4 text-amber-600" />
                      Shops
                    </h3>
                    <div className="space-y-2">
                      {getZoneShops(selectedZone.id).map((shop) => (
                        <Link
                          key={shop.id}
                          to={createPageUrl("Shops")}
                          className="block p-3 bg-stone-50 rounded-lg hover:bg-stone-100 transition-colors"
                        >
                          <h4 className="font-medium text-sm text-stone-900">{shop.name}</h4>
                          {shop.opening_hours && (
                            <p className="text-xs text-stone-500 mt-1">{shop.opening_hours}</p>
                          )}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}