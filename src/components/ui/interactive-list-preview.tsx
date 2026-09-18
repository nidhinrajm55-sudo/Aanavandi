// Built using Hyperiux Vault: https://vault.hyperiux.com

"use client";

import { useEffect, useRef, useState } from "react";
import type { MouseEvent as ReactMouseEvent } from "react";
import gsap from "gsap";

export interface InteractiveListItem {
  client: string;
  platform?: string;
  services: string;
  img: string;
}

export interface InteractiveListPreviewProps {
  items?: InteractiveListItem[];
  /** Scale multiplier for the hover preview image. */
  imageSize?: number;
  /** Preview image reveal / hide duration (seconds). */
  duration?: number;
  /** Highlight bar + row text transition smoothing (seconds). */
  smoothness?: number;
  /** Pointer-follow smoothing; higher tracks faster. */
  lerp?: number;
  /** Background color of the list surface. */
  bgColor?: string;
  className?: string;
}

const DEFAULT_IMAGE_Z_INDEX = 10;
const DEFAULT_IMAGE_SIZE = 1;
const DEFAULT_DURATION = 0.6;
const DEFAULT_SMOOTHNESS = 0.35;
const DEFAULT_LERP = 0.18;
const DEFAULT_ITEMS: InteractiveListItem[] = [
  { client: "AURORA UI", platform: "NEXT.JS", services: "Motion Design, GSAP, Page Transitions, UI Systems", img: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='200'%3E%3Crect width='100%25' height='100%25' fill='%230f766e'/%3E%3Ctext x='50%25' y='50%25' fill='%23ffffff' font-family='sans-serif' font-size='20' text-anchor='middle' dy='.3em'%3EAURORA UI%3C/text%3E%3C/svg%3E" },
  { client: "NEON FLOW", platform: "REACT", services: "Interactive UI, Scroll Animations, Effects Library", img: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='200'%3E%3Crect width='100%25' height='100%25' fill='%230d5c58'/%3E%3Ctext x='50%25' y='50%25' fill='%23ffffff' font-family='sans-serif' font-size='20' text-anchor='middle' dy='.3em'%3ENEON FLOW%3C/text%3E%3C/svg%3E" },
  { client: "SYNTH WAVE", platform: "REACT", services: "Audio UI, Visualizers, Modern Styling", img: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='200'%3E%3Crect width='100%25' height='100%25' fill='%23059669'/%3E%3Ctext x='50%25' y='50%25' fill='%23ffffff' font-family='sans-serif' font-size='20' text-anchor='middle' dy='.3em'%3ESYNTH WAVE%3C/text%3E%3C/svg%3E" },
  { client: "GLASSMORPH", platform: "NEXT.JS", services: "Glass UI, Components, Motion Architecture", img: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='200'%3E%3Crect width='100%25' height='100%25' fill='%230284c7'/%3E%3Ctext x='50%25' y='50%25' fill='%23ffffff' font-family='sans-serif' font-size='20' text-anchor='middle' dy='.3em'%3EGLASSMORPH%3C/text%3E%3C/svg%3E" },
];

export function InteractiveListPreview({
  items = DEFAULT_ITEMS,
  imageSize = DEFAULT_IMAGE_SIZE,
  duration = DEFAULT_DURATION,
  smoothness = DEFAULT_SMOOTHNESS,
  lerp = DEFAULT_LERP,
  bgColor,
  className = "",
}: InteractiveListPreviewProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const highlightRef = useRef<HTMLDivElement | null>(null);
  const rowsRef = useRef<(HTMLDivElement | null)[]>([]);

  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  // GSAP animation references for smooth position lerping
  const targetPos = useRef({ x: 0, y: 0 });
  const currentPos = useRef({ x: 0, y: 0 });
  const animFrameId = useRef<number | null>(null);

  // 1) Initialize GSAP transforms
  useEffect(() => {
    if (!imageRef.current) return;
    gsap.set(imageRef.current, {
      xPercent: -50,
      yPercent: -50,
      scale: 0,
      opacity: 0,
      zIndex: DEFAULT_IMAGE_Z_INDEX,
    });
  }, []);

  // 2) RAF-based pointer interpolation (LERP) for smooth follow
  useEffect(() => {
    const updatePosition = () => {
      currentPos.current.x +=
        (targetPos.current.x - currentPos.current.x) * lerp;
      currentPos.current.y +=
        (targetPos.current.y - currentPos.current.y) * lerp;

      if (imageRef.current) {
        gsap.set(imageRef.current, {
          x: currentPos.current.x,
          y: currentPos.current.y,
        });
      }

      animFrameId.current = requestAnimationFrame(updatePosition);
    };

    animFrameId.current = requestAnimationFrame(updatePosition);

    return () => {
      if (animFrameId.current) {
        cancelAnimationFrame(animFrameId.current);
      }
    };
  }, [lerp]);

  // 3) Pointer move handler relative to the outer container
  const handleMouseMove = (e: ReactMouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    targetPos.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  // 4) Row Mouse Enter -> Reveal & Swap Image, Move Highlight
  const handleRowMouseEnter = (index: number) => {
    setActiveIndex(index);
    const item = items[index];

    // Image reveal / scale swap
    if (imageRef.current && item) {
      imageRef.current.src = item.img;

      gsap.to(imageRef.current, {
        scale: imageSize,
        opacity: 1,
        duration: duration,
        ease: "power3.out",
        overwrite: "auto",
      });
    }

    // Highlight bar animation
    const targetRow = rowsRef.current[index];
    if (highlightRef.current && targetRow && containerRef.current) {
      const containerRect = containerRef.current.getBoundingClientRect();
      const rowRect = targetRow.getBoundingClientRect();

      gsap.to(highlightRef.current, {
        top: rowRect.top - containerRect.top,
        height: rowRect.height,
        opacity: 1,
        duration: smoothness,
        ease: "power2.out",
        overwrite: "auto",
      });
    }

    // Dim other rows, brighten active
    rowsRef.current.forEach((row, i) => {
      if (!row) return;
      gsap.to(row, {
        opacity: i === index ? 1 : 0.35,
        duration: smoothness,
        ease: "power2.out",
        overwrite: "auto",
      });
    });
  };

  // 5) Container Mouse Leave -> Hide Image, Hide Highlight, Reset Rows
  const handleMouseLeave = () => {
    setActiveIndex(null);

    // Hide image
    if (imageRef.current) {
      gsap.to(imageRef.current, {
        scale: 0,
        opacity: 0,
        duration: duration * 0.75,
        ease: "power3.inOut",
        overwrite: "auto",
      });
    }

    // Hide highlight bar
    if (highlightRef.current) {
      gsap.to(highlightRef.current, {
        opacity: 0,
        duration: smoothness,
        ease: "power2.inOut",
        overwrite: "auto",
      });
    }

    // Reset row opacities
    rowsRef.current.forEach((row) => {
      if (!row) return;
      gsap.to(row, {
        opacity: 1,
        duration: smoothness,
        ease: "power2.inOut",
        overwrite: "auto",
      });
    });
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={bgColor ? { backgroundColor: bgColor } : undefined}
      className={`relative w-full max-w-5xl mx-auto overflow-hidden rounded-2xl bg-neutral-950 p-6 md:p-12 text-neutral-100 font-sans selection:bg-neutral-800 selection:text-neutral-100 ${className}`}
    >
      {/* Dynamic Hover Image Preview */}
      <img
        ref={imageRef}
        alt="List Hover Preview"
        className="pointer-events-none absolute left-0 top-0 hidden md:block h-48 w-72 rounded-xl object-cover shadow-2xl transition-shadow border border-neutral-800"
      />

      {/* Sliding Active Highlight Bar */}
      <div
        ref={highlightRef}
        className="pointer-events-none absolute left-0 right-0 rounded-xl bg-neutral-900/80 opacity-0 border border-neutral-800/50 backdrop-blur-xs"
        style={{ top: 0, height: 0 }}
      />

      {/* List Headers (Desktop) */}
      <div className="hidden md:grid grid-cols-12 gap-4 pb-4 px-4 text-xs font-semibold tracking-wider text-neutral-500 uppercase border-b border-neutral-800/60">
        <span className="col-span-4">Client</span>
        <span className="col-span-3">Platform</span>
        <span className="col-span-5 text-right">Services</span>
      </div>

      {/* List Rows */}
      <div className="divide-y divide-neutral-800/40">
        {items.map((item, index) => {
          return (
            <div
              key={`${item.client}-${index}`}
              ref={(el) => {
                rowsRef.current[index] = el;
              }}
              onMouseEnter={() => handleRowMouseEnter(index)}
              className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 items-center py-6 px-4 cursor-pointer transition-colors"
            >
              {/* Client Name */}
              <div className="col-span-1 md:col-span-4 flex items-center gap-3">
                <span className="text-xs font-mono text-neutral-600">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3 className="text-xl md:text-2xl font-bold tracking-tight text-neutral-100">
                  {item.client}
                </h3>
              </div>

              {/* Platform */}
              <div className="col-span-1 md:col-span-3">
                {item.platform && (
                  <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-neutral-900 text-neutral-300 border border-neutral-800">
                    {item.platform}
                  </span>
                )}
              </div>

              {/* Services */}
              <div className="col-span-1 md:col-span-5 md:text-right">
                <p className="text-sm text-neutral-400 font-normal leading-relaxed">
                  {item.services}
                </p>
              </div>

              {/* Mobile Preview Image (Fallback for touch screens) */}
              <div className="block md:hidden col-span-1 mt-3">
                <img
                  src={item.img}
                  alt={item.client}
                  className="h-32 w-full rounded-lg object-cover border border-neutral-800"
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
