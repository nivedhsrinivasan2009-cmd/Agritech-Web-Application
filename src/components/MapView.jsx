// Interactive Map Component using Leaflet
import React, { useEffect, useRef, useState } from 'react';
import { MapPin, Navigation, AlertTriangle, X, Maximize2, Minimize2 } from 'lucide-react';
import { Button } from './ui/button';

// Note: In production, install leaflet: npm install leaflet react-leaflet
// For now, we'll create a custom SVG-based map that works without external dependencies

const ZONES = [
  {
    id: 'entrance',
    name: 'Main Entrance',
    type: 'entrance',
    color: '#6B7280',
    x: 50,
    y: 90,
    width: 15,
    height: 8,
    description: 'Welcome center, tickets, and information'
  },
  {
    id: 'greenhouses',
    name: 'Greenhouses',
    type: 'agriculture',
    color: '#22C55E',
    x: 10,
    y: 20,
    width: 25,
    height: 30,
    description: 'Organic vegetables and herbs'
  },
  {
    id: 'animal-yard',
    name: 'Animal Yard',
    type: 'animals',
    color: '#F59E0B',
    x: 65,
    y: 15,
    width: 30,
    height: 35,
    description: 'Farm animals, petting zoo, feeding times'
  },
  {
    id: 'training-centre',
    name: 'Training Centre',
    type: 'education',
    color: '#3B82F6',
    x: 10,
    y: 55,
    width: 25,
    height: 25,
    description: 'Workshops and educational programs'
  },
  {
    id: 'kids-zone',
    name: 'Kids Play Zone',
    type: 'recreation',
    color: '#EC4899',
    x: 40,
    y: 45,
    width: 20,
    height: 20,
    description: 'Playground and kids activities'
  },
  {
    id: 'cafe',
    name: 'Farm Cafe',
    type: 'food',
    color: '#8B5CF6',
    x: 65,
    y: 55,
    width: 20,
    height: 15,
    description: 'Fresh food and beverages'
  },
  {
    id: 'shop',
    name: 'Farm Shop',
    type: 'retail',
    color: '#14B8A6',
    x: 65,
    y: 73,
    width: 20,
    height: 12,
    description: 'Local produce and souvenirs'
  },
  {
    id: 'orchard',
    name: 'Fruit Orchard',
    type: 'agriculture',
    color: '#84CC16',
    x: 40,
    y: 15,
    width: 20,
    height: 25,
    description: 'Seasonal fruit picking'
  }
];

