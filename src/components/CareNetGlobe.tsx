'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

export type CareNode = {
  id: string;
  fullName?: string;
  initials: string;
  age: number;
  address?: string;
  wardId?: string;
  ward: string;
  panchayat?: string;
  stage: string;
  concernScore: number;
  lastSignalAt: string | null;
  conditionsNotes?: string;
  coordinates: [number, number];
};

type CareNetGlobeProps = {
  className?: string;
  onSelectNode?: (node: CareNode | null) => void;
  selectedNodeId?: string | null;
};

const KERALA_VIEW = {
  center: [76.3, 10.0] as [number, number],
  zoom: 8.2,
  pitch: 45,
  bearing: -10,
};

const KERALA_LOCALITIES = [
  { id: 'all', label: 'All Kerala', center: [76.3, 10.0] as [number, number], zoom: 8.2, pitch: 45 },
  { id: 'ward-4-pathanamthitta', label: 'Pathanamthitta', center: [76.7074, 9.3375] as [number, number], zoom: 13.5, pitch: 55 },
  { id: 'ward-12-trivandrum', label: 'Trivandrum', center: [76.9557, 8.5241] as [number, number], zoom: 13.8, pitch: 55 },
  { id: 'ward-15-ernakulam', label: 'Kochi', center: [76.2673, 9.9312] as [number, number], zoom: 13.5, pitch: 55 },
  { id: 'ward-7-thrissur', label: 'Thrissur', center: [76.2144, 10.5276] as [number, number], zoom: 13.8, pitch: 55 },
  { id: 'ward-9-kozhikode', label: 'Kozhikode', center: [75.7804, 11.2588] as [number, number], zoom: 13.5, pitch: 55 },
  { id: 'ward-6-wayanad', label: 'Wayanad', center: [76.0835, 11.6103] as [number, number], zoom: 13.2, pitch: 55 },
  { id: 'ward-8-kottayam', label: 'Kottayam', center: [76.5222, 9.5915] as [number, number], zoom: 13.5, pitch: 55 },
  { id: 'ward-10-alappuzha', label: 'Alappuzha', center: [76.3388, 9.4981] as [number, number], zoom: 13.5, pitch: 55 },
  { id: 'ward-11-kollam', label: 'Kollam', center: [76.5847, 8.8932] as [number, number], zoom: 13.5, pitch: 55 },
  { id: 'ward-14-kannur', label: 'Kannur', center: [75.3704, 11.8745] as [number, number], zoom: 13.5, pitch: 55 },
  { id: 'ward-2-palakkad', label: 'Palakkad', center: [76.6548, 10.7867] as [number, number], zoom: 13.5, pitch: 55 },
  { id: 'ward-4-malappuram', label: 'Malappuram', center: [76.0711, 11.0732] as [number, number], zoom: 13.5, pitch: 55 },
  { id: 'ward-3-idukki', label: 'Idukki', center: [76.9737, 9.8496] as [number, number], zoom: 13.5, pitch: 55 },
  { id: 'ward-1-kasaragod', label: 'Kasaragod', center: [74.9852, 12.5102] as [number, number], zoom: 13.5, pitch: 55 },
];

