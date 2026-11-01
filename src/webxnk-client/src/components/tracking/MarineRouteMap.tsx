"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Ship,
  Navigation,
  Compass,
  Wind,
  Waves,
  Play,
  Pause,
  RotateCcw,
  Maximize2,
  ZoomIn,
  ZoomOut,
  Info,
  MapPin,
  Clock,
  Layers,
  Anchor,
} from "lucide-react";
import {
  MARINE_ROUTES,
  MarineRoute,
  MarineWaypoint,
  interpolateShipPosition,
} from "@/utils/marineRoutes";
import { useLanguage } from "@/context/LanguageContext";

interface MarineRouteMapProps {
  blNumber?: string;
  initialProgressPercent?: number;
  carrierName?: string;
  vesselName?: string;
  voyageNumber?: string;
  onWaypointSelect?: (wp: MarineWaypoint) => void;
}

export const MarineRouteMap: React.FC<MarineRouteMapProps> = ({
  blNumber = "QTH-BL-2026-JP01",
  initialProgressPercent = 65,
  carrierName,
  vesselName,
  voyageNumber,
  onWaypointSelect,
}) => {
  const { language } = useLanguage();
  const isVi = language === "vi";

  // Active route selection (defaults to matching blNumber or Tokyo)
  const route: MarineRoute = useMemo(() => {
    return (
      MARINE_ROUTES[blNumber] ||
      MARINE_ROUTES["QTH-BL-2026-JP01"]
    );
  }, [blNumber]);

  // Simulation State
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [simSpeed, setSimSpeed] = useState<number>(1); // 1x, 5x, 10x
  const [progress, setProgress] = useState<number>(initialProgressPercent);
  const [hoveredWaypoint, setHoveredWaypoint] = useState<MarineWaypoint | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [showNauticalGrid, setShowNauticalGrid] = useState<boolean>(true);

  // Sync initial progress if prop changes
  useEffect(() => {
    setProgress(initialProgressPercent);
  }, [initialProgressPercent, blNumber]);

  // Animation Loop for Voyage Simulation
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setProgress((prev) => {
        const next = prev + 0.25 * simSpeed;
        if (next >= 100) {
          setIsPlaying(false);
          return 100;
        }
        return next;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isPlaying, simSpeed]);

  // Calculate live vessel position & bearing
  const vesselNav = useMemo(() => {
    return interpolateShipPosition(route.waypoints, progress);
  }, [route, progress]);

  // Weather & Sea state simulation based on progress
  const weatherData = useMemo(() => {
    if (progress < 15) {
      return {
        stateVi: "Vùng biển ven bờ • Biển êm (Sóng cấp 2)",
        stateEn: "Coastal Waters • Calm Sea State 2",
        windKnots: 8,
        waveHeightM: 0.6,
        pressureHpa: 1012,
      };
    } else if (progress < 70) {
      return {
        stateVi: "Hải trình biển khơi • Gió Đông Bắc cấp 4",
        stateEn: "Open Ocean Passage • Favorable Winds 16 kts",
        windKnots: 16,
        waveHeightM: 1.4,
        pressureHpa: 1015,
      };
    } else {
      return {
        stateVi: "Tiếp cận luồng cảng đích • Gió nhẹ",
        stateEn: "Port Approach Waters • Light Sea Breeze",
        windKnots: 10,
        waveHeightM: 0.8,
        pressureHpa: 1013,
      };
    }
  }, [progress]);

  // Route Bounding Box & Coordinate Projection
  const proj = useMemo(() => {
    // Pacific route needs unwrapping for Western Hemisphere
    const isPacific = route.id === "route-usa";
    const isEurope = route.id === "route-europe";

    let minLat = 90, maxLat = -90, minLng = 360, maxLng = -360;

    route.waypoints.forEach((wp) => {
      let lng = wp.lng;
      if (isPacific && lng < 0) lng += 360;
      minLat = Math.min(minLat, wp.lat);
      maxLat = Math.max(maxLat, wp.lat);
      minLng = Math.min(minLng, lng);
      maxLng = Math.max(maxLng, lng);
    });

    // Add padding around route
    const padLat = Math.max(5, (maxLat - minLat) * 0.15);
    const padLng = Math.max(8, (maxLng - minLng) * 0.15);

    const bMinLat = Math.max(-10, minLat - padLat);
    const bMaxLat = Math.min(65, maxLat + padLat);
    const bMinLng = minLng - padLng;
    const bMaxLng = maxLng + padLng;

    const svgWidth = 920;
    const svgHeight = 440;

    const toSvg = (lat: number, lng: number) => {
      let effectiveLng = lng;
      if (isPacific && lng < 0) effectiveLng += 360;
      const x = ((effectiveLng - bMinLng) / (bMaxLng - bMinLng)) * svgWidth;
      // Invert Y because SVG coordinates increase downwards
      const y = ((bMaxLat - lat) / (bMaxLat - bMinLat)) * svgHeight;
      return { x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 };
    };

    return { toSvg, svgWidth, svgHeight, bMinLat, bMaxLat, bMinLng, bMaxLng, isPacific };
  }, [route]);

  // Compute SVG Path points for shipping lane
  const routePathD = useMemo(() => {
    if (route.waypoints.length === 0) return "";
    const pts = route.waypoints.map((wp) => proj.toSvg(wp.lat, wp.lng));
    return pts.reduce((acc, p, i) => {
      return i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
    }, "");
  }, [route, proj]);

  // Current vessel point in SVG coordinates
  const vesselSvgPos = useMemo(() => {
    return proj.toSvg(vesselNav.lat, vesselNav.lng);
  }, [proj, vesselNav]);

  // Remaining Distance in NM
  const remainingDistanceNm = Math.round(route.totalDistanceNm * (1 - progress / 100));

  return (
    <div className="border border-black bg-[#080d1a] text-white shadow-xl overflow-hidden rounded">
      {/* Top Oceanic Tactical Control Header */}
      <div className="border-b border-cyan-900/50 bg-[#0a1226] p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded bg-[#0E4B94]/40 border border-cyan-400 flex items-center justify-center text-cyan-300">
            <Ship className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-700/50 px-2 py-0.5 rounded uppercase">
                {isVi ? "HẢI ĐỒ HÀNG HẢI AIS THỜI GIAN THỰC" : "REAL-TIME AIS MARINE RADAR"}
              </span>
              <span className="text-[11px] font-mono text-cyan-400/80">
                IMO: {route.imoNumber}
              </span>
            </div>
            <h3 className="text-base font-black font-mono tracking-tight text-white mt-0.5 flex items-center gap-2">
              <span>{vesselName || route.vesselName}</span>
              <span className="text-xs text-neutral-400 font-normal">
                ({carrierName || route.carrierName})
              </span>
            </h3>
          </div>
        </div>

        {/* Live Metrics Pills */}
        <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
          <div className="bg-[#111c38] border border-cyan-900/60 px-3 py-1.5 rounded flex items-center gap-2">
            <Compass className="w-4 h-4 text-cyan-400" />
            <div>
              <span className="text-[9px] text-neutral-400 block uppercase">
                {isVi ? "HƯỚNG LA BÀN" : "BEARING"}
              </span>
              <span className="font-bold text-white">
                {String(vesselNav.bearing).padStart(3, "0")}°
              </span>
            </div>
          </div>

          <div className="bg-[#111c38] border border-cyan-900/60 px-3 py-1.5 rounded flex items-center gap-2">
            <Wind className="w-4 h-4 text-emerald-400" />
            <div>
              <span className="text-[9px] text-neutral-400 block uppercase">
                {isVi ? "TỐC ĐỘ AIS" : "SPEED"}
              </span>
              <span className="font-bold text-white">
                {progress >= 100 ? "0.0" : "18.4"} kts
              </span>
            </div>
          </div>

          <div className="bg-[#111c38] border border-cyan-900/60 px-3 py-1.5 rounded flex items-center gap-2">
            <Anchor className="w-4 h-4 text-amber-400" />
            <div>
              <span className="text-[9px] text-neutral-400 block uppercase">
                {isVi ? "KHOẢNG CÁCH CÒN" : "REMAINING"}
              </span>
              <span className="font-bold text-white">
                {remainingDistanceNm.toLocaleString()} NM
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Marine SVG Viewport */}
      <div className="relative overflow-hidden bg-gradient-to-b from-[#060a14] via-[#091124] to-[#040812] select-none">
        {/* Radar concentric sweep overlay */}
        <div className="absolute inset-0 pointer-events-none opacity-20 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-cyan-500/10 via-transparent to-transparent" />

        <svg
          viewBox={`0 0 ${proj.svgWidth} ${proj.svgHeight}`}
          className="w-full h-auto max-h-[500px] cursor-crosshair"
          style={{ transform: `scale(${zoomLevel})`, transformOrigin: "center center", transition: "transform 0.3s ease" }}
        >
          <defs>
            {/* Glowing route gradient */}
            <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00e5ff" stopOpacity="0.9" />
              <stop offset="50%" stopColor="#38bdf8" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#818cf8" stopOpacity="0.9" />
            </linearGradient>

            {/* Vessel pulse filter */}
            <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Nautical Lat/Lng Grid Lines */}
          {showNauticalGrid && (
            <g className="text-cyan-950 stroke-cyan-900/25 stroke-[0.8]" strokeDasharray="3 3">
              {[10, 20, 30, 40, 50].map((lat) => {
                const y = proj.toSvg(lat, proj.bMinLng).y;
                if (y < 0 || y > proj.svgHeight) return null;
                return (
                  <g key={`lat-${lat}`}>
                    <line x1="0" y1={y} x2={proj.svgWidth} y2={y} />
                    <text
                      x="10"
                      y={y - 4}
                      fill="#38bdf8"
                      fontSize="9"
                      fontFamily="monospace"
                      opacity="0.4"
                    >
                      {lat}°N
                    </text>
                  </g>
                );
              })}
            </g>
          )}

          {/* Shipping Lane Geodesic Polyline */}
          <path
            d={routePathD}
            fill="none"
            stroke="url(#routeGradient)"
            strokeWidth="3.5"
            strokeDasharray="6 4"
            strokeLinecap="round"
            className="transition-all duration-300"
          />

          {/* Traveled Route Segment (Solid Cyan) */}
          {route.waypoints.length > 1 && (
            <path
              d={route.waypoints
                .slice(0, vesselNav.currentSegmentIndex + 1)
                .map((wp) => proj.toSvg(wp.lat, wp.lng))
                .concat([vesselSvgPos])
                .reduce((acc, p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`), "")}
              fill="none"
              stroke="#00e5ff"
              strokeWidth="4"
              strokeLinecap="round"
              filter="url(#glow)"
            />
          )}

          {/* Waypoints & Port Anchors */}
          {route.waypoints.map((wp, index) => {
            const pt = proj.toSvg(wp.lat, wp.lng);
            const isOrigin = index === 0;
            const isDestination = index === route.waypoints.length - 1;
            const isHovered = hoveredWaypoint?.name === wp.name;

            return (
              <g
                key={`wp-${index}`}
                className="cursor-pointer"
                onMouseEnter={() => setHoveredWaypoint(wp)}
                onMouseLeave={() => setHoveredWaypoint(null)}
                onClick={() => onWaypointSelect?.(wp)}
              >
                {/* Outer Ring */}
                {isOrigin ? (
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r={isHovered ? 12 : 9}
                    fill="#0284c7"
                    stroke="#38bdf8"
                    strokeWidth="2.5"
                  />
                ) : isDestination ? (
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r={isHovered ? 12 : 9}
                    fill="#eab308"
                    stroke="#fef08a"
                    strokeWidth="2.5"
                  />
                ) : wp.type === "STRAIT" || wp.type === "CANAL" ? (
                  <polygon
                    points={`${pt.x},${pt.y - 7} ${pt.x + 7},${pt.y} ${pt.x},${pt.y + 7} ${pt.x - 7},${pt.y}`}
                    fill="#8b5cf6"
                    stroke="#c4b5fd"
                    strokeWidth="1.5"
                  />
                ) : (
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r={isHovered ? 7 : 4.5}
                    fill="#0f172a"
                    stroke="#38bdf8"
                    strokeWidth="2"
                  />
                )}

                {/* Waypoint Label */}
                <text
                  x={pt.x + 10}
                  y={pt.y + 4}
                  fill={isOrigin ? "#38bdf8" : isDestination ? "#fde047" : "#cbd5e1"}
                  fontSize={isOrigin || isDestination ? "10.5" : "9"}
                  fontWeight={isOrigin || isDestination || isHovered ? "bold" : "normal"}
                  fontFamily="monospace"
                  className="pointer-events-none drop-shadow"
                >
                  {isVi ? wp.nameVi : wp.name}
                </text>
              </g>
            );
          })}

          {/* Real-time Vessel Radar Beacon & Ship Silhouette */}
          <g transform={`translate(${vesselSvgPos.x}, ${vesselSvgPos.y})`}>
            {/* Radar Expanding Pulses */}
            <circle
              r="22"
              fill="none"
              stroke="#00e5ff"
              strokeWidth="1"
              opacity="0.4"
              className="animate-ping"
            />
            <circle
              r="14"
              fill="none"
              stroke="#38bdf8"
              strokeWidth="1.5"
              opacity="0.7"
            />

            {/* Vessel directional rotating arrow / ship icon */}
            <g transform={`rotate(${vesselNav.bearing})`}>
              <polygon
                points="0,-12 7,8 0,4 -7,8"
                fill="#ffffff"
                stroke="#0284c7"
                strokeWidth="1.5"
                filter="url(#glow)"
              />
            </g>

            {/* Live GPS Coordinates Callout */}
            <g transform="translate(14, -18)">
              <rect
                x="0"
                y="0"
                width="140"
                height="32"
                rx="4"
                fill="#020617"
                stroke="#00e5ff"
                strokeWidth="1"
                opacity="0.9"
              />
              <text x="8" y="13" fill="#38bdf8" fontSize="8" fontFamily="monospace" fontWeight="bold">
                {vesselNav.lat.toFixed(2)}°N, {vesselNav.lng.toFixed(2)}°E
              </text>
              <text x="8" y="25" fill="#a5f3fc" fontSize="8" fontFamily="monospace">
                SPD: {progress >= 100 ? "0.0" : "18.4"} kts | HDG: {String(vesselNav.bearing).padStart(3, "0")}°
              </text>
            </g>
          </g>
        </svg>

        {/* Hovered Waypoint Tactical Detail Overlay */}
        {hoveredWaypoint && (
          <div className="absolute top-4 left-4 z-20 bg-[#091124]/95 border border-cyan-400 p-3 rounded shadow-2xl max-w-sm backdrop-blur-md text-xs font-mono">
            <div className="flex items-center gap-1.5 text-cyan-400 font-bold mb-1">
              <MapPin className="w-4 h-4 text-cyan-300" />
              <span>{isVi ? hoveredWaypoint.nameVi : hoveredWaypoint.name}</span>
            </div>
            <p className="text-[10px] text-neutral-300">
              {hoveredWaypoint.lat.toFixed(2)}°N, {hoveredWaypoint.lng.toFixed(2)}°E •{" "}
              <span className="text-cyan-300 uppercase font-bold">
                {hoveredWaypoint.type}
              </span>
            </p>
            {(hoveredWaypoint.notesVi || hoveredWaypoint.notesEn) && (
              <p className="text-[11px] text-neutral-200 mt-1.5 border-t border-cyan-900/60 pt-1">
                {isVi ? hoveredWaypoint.notesVi : hoveredWaypoint.notesEn}
              </p>
            )}
          </div>
        )}

        {/* Bottom Right Map Controls */}
        <div className="absolute bottom-4 right-4 z-10 flex items-center gap-1.5 bg-[#0a1226]/90 border border-cyan-900/70 p-1.5 rounded backdrop-blur">
          <button
            onClick={() => setZoomLevel((z) => Math.min(2.5, z + 0.25))}
            className="p-1.5 hover:bg-cyan-950 text-cyan-300 rounded"
            title={isVi ? "Phóng to hải đồ" : "Zoom in"}
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => setZoomLevel((z) => Math.max(0.75, z - 0.25))}
            className="p-1.5 hover:bg-cyan-950 text-cyan-300 rounded"
            title={isVi ? "Thu nhỏ hải đồ" : "Zoom out"}
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              setZoomLevel(1);
            }}
            className="p-1.5 hover:bg-cyan-950 text-cyan-300 rounded"
            title={isVi ? "Đặt lại khung nhìn" : "Reset view"}
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowNauticalGrid((g) => !g)}
            className={`p-1.5 rounded ${showNauticalGrid ? "bg-cyan-900 text-cyan-200" : "hover:bg-cyan-950 text-neutral-400"}`}
            title={isVi ? "Bật/Tắt lưới tọa độ hàng hải" : "Toggle Lat/Lng Grid"}
          >
            <Layers className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Voyage Simulation & Scrubbing Controller */}
      <div className="border-t border-cyan-900/60 bg-[#091124] p-4 space-y-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs font-mono">
          {/* Controls: Play/Pause, Speeds */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsPlaying((p) => !p)}
              className="flex items-center gap-1.5 bg-[#0E4B94] hover:bg-[#0a376d] border border-cyan-400 px-4 py-1.5 rounded text-white font-bold transition-colors"
            >
              {isPlaying ? (
                <>
                  <Pause className="w-3.5 h-3.5" />
                  <span>{isVi ? "Tạm dừng" : "Pause"}</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5" />
                  <span>{isVi ? "Mô phỏng hải trình" : "Simulate Voyage"}</span>
                </>
              )}
            </button>

            {/* Speed Multipliers */}
            <div className="flex border border-cyan-900 bg-[#050b17] rounded overflow-hidden">
              {[1, 5, 10].map((s) => (
                <button
                  key={s}
                  onClick={() => setSimSpeed(s)}
                  className={`px-2.5 py-1 text-[11px] font-bold ${
                    simSpeed === s
                      ? "bg-cyan-500 text-black"
                      : "text-neutral-400 hover:text-white"
                  }`}
                >
                  {s}x
                </button>
              ))}
            </div>

            <button
              onClick={() => setProgress(0)}
              className="p-1.5 hover:bg-cyan-950 text-neutral-400 hover:text-white rounded"
              title={isVi ? "Trở về cảng xuất bến" : "Rewind to origin"}
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          {/* Weather status summary */}
          <div className="flex items-center gap-2 text-[11px] text-cyan-300/90 bg-[#060c1c] border border-cyan-900/40 px-3 py-1 rounded">
            <Waves className="w-3.5 h-3.5 text-cyan-400" />
            <span>{isVi ? weatherData.stateVi : weatherData.stateEn}</span>
          </div>
        </div>

        {/* Voyage Progress Slider */}
        <div className="space-y-1">
          <div className="flex justify-between text-[11px] font-mono text-neutral-400">
            <span className="flex items-center gap-1 text-cyan-300">
              <MapPin className="w-3 h-3" />
              {isVi ? route.originPortVi : route.originPort}
            </span>
            <span className="font-bold text-white">
              {progress.toFixed(1)}% {isVi ? "hải trình" : "voyage"}
            </span>
            <span className="flex items-center gap-1 text-yellow-300">
              <MapPin className="w-3 h-3" />
              {isVi ? route.destinationPortVi : route.destinationPort}
            </span>
          </div>

          <input
            type="range"
            min="0"
            max="100"
            step="0.1"
            value={progress}
            onChange={(e) => {
              setProgress(Number(e.target.value));
              if (isPlaying) setIsPlaying(false);
            }}
            className="w-full h-2 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-cyan-400 focus:outline-none"
          />
        </div>
      </div>
    </div>
  );
};