export default function MapView({
  zones = ZONES,
  selectedZone = null,
  onZoneSelect,
  userLocation = null,
  closedZones = [],
  showControls = true,
  className = ''
}) {
  const mapRef = useRef(null);
  const [hoveredZone, setHoveredZone] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Handle zone click
  const handleZoneClick = (zone) => {
    if (onZoneSelect) {
      onZoneSelect(zone);
    }
  };

  // Check if zone is closed
  const isZoneClosed = (zoneId) => {
    return closedZones.some(z => z.id === zoneId && z.is_closed);
  };

  // Get closure info
  const getClosureInfo = (zoneId) => {
    return closedZones.find(z => z.id === zoneId);
  };

  // Zoom controls
  const zoomIn = () => setScale(s => Math.min(s + 0.25, 3));
  const zoomOut = () => setScale(s => Math.max(s - 0.25, 0.5));
  const resetView = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  // Toggle fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      mapRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // Handle drag
  const handleMouseDown = (e) => {
    if (e.target.closest('.zone-area')) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch handlers
  const handleTouchStart = (e) => {
    if (e.target.closest('.zone-area')) return;
    const touch = e.touches[0];
    setIsDragging(true);
    setDragStart({ x: touch.clientX - position.x, y: touch.clientY - position.y });
  };

  const handleTouchMove = (e) => {
    if (!isDragging) return;
    const touch = e.touches[0];
    setPosition({
      x: touch.clientX - dragStart.x,
      y: touch.clientY - dragStart.y
    });
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  return (
    <div
      ref={mapRef}
      className={`relative bg-[#E8F5E9] rounded-xl overflow-hidden ${className} ${isFullscreen ? 'fixed inset-0 z-50 rounded-none' : ''}`}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleMouseUp}
      style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
    >
      {/* Map Controls */}
      {showControls && (
        <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
          <Button
            size="sm"
            variant="secondary"
            className="w-10 h-10 p-0 bg-white shadow-md"
            onClick={zoomIn}
          >
            +
          </Button>
          <Button
            size="sm"
            variant="secondary"
            className="w-10 h-10 p-0 bg-white shadow-md"
            onClick={zoomOut}
          >
            -
          </Button>
          <Button
            size="sm"
            variant="secondary"
            className="w-10 h-10 p-0 bg-white shadow-md"
            onClick={resetView}
          >
            <Navigation className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="secondary"
            className="w-10 h-10 p-0 bg-white shadow-md"
            onClick={toggleFullscreen}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </Button>
        </div>
      )}

      {/* SVG Map */}
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full"
        style={{
          transform: `scale(${scale}) translate(${position.x / scale}px, ${position.y / scale}px)`,
          transformOrigin: 'center',
          transition: isDragging ? 'none' : 'transform 0.2s ease-out'
        }}
      >
        {/* Background pattern */}
        <defs>
          <pattern id="grass" patternUnits="userSpaceOnUse" width="4" height="4">
            <rect width="4" height="4" fill="#C8E6C9" />
            <circle cx="1" cy="1" r="0.5" fill="#A5D6A7" />
            <circle cx="3" cy="3" r="0.5" fill="#A5D6A7" />
          </pattern>
          <pattern id="path" patternUnits="userSpaceOnUse" width="2" height="2">
            <rect width="2" height="2" fill="#D7CCC8" />
          </pattern>
        </defs>

        {/* Background */}
        <rect x="0" y="0" width="100" height="100" fill="url(#grass)" />

        {/* Paths */}
        <path
          d="M 50 90 L 50 70 L 30 70 L 30 55 M 50 70 L 75 70 M 50 50 L 50 30 L 30 30 M 50 30 L 75 30"
          stroke="#BCAAA4"
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Zones */}
        {zones.map((zone) => {
          const isClosed = isZoneClosed(zone.id);
          const closureInfo = getClosureInfo(zone.id);
          const isSelected = selectedZone?.id === zone.id;
          const isHovered = hoveredZone === zone.id;

          return (
            <g
              key={zone.id}
              className="zone-area cursor-pointer"
              onClick={() => handleZoneClick(zone)}
              onMouseEnter={() => setHoveredZone(zone.id)}
              onMouseLeave={() => setHoveredZone(null)}
            >
              {/* Zone shape */}
              <rect
                x={zone.x}
                y={zone.y}
                width={zone.width}
                height={zone.height}
                rx="2"
                fill={zone.color}
                fillOpacity={isClosed ? 0.3 : 0.8}
                stroke={isSelected ? '#1A1A1A' : isHovered ? '#4A4A4A' : zone.color}
                strokeWidth={isSelected ? 1 : isHovered ? 0.5 : 0}
                className="transition-all duration-200"
              />

              {/* Zone label */}
              <text
                x={zone.x + zone.width / 2}
                y={zone.y + zone.height / 2}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="white"
                fontSize="2.5"
                fontWeight="bold"
                className="pointer-events-none select-none"
                style={{ textShadow: '0 0.5px 1px rgba(0,0,0,0.3)' }}
              >
                {zone.name}
              </text>

              {/* Closed indicator */}
              {isClosed && (
                <>
                  <line
                    x1={zone.x}
                    y1={zone.y}
                    x2={zone.x + zone.width}
                    y2={zone.y + zone.height}
                    stroke="#EF4444"
                    strokeWidth="0.5"
                  />
                  <line
                    x1={zone.x + zone.width}
                    y1={zone.y}
                    x2={zone.x}
                    y2={zone.y + zone.height}
                    stroke="#EF4444"
                    strokeWidth="0.5"
                  />
                </>
              )}
            </g>
          );
        })}

        {/* User location marker */}
        {userLocation && (
          <g>
            <circle
              cx={userLocation.x}
              cy={userLocation.y}
              r="3"
              fill="#3B82F6"
              stroke="white"
              strokeWidth="1"
            />
            <circle
              cx={userLocation.x}
              cy={userLocation.y}
              r="5"
              fill="#3B82F6"
              fillOpacity="0.3"
              className="animate-ping"
            />
          </g>
        )}

        {/* Compass */}
        <g transform="translate(90, 10)">
          <circle cx="0" cy="0" r="5" fill="white" fillOpacity="0.9" />
          <text x="0" y="-1" textAnchor="middle" fontSize="3" fill="#EF4444" fontWeight="bold">N</text>
          <path d="M 0 -3 L 1 1 L 0 0 L -1 1 Z" fill="#EF4444" />
        </g>
      </svg>

      {/* Zone info popup */}
      {(hoveredZone || selectedZone) && (
        <div className="absolute bottom-4 left-4 right-4 bg-white rounded-xl shadow-lg p-4 z-10">
          {(() => {
            const zone = zones.find(z => z.id === (hoveredZone || selectedZone?.id));
            if (!zone) return null;

            const isClosed = isZoneClosed(zone.id);
            const closureInfo = getClosureInfo(zone.id);

            return (
              <>
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-4 h-4 rounded"
                      style={{ backgroundColor: zone.color }}
                    />
                    <h3 className="font-semibold text-stone-900">{zone.name}</h3>
                  </div>
                  {selectedZone && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onZoneSelect?.(null);
                      }}
                      className="p-1 hover:bg-stone-100 rounded"
                    >
                      <X className="w-4 h-4 text-stone-400" />
                    </button>
                  )}
                </div>

                <p className="text-sm text-stone-600 mb-2">{zone.description}</p>

                {isClosed && closureInfo && (
                  <div className="flex items-center gap-2 p-2 bg-red-50 rounded-lg text-sm text-red-700">
                    <AlertTriangle className="w-4 h-4" />
                    <span>
                      {closureInfo.closure_reason || 'This zone is currently closed'}
                    </span>
                  </div>
                )}

                {!isClosed && (
                  <Button
                    size="sm"
                    className="w-full mt-2 bg-[#2D5016] hover:bg-[#4A7C23]"
                    onClick={() => {
                      // Navigate to zone details or start navigation
                      window.location.href = `/map?zone=${zone.id}`;
                    }}
                  >
                    <Navigation className="w-4 h-4 mr-2" />
                    Navigate Here
                  </Button>
                )}
              </>
            );
          })()}
        </div>
      )}

      {/* Legend */}
      <div className="absolute top-4 left-4 bg-white/90 backdrop-blur rounded-lg p-3 text-xs">
        <div className="font-semibold mb-2 text-stone-700">Legend</div>
        <div className="space-y-1">
          {[
            { color: '#22C55E', label: 'Agriculture' },
            { color: '#F59E0B', label: 'Animals' },
            { color: '#3B82F6', label: 'Education' },
            { color: '#EC4899', label: 'Recreation' },
            { color: '#8B5CF6', label: 'Food' },
            { color: '#14B8A6', label: 'Retail' }
          ].map(item => (
            <div key={item.label} className="flex items-center gap-2">
              <div className="w-3 h-3 rounded" style={{ backgroundColor: item.color }} />
              <span className="text-stone-600">{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