const MAP_STYLES: Record<'street' | 'satellite', maplibregl.StyleSpecification> = {
  street: {
    version: 8,
    projection: { type: 'globe' },
    sources: {
      osm: {
        type: 'raster',
        tiles: [
          'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
          'https://b.tile.openstreetmap.org/{z}/{x}/{y}.png',
          'https://c.tile.openstreetmap.org/{z}/{x}/{y}.png',
        ],
        tileSize: 256,
        attribution: '&copy; OpenStreetMap contributors',
      },
    },
    layers: [{ id: 'osm-layer', type: 'raster', source: 'osm' }],
  },
  satellite: {
    version: 8,
    projection: { type: 'globe' },
    sources: {
      esri: {
        type: 'raster',
        tiles: [
          'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        ],
        tileSize: 256,
        attribution: '&copy; Esri, Maxar, Earthstar Geographics',
      },
    },
    layers: [{ id: 'esri-layer', type: 'raster', source: 'esri' }],
  },
};


const stageLabels: Record<string, string> = {
  normal: 'Routine steady',
  soft_concern: 'Soft concern',
  verify: 'Needs verification',
  local_escalation: 'Local check active',
  extended_escalation: 'Extended escalation',
  family_escalation: 'Family escalation',
  critical: 'Critical response',
  resolved: 'Resolved',
};

const stageColors: Record<string, string> = {
  normal: '#006a64',
  soft_concern: '#d97706',
  verify: '#c87537',
  local_escalation: '#dc2626',
  extended_escalation: '#dc2626',
  family_escalation: '#b91c1c',
  critical: '#7f1d1d',
  resolved: '#006a64',
};

function statusColor(stage: string) {
  return stageColors[stage] || '#d97706';
}

export function CareNetGlobe({ className = '', onSelectNode, selectedNodeId }: CareNetGlobeProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [nodes, setNodes] = useState<CareNode[]>([]);
  const [internalSelectedNode, setInternalSelectedNode] = useState<CareNode | null>(null);
  const [mapError, setMapError] = useState('');
  const [isReady, setIsReady] = useState(false);
  const [activeLocality, setActiveLocality] = useState('all');
  const [mapTheme, setMapTheme] = useState<'street' | 'satellite'>('satellite');
  const [is3D, setIs3D] = useState(true);

  const selectedNode = useMemo(() => {
    if (selectedNodeId) {
      return nodes.find((n) => n.id === selectedNodeId) || internalSelectedNode;
    }
    return internalSelectedNode;
  }, [selectedNodeId, nodes, internalSelectedNode]);

  const activeId = selectedNode?.id;

  const handleSelectNode = (node: CareNode | null) => {
    setInternalSelectedNode(node);
    if (onSelectNode) onSelectNode(node);
  };

  // Listen to SOS broadcast events
  useEffect(() => {
    const handleSosEvent = (event: Event) => {
      const customEvent = event as CustomEvent<{ location?: { latitude: number; longitude: number }; elderId?: string }>;
      const loc = customEvent.detail?.location;
      const targetNode = nodes.find((n) => n.id === customEvent.detail?.elderId) || nodes[0];

      if (targetNode) {
        handleSelectNode({
          ...targetNode,
          stage: 'critical',
          concernScore: 100,
        });
      }

      if (mapRef.current) {
        const coords: [number, number] = loc && loc.longitude && loc.latitude
          ? [loc.longitude, loc.latitude]
          : (targetNode?.coordinates || [76.7074, 9.3375]);

        mapRef.current.flyTo({
          center: coords,
          zoom: 16.5,
          pitch: 65,
          bearing: 15,
          duration: 1600,
        });
      }
    };

    window.addEventListener('carenet-sos', handleSosEvent);
    return () => {
      window.removeEventListener('carenet-sos', handleSosEvent);
    };
  }, [nodes]);

  // Fetch nodes
  useEffect(() => {
    let cancelled = false;
    fetch('/api/map')
      .then((res) => {
        if (!res.ok) throw new Error('Unable to load care points');
        return res.json() as Promise<{ nodes: CareNode[] }>;
      })
      .then((payload) => {
        if (!cancelled) setNodes(payload.nodes);
      })
      .catch(() => {
        if (!cancelled) setMapError('Care points are temporarily unavailable.');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Initialize MapLibre GL instance
  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    try {
      maplibregl.setWorkerUrl(`${window.location.origin}/maplibre-gl-worker.mjs`);
    } catch {
      // Fallback worker handling
    }

    const map = new maplibregl.Map({
      container: mapContainer.current,
      center: KERALA_VIEW.center,
      zoom: KERALA_VIEW.zoom,
      pitch: KERALA_VIEW.pitch,
      bearing: KERALA_VIEW.bearing,
      maxPitch: 75,
      dragRotate: true,
      touchPitch: true,
      style: MAP_STYLES.satellite,
      attributionControl: {},
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: true }), 'bottom-right');
    map.on('load', () => {
      setIsReady(true);
      map.resize();
    });
    map.on('error', () => {
      setMapError('The map tiles could not be loaded.');
    });
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Change basemap style
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isReady) return;

    const styleSpec = MAP_STYLES[mapTheme];
    map.setStyle(styleSpec, { diff: false });

    // Re-add layer sources after style reload
    const onStyleData = () => {
      if (map.isStyleLoaded()) {
        updateMapNodes();
      }
    };
    map.once('styledata', onStyleData);
  }, [mapTheme]);

  // Update GeoJSON source & layers
  const updateMapNodes = () => {
    const map = mapRef.current;
    if (!map || !isReady) return;

    const sourceData = {
      type: 'FeatureCollection' as const,
      features: nodes.map((node) => ({
        type: 'Feature' as const,
        geometry: { type: 'Point' as const, coordinates: node.coordinates },
        properties: {
          id: node.id,
          name: node.fullName || node.initials,
          initials: node.initials,
          ward: node.ward,
          color: statusColor(node.stage),
          selected: node.id === activeId ? 1 : 0,
        },
      })),
    };

    if (map.getSource('care-nodes')) {
      (map.getSource('care-nodes') as maplibregl.GeoJSONSource).setData(sourceData);
    } else {
      map.addSource('care-nodes', { type: 'geojson', data: sourceData });

      map.addLayer({
        id: 'care-node-halo',
        type: 'circle',
        source: 'care-nodes',
        paint: {
          'circle-radius': ['case', ['==', ['get', 'selected'], 1], 24, 16],
          'circle-color': ['get', 'color'],
          'circle-opacity': 0.25,
          'circle-blur': 0.5,
        },
      });

      map.addLayer({
        id: 'care-node',
        type: 'circle',
        source: 'care-nodes',
        paint: {
          'circle-radius': ['case', ['==', ['get', 'selected'], 1], 12, 9],
          'circle-color': ['get', 'color'],
          'circle-stroke-color': '#ffffff',
          'circle-stroke-width': 3,
        },
      });

      map.addLayer({
        id: 'care-node-label',
        type: 'symbol',
        source: 'care-nodes',
        layout: {
          'text-field': ['get', 'initials'],
          'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
          'text-size': 10,
          'text-offset': [0, 1.4],
          'text-anchor': 'top',
        },
        paint: {
          'text-color': '#ffffff',
          'text-halo-color': '#0f2928',
          'text-halo-width': 2,
        },
      });

      map.on('mouseenter', 'care-node', () => {
        map.getCanvas().style.cursor = 'pointer';
      });
      map.on('mouseleave', 'care-node', () => {
        map.getCanvas().style.cursor = '';
      });

      map.on('click', 'care-node', (event) => {
        const feature = event.features?.[0];
        const clickedNode = nodes.find((item) => item.id === feature?.properties?.id);
        if (!clickedNode) return;
        handleSelectNode(clickedNode);
        map.flyTo({ center: clickedNode.coordinates, zoom: 14.2, pitch: 58, duration: 1200 });
      });
    }
  };

  useEffect(() => {
    updateMapNodes();
  }, [isReady, nodes, activeId]);

  // Handle locality filter selection
  const handleLocalitySelect = (localityId: string) => {
    setActiveLocality(localityId);
    const loc = KERALA_LOCALITIES.find((l) => l.id === localityId);
    if (!loc || !mapRef.current) return;

    mapRef.current.flyTo({
      center: loc.center,
      zoom: loc.zoom,
      pitch: is3D ? loc.pitch : 0,
      duration: 1400,
    });
  };

  // Toggle 3D perspective
  const toggle3D = () => {
    const next3D = !is3D;
    setIs3D(next3D);
    if (mapRef.current) {
      mapRef.current.easeTo({ pitch: next3D ? 52 : 0, duration: 800 });
    }
  };

  // Reset focus back to Kerala
  const resetToKerala = () => {
    handleLocalitySelect('all');
    handleSelectNode(null);
  };

  const handleCardQuickAction = async (actionType: 'confirm_ok' | 'neighbor_check') => {
    if (!selectedNode) return;
    try {
      const res = await fetch('/api/signals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          elderId: selectedNode.id,
          signalType: actionType === 'confirm_ok' ? 'volunteer_confirmed_ok' : 'manual_checkin',
          source: 'volunteer',
        }),
      });
      if (res.ok) {
        handleSelectNode({
          ...selectedNode,
          stage: actionType === 'confirm_ok' ? 'normal' : 'verify',
          concernScore: actionType === 'confirm_ok' ? 0 : 45,
        });

        fetch('/api/map')
          .then((r) => r.json())
          .then((d: { nodes: CareNode[] }) => {
            if (d.nodes) setNodes(d.nodes);
          });
      }
    } catch {
      // Fallback update
    }
  };

  const selectedStatus = useMemo(
    () => (selectedNode ? stageLabels[selectedNode.stage] || 'Care status' : ''),
    [selectedNode]
  );

  return (
    <section
      className={`relative overflow-hidden rounded-[26px] border border-[var(--carenet-border)] bg-[#0c2423] shadow-[0_26px_80px_rgba(18,59,58,0.22)] ${className}`}
      aria-label="Kerala Elder Locality Care Map"
    >
      {/* Locality Quick Selector Pills Header */}
      <div className="relative z-20 flex items-center justify-between gap-2 overflow-x-auto border-b border-white/10 bg-[#0e2c2b]/90 px-4 py-3 text-xs backdrop-blur-md">
        <div className="flex items-center gap-2">
          <span className="flex h-2.5 w-2.5 items-center justify-center relative">
            <span className="absolute inline-flex h-2.5 w-2.5 animate-ping rounded-full bg-[#34d399] opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#34d399]" />
          </span>
          <span className="font-mono text-[0.7rem] font-bold uppercase tracking-wider text-[#abefe9]">
            KERALA CARE NODES ({nodes.length})
          </span>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
          {KERALA_LOCALITIES.map((loc) => (
            <button
              key={loc.id}
              type="button"
              onClick={() => handleLocalitySelect(loc.id)}
              className={`whitespace-nowrap rounded-full px-3 py-1 text-[0.7rem] font-bold transition-all ${
                activeLocality === loc.id
                  ? 'bg-[#34d399] text-[#051c1b] shadow-md'
                  : 'bg-white/10 text-white/80 hover:bg-white/20 hover:text-white'
              }`}
            >
              {loc.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggle3D}
            className={`rounded-lg px-2.5 py-1 text-[0.68rem] font-bold transition ${
              is3D ? 'bg-white/20 text-white' : 'bg-white/5 text-white/60'
            }`}
            title="Toggle 3D Viewpoint"
          >
            {is3D ? '3D View' : '2D Map'}
          </button>

          <button
            type="button"
            onClick={() => setMapTheme(mapTheme === 'street' ? 'satellite' : 'street')}
            className="rounded-lg bg-white/10 px-2.5 py-1 text-[0.68rem] font-bold text-white hover:bg-white/20"
            title="Toggle Map Style"
          >
            {mapTheme === 'street' ? '🛰️ Satellite' : '🗺️ Map'}
          </button>
        </div>
      </div>

      {/* Map Canvas */}
      <div ref={mapContainer} className="min-h-[36rem] w-full sm:min-h-[42rem]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(12,36,35,0.4),transparent_20%,transparent_75%,rgba(12,36,35,0.65))]" />

      {/* Top Left Title Card */}
      <div className="absolute left-4 top-16 max-w-[19rem] rounded-2xl border border-white/25 bg-[#0e2c2b]/85 p-4 text-white shadow-xl backdrop-blur-md sm:left-6 sm:top-20">
        <div className="flex items-center gap-2 text-[0.68rem] font-bold uppercase tracking-[0.16em] text-[#abefe9]">
          <span className="h-2 w-2 animate-pulse rounded-full bg-[#34d399]" /> Live Kerala Map
        </div>
        <h2 className="mt-1.5 font-serif text-2xl leading-tight text-white">A living map of Kerala.</h2>
        <p className="mt-1.5 text-xs leading-5 text-white/80">
          Interactive ward nodes across Kerala. Click any marker to view the elder team and monitor their care status.
        </p>
      </div>

      {/* Bottom Left Stats Pill */}
      <div className="absolute bottom-4 left-4 flex items-center gap-2 rounded-xl border border-white/20 bg-[#0e2c2b]/90 px-3 py-2 text-[0.72rem] font-semibold text-white shadow-lg backdrop-blur sm:bottom-6 sm:left-6">
        <span className="material-symbols-outlined text-base text-[#34d399]">location_on</span>
        <span>{nodes.length} elders under care across Kerala wards</span>
        <button
          type="button"
          onClick={resetToKerala}
          className="ml-2 rounded-md bg-white/15 px-2 py-0.5 text-[0.65rem] font-bold hover:bg-white/30"
        >
          Reset View
        </button>
      </div>

      {/* Selected Elder Card / Drawer (Internal fallback if parent does not handle selection) */}
      {selectedNode && !onSelectNode && (
        <aside
          className="absolute bottom-4 right-4 max-w-[22rem] rounded-2xl border border-white/40 bg-white/95 p-5 text-[var(--carenet-ink)] shadow-2xl backdrop-blur-md sm:bottom-6 sm:right-6"
          aria-live="polite"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <span className="inline-block rounded-md bg-[var(--carenet-teal)]/10 px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-wider text-[var(--carenet-teal)]">
                {selectedNode.ward}
              </span>
              <h3 className="mt-1 text-xl font-extrabold text-[var(--carenet-ink)]">
                {selectedNode.fullName || selectedNode.initials} ({selectedNode.age}y)
              </h3>
            </div>
            <button
              type="button"
              onClick={() => handleSelectNode(null)}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--carenet-border)] text-lg leading-none hover:bg-[var(--carenet-coconut)]"
              aria-label="Close care details"
            >
              ×
            </button>
          </div>

          <p className="mt-1 text-xs text-[var(--carenet-ink-soft)]">{selectedNode.address}</p>

          <div className="mt-3 flex items-center justify-between rounded-xl bg-slate-100 p-2.5">
            <div className="flex items-center gap-2">
              <span
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: statusColor(selectedNode.stage) }}
              />
              <span className="text-xs font-bold text-[var(--carenet-ink)]">{selectedStatus}</span>
            </div>
            <span className="font-mono text-xs font-bold text-[var(--carenet-teal)]">
              Score: {selectedNode.concernScore}/100
            </span>
          </div>

          {selectedNode.conditionsNotes && (
            <p className="mt-2 text-xs leading-5 text-[var(--carenet-ink-soft)]">
              <span className="font-bold text-[var(--carenet-ink)]">Notes: </span>
              {selectedNode.conditionsNotes}
            </p>
          )}

          {/* Action Buttons inside Card */}
          <div className="mt-3 space-y-1.5">
            <button
              type="button"
              onClick={() => handleCardQuickAction('confirm_ok')}
              className="flex min-h-9 w-full items-center justify-center gap-1.5 rounded-xl bg-[#006a64] px-3 text-xs font-bold text-white hover:bg-[#00524d] transition"
            >
              ✓ Confirm Elder Safe & OK
            </button>

            <button
              type="button"
              onClick={() => handleCardQuickAction('neighbor_check')}
              className="flex min-h-9 w-full items-center justify-center gap-1.5 rounded-xl bg-[#d97706] px-3 text-xs font-bold text-white hover:bg-[#b45309] transition"
            >
              🚨 Dispatch Neighbor Check
            </button>
          </div>

          <div className="mt-3 flex items-center gap-2 border-t border-[var(--carenet-border)] pt-3">
            <a
              href={`/elder-profile-escalation?id=${encodeURIComponent(selectedNode.id)}`}
              className="flex min-h-9 flex-1 items-center justify-center gap-1.5 rounded-xl bg-[var(--carenet-ink)] px-3 text-xs font-bold text-white transition hover:bg-[var(--carenet-teal)]"
            >
              View Authorized Dossier
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </a>
          </div>
        </aside>
      )}

      {mapError && (
        <p
          role="alert"
          className="absolute bottom-4 right-4 rounded-xl bg-[#fff1ed] px-3 py-2 text-xs font-bold text-[#7f1d1d] shadow-lg"
        >
          {mapError}
        </p>
      )}
    </section>
  );
}
