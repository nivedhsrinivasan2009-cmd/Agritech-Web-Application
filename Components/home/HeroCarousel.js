import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../../utils";
import { ChevronLeft, ChevronRight, Calendar, MapPin } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export default function HeroCarousel({ events }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  const featuredEvents = events?.filter(e => e.is_featured) || [];
  const displayEvents = featuredEvents.length > 0 ? featuredEvents : events?.slice(0, 5) || [];

  useEffect(() => {
    if (!isAutoPlaying || displayEvents.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % displayEvents.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [isAutoPlaying, displayEvents.length]);

  const goTo = (index) => {
    setCurrentIndex(index);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  const next = () => goTo((currentIndex + 1) % displayEvents.length);
  const prev = () => goTo((currentIndex - 1 + displayEvents.length) % displayEvents.length);

  if (displayEvents.length === 0) {
    return (
      <div className="relative h-64 md:h-80 lg:h-96 bg-gradient-to-br from-[#2D5016] to-[#4A7C23] rounded-2xl overflow-hidden flex items-center justify-center">
        <div className="text-center text-white p-6">
          <h2 className="text-2xl font-bold mb-2">Welcome to Gracia</h2>
          <p className="opacity-90">Discover events, activities, and more</p>
        </div>
      </div>
    );
  }

  const currentEvent = displayEvents[currentIndex];

  return (
    <div 
      className="relative h-64 md:h-80 lg:h-96 rounded-2xl overflow-hidden group"
      onMouseEnter={() => setIsAutoPlaying(false)}
      onMouseLeave={() => setIsAutoPlaying(true)}
    >
      {/* Background Image */}
      <div className="absolute inset-0 transition-all duration-700">
        {currentEvent.image_url ? (
          <img 
            src={currentEvent.image_url} 
            alt={currentEvent.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#2D5016] to-[#4A7C23]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
      </div>

      {/* Content */}
      <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-8">
        <div className="max-w-2xl">
          <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-medium text-white mb-3 capitalize">
            {currentEvent.category || "Event"}
          </span>
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-2 line-clamp-2">
            {currentEvent.title}
          </h2>
          <div className="flex flex-wrap items-center gap-4 text-white/90 text-sm mb-4">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              <span>{format(new Date(currentEvent.start_time), "MMM d, h:mm a")}</span>
            </div>
          </div>
          <Link
            to={createPageUrl(`Events?highlight=${currentEvent.id}`)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-[#2D5016] rounded-lg font-medium hover:bg-stone-100 transition-colors"
          >
            View Details
          </Link>
        </div>
      </div>

      {/* Navigation Arrows */}
      {displayEvents.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/30"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={next}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/30"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </>
      )}

      {/* Dots */}
      {displayEvents.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2">
          {displayEvents.map((_, index) => (
            <button
              key={index}
              onClick={() => goTo(index)}
              className={cn(
                "w-2 h-2 rounded-full transition-all duration-300",
                index === currentIndex 
                  ? "bg-white w-6" 
                  : "bg-white/50 hover:bg-white/70"
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}