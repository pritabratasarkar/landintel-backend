/**
 * LandIntel Core GIS Map View & Spatial Intelligence Engine
 * 
 * Upgraded GIS Architecture:
 * - 4 Basemap Modes: CLEAN_LIGHT (default), OPEN_STANDARD, SATELLITE, NATURAL_GREENERY
 * - Strict Separation: Night/Dark UI mode does NOT alter the geographic basemap
 * - Map-Specific Coordinate Search: Parses & validates (lat, lng), adds temporary pin & flies to target
 * - Scale-Dependent 1:1,000,000 Rule: Zoom < 9 hides numerical scores/text, Zoom >= 9 restores detailed risk badges
 * - Congestion & Spatial Clustering: Aggregates dense corridors; drill-down inspection on cluster click
 * - Actual Project Land-Acquisition Boundaries (GeoJSON polygons styled with 5-tier risk theme)
 * - Complete Land-Acquisition Layer Architecture: Forests, Wetlands, Protected, ESZ, Administrative, Infrastructure
 * - Minimum Zoom & Boundary Enforcement: Map stays 100% within container boundaries without shrinking
 * 
 * Smart India Hackathon - Problem Statement 26017
 */

import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Layers,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  Navigation,
  Compass,
  Search,
  X,
  MapPin,
  Trees,
  Droplets,
  ShieldAlert,
  Scale,
  Flame,
  Clock,
  Building2,
  Map as MapIcon,
  Globe,
  Sun,
  Eye,
  AlertTriangle,
  Info,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Filter,
} from 'lucide-react';
import { Project, GISLayerConfig, RiskLevel } from '../types';
import { getRiskTheme } from '../config/riskConfig';
import {
  MOCK_ENVIRONMENTAL_GEOJSON,
  MOCK_HISTORICAL_PROJECTS_GEOJSON,
} from '../data/mockData';

export type MapBasemapMode = 'CLEAN_LIGHT' | 'OPEN_STANDARD' | 'SATELLITE' | 'NATURAL_GREENERY';

interface MapContainerProps {
  projects: Project[];
  selectedProject: Project | null;
  onSelectProject: (project: Project) => void;
  layers: GISLayerConfig[];
  onToggleLayer: (layerId: string) => void;
  bufferRadiusKm?: number;
  onInspectFeature?: (feature: any) => void;
}

// Coordinate validation helper to guarantee Leaflet never receives NaN or invalid values
function isValidCoordinate(lat: any, lng: any): boolean {
  return (
    typeof lat === 'number' &&
    typeof lng === 'number' &&
    !isNaN(lat) &&
    !isNaN(lng) &&
    isFinite(lat) &&
    isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}

// Distance formula (Haversine)
function getDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Spatial Cluster Structure
interface ProjectCluster {
  id: string;
  centerLat: number;
  centerLng: number;
  projects: Project[];
  avgScore: number;
  maxLevel: RiskLevel;
}

// Spatial clustering algorithm
function calculateClusters(projects: Project[], thresholdKm: number = 38): ProjectCluster[] {
  const validProjects = projects.filter(p => isValidCoordinate(p.latitude, p.longitude));
  const clusters: ProjectCluster[] = [];
  const visited = new Set<string>();

  validProjects.forEach(proj => {
    if (visited.has(proj.id)) return;

    const clusterProjects: Project[] = [proj];
    visited.add(proj.id);

    validProjects.forEach(other => {
      if (visited.has(other.id)) return;
      const dist = getDistanceKm(proj.latitude, proj.longitude, other.latitude, other.longitude);
      if (dist <= thresholdKm) {
        clusterProjects.push(other);
        visited.add(other.id);
      }
    });

    const centerLat =
      clusterProjects.reduce((sum, p) => sum + p.latitude, 0) / clusterProjects.length;
    const centerLng =
      clusterProjects.reduce((sum, p) => sum + p.longitude, 0) / clusterProjects.length;
    const avgScore = Math.round(
      clusterProjects.reduce((sum, p) => sum + (p.risk?.score ?? 50), 0) / clusterProjects.length
    );

    let maxLevel: RiskLevel = 'LOW';
    if (clusterProjects.some(p => p.risk?.level === 'CRITICAL')) maxLevel = 'CRITICAL';
    else if (clusterProjects.some(p => p.risk?.level === 'HIGH')) maxLevel = 'HIGH';
    else if (clusterProjects.some(p => p.risk?.level === 'MEDIUM')) maxLevel = 'MEDIUM';
    else if (clusterProjects.some(p => p.risk?.level === 'LOW_MEDIUM')) maxLevel = 'LOW_MEDIUM';

    clusters.push({
      id: `cluster-${proj.id}`,
      centerLat,
      centerLng,
      projects: clusterProjects,
      avgScore,
      maxLevel,
    });
  });

  return clusters;
}

// Basemap Tile Providers Configuration
const BASEMAP_TILES: Record<MapBasemapMode, { url: string; options: L.TileLayerOptions; name: string; description: string }> = {
  CLEAN_LIGHT: {
    name: 'Clean Light',
    description: 'Minimalist high-contrast light cartography for clear intelligence overlays',
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    options: {
      subdomains: 'abcd',
      maxZoom: 19,
      minZoom: 4,
      attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
    },
  },
  OPEN_STANDARD: {
    name: 'Open Standard',
    description: 'Standard OpenStreetMap geographic vector tiles and landmarks',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    options: {
      maxZoom: 19,
      minZoom: 4,
      attribution: '&copy; OpenStreetMap contributors',
    },
  },
  SATELLITE: {
    name: 'Satellite Imagery',
    description: 'High-resolution global satellite photography (Esri World Imagery)',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    options: {
      maxZoom: 18,
      minZoom: 4,
      attribution: 'Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics, USDA, USGS',
    },
  },
  NATURAL_GREENERY: {
    name: 'Natural & Greenery',
    description: 'Topographic contours, forest cover, rivers & elevation terrain',
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    options: {
      maxZoom: 17,
      minZoom: 4,
      attribution: 'Map data &copy; OpenStreetMap contributors, SRTM | Map style &copy; OpenTopoMap (CC-BY-SA)',
    },
  },
};

export const MapContainer: React.FC<MapContainerProps> = ({
  projects,
  selectedProject,
  onSelectProject,
  layers,
  onToggleLayer,
  bufferRadiusKm = 15,
  onInspectFeature,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);

  // Layer groups to manage rendering cycles
  const projectMarkersLayerRef = useRef<L.LayerGroup | null>(null);
  const projectPolygonsLayerRef = useRef<L.LayerGroup | null>(null);
  const clusterLayerRef = useRef<L.LayerGroup | null>(null);
  const searchMarkerLayerRef = useRef<L.LayerGroup | null>(null);
  const environmentalLayersRef = useRef<{ [key: string]: L.GeoJSON }>({});
  const historicalLayerRef = useRef<L.LayerGroup | null>(null);
  const heatmapLayerRef = useRef<L.LayerGroup | null>(null);
  const bufferLayerRef = useRef<L.Circle | null>(null);

  // State
  const [mapMode, setMapMode] = useState<MapBasemapMode>('CLEAN_LIGHT');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showLayerMenu, setShowLayerMenu] = useState(false);
  const [currentZoom, setCurrentZoom] = useState(8);
  const [activeClusterModal, setActiveClusterModal] = useState<ProjectCluster | null>(null);

  // Coordinate Search State
  const [coordSearchInput, setCoordSearchInput] = useState('');
  const [coordSearchError, setCoordSearchError] = useState<string | null>(null);
  const [searchedCoords, setSearchedCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Layer Filter Tab in Layer Manager
  const [layerFilterTab, setLayerFilterTab] = useState<'ALL' | 'PROJECTS' | 'ENVIRONMENT' | 'ADMIN_INFRA'>('ALL');

  /**
   * Scale-Dependent 1:1,000,000 Rule:
   * In Web Mercator at latitude ~23°:
   * - Zoom 9 corresponds to approx 1 : 940,000 scale (detailed scale, <= 1:1M)
   * - Zoom 8 corresponds to approx 1 : 1,880,000 scale (wide scale, > 1:1M)
   * Thus, currentZoom >= 9 is detailed; currentZoom < 9 is beyond 1:1,000,000.
   */
  const isScaleWithinOneMillion = currentZoom >= 9;

  // 1. Initialize Map Instance with defensive bounds & container constraints
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const defaultCenter: [number, number] = [22.85, 88.25];
    const defaultZoom = 8;

    // Minimum zoom is 4, max zoom is 18.
    // Global bounds with maxBoundsViscosity prevent the map from ever shrinking outside its container.
    const map = L.map(mapContainerRef.current, {
      center: defaultCenter,
      zoom: defaultZoom,
      minZoom: 4,
      maxZoom: 18,
      maxBounds: [
        [-85, -180],
        [85, 180],
      ],
      maxBoundsViscosity: 0.9,
      zoomControl: false,
      attributionControl: false,
      worldCopyJump: false,
    });

    // Default tile layer (CLEAN_LIGHT)
    const baseConfig = BASEMAP_TILES.CLEAN_LIGHT;
    const tile = L.tileLayer(baseConfig.url, baseConfig.options).addTo(map);
    tileLayerRef.current = tile;

    // Metric Scale Indicator
    L.control
      .scale({
        imperial: false,
        metric: true,
        position: 'bottomleft',
      })
      .addTo(map);

    // Live Cursor Coordinate Display (beside the scale indicator, bottom-left)
    const CoordinatesControl = L.Control.extend({
      options: { position: 'bottomleft' },
      onAdd: function () {
        const div = L.DomUtil.create('div', 'leaflet-control-coordinates');
        div.id = 'leaflet-live-coords';
        div.style.padding = '3px 8px';
        div.style.background = 'rgba(255, 255, 255, 0.92)';
        div.style.backdropFilter = 'blur(4px)';
        div.style.border = '1px solid rgba(203, 213, 225, 0.8)';
        div.style.borderRadius = '4px';
        div.style.fontSize = '11px';
        div.style.fontFamily = 'monospace';
        div.style.fontWeight = '600';
        div.style.color = '#1e293b';
        div.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.12)';
        div.style.display = 'none';
        div.style.whiteSpace = 'nowrap';
        div.style.alignItems = 'center';
        return div;
      },
    });
    const coordsControl = new CoordinatesControl();
    coordsControl.addTo(map);

    const formatLiveCoordinates = (lat: number, lng: number): string => {
      const latDir = lat >= 0 ? 'N' : 'S';
      const lngDir = lng >= 0 ? 'E' : 'W';
      return `${Math.abs(lat).toFixed(4)}° ${latDir}, ${Math.abs(lng).toFixed(4)}° ${lngDir}`;
    };

    map.on('mousemove', (e: L.LeafletMouseEvent) => {
      if (isValidCoordinate(e.latlng.lat, e.latlng.lng)) {
        const el = document.getElementById('leaflet-live-coords');
        if (el) {
          el.textContent = formatLiveCoordinates(e.latlng.lat, e.latlng.lng);
          el.style.display = 'inline-flex';
        }
      }
    });

    map.on('mouseout', () => {
      const el = document.getElementById('leaflet-live-coords');
      if (el) {
        el.style.display = 'none';
      }
    });

    // Zoom listener
    map.on('zoomend', () => {
      setCurrentZoom(map.getZoom());
    });

    // Layer groups initialization
    projectMarkersLayerRef.current = L.layerGroup().addTo(map);
    projectPolygonsLayerRef.current = L.layerGroup().addTo(map);
    clusterLayerRef.current = L.layerGroup().addTo(map);
    searchMarkerLayerRef.current = L.layerGroup().addTo(map);
    historicalLayerRef.current = L.layerGroup().addTo(map);
    heatmapLayerRef.current = L.layerGroup().addTo(map);

    mapInstanceRef.current = map;

    // Responsive ResizeObserver to keep canvas strictly aligned with parent layout
    const resizeObserver = new ResizeObserver(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize({ animate: false });
      }
    });

    if (mapContainerRef.current) {
      resizeObserver.observe(mapContainerRef.current);
    }

    const handleWindowResize = () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize({ animate: false });
      }
    };
    window.addEventListener('resize', handleWindowResize);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', handleWindowResize);
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // 2. Dynamic Basemap Tile Switcher (preserves overlay state)
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    const baseConfig = BASEMAP_TILES[mapMode] || BASEMAP_TILES.CLEAN_LIGHT;

    if (tileLayerRef.current) {
      mapInstanceRef.current.removeLayer(tileLayerRef.current);
    }

    const newTile = L.tileLayer(baseConfig.url, baseConfig.options).addTo(mapInstanceRef.current);
    // Send tile to back so vector layers stay on top
    newTile.bringToBack();
    tileLayerRef.current = newTile;
  }, [mapMode]);

  // 3. Create Custom Risk Marker Icon
  // Implements the Scale-Dependent 1:1,000,000 rule:
  // If scale is beyond 1:1,000,000 (showScore === false), render compact dot without text score
  const createRiskMarkerIcon = useCallback(
    (level: RiskLevel, isSelected: boolean, score: number, showScore: boolean) => {
      const theme = getRiskTheme(level);

      if (!showScore) {
        // Compact visual dot marker when zoomed out (> 1:1,000,000 scale)
        const dotSize = isSelected ? 18 : 12;
        const pulseHtml =
          level === 'CRITICAL'
            ? `<div class="absolute -inset-1.5 rounded-full animate-ping opacity-60" style="background-color: ${theme.hex};"></div>`
            : '';

        const html = `
          <div class="relative flex items-center justify-center cursor-pointer transition-transform hover:scale-125" style="width: ${dotSize}px; height: ${dotSize}px;">
            ${pulseHtml}
            <div class="rounded-full border-2 border-white shadow-md transition-all" 
                 style="background-color: ${theme.hex}; width: ${dotSize}px; height: ${dotSize}px; box-shadow: 0 0 8px ${theme.hex}90;">
            </div>
          </div>
        `;

        return L.divIcon({
          html,
          className: 'custom-risk-dot-marker',
          iconSize: [dotSize, dotSize],
          iconAnchor: [dotSize / 2, dotSize / 2],
          popupAnchor: [0, -dotSize / 2],
        });
      }

      // Detailed risk score badge when zoomed in (<= 1:1,000,000 scale)
      const size = isSelected ? 42 : 34;
      const pulseHtml =
        level === 'CRITICAL'
          ? `<div class="absolute -inset-2 rounded-full animate-ping opacity-60 bg-red-600"></div>`
          : level === 'HIGH'
          ? `<div class="absolute -inset-1 rounded-full animate-pulse opacity-40 bg-rose-500"></div>`
          : '';

      const html = `
        <div class="relative flex items-center justify-center cursor-pointer transition-transform hover:scale-110" style="width: ${size}px; height: ${size}px;">
          ${pulseHtml}
          <div class="relative flex items-center justify-center rounded-full shadow-lg border-2 font-mono font-bold text-white transition-all text-xs" 
               style="background-color: ${theme.hex}; border-color: ${isSelected ? '#ffffff' : theme.strokeHex}; width: ${size}px; height: ${size}px; box-shadow: 0 0 15px ${theme.hex}90;">
            <span>${score}</span>
          </div>
        </div>
      `;

      return L.divIcon({
        html,
        className: 'custom-risk-marker',
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
        popupAnchor: [0, -size / 2],
      });
    },
    []
  );

  // 4. Create Cluster Badge Icon
  const createClusterIcon = useCallback((cluster: ProjectCluster) => {
    const theme = getRiskTheme(cluster.maxLevel);
    const count = cluster.projects.length;
    const size = count > 4 ? 48 : 42;

    const html = `
      <div class="relative flex items-center justify-center cursor-pointer transition-transform hover:scale-110" style="width: ${size}px; height: ${size}px;">
        <div class="absolute -inset-1 rounded-full opacity-35 animate-pulse" style="background-color: ${theme.hex};"></div>
        <div class="relative flex flex-col items-center justify-center rounded-full shadow-xl border-2 font-mono font-bold text-white transition-all"
             style="background-color: ${theme.hex}; border-color: #ffffff; width: ${size}px; height: ${size}px; box-shadow: 0 0 18px ${theme.hex}90;">
          <span class="text-xs font-black leading-none">${count}</span>
          <span class="text-[8px] opacity-90 leading-tight">Corridors</span>
        </div>
      </div>
    `;

    return L.divIcon({
      html,
      className: 'custom-cluster-marker',
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
    });
  }, []);

  // 5. Render Projects, Boundaries & Spatial Clusters based on Zoom Level
  useEffect(() => {
    if (
      !mapInstanceRef.current ||
      !projectMarkersLayerRef.current ||
      !projectPolygonsLayerRef.current ||
      !clusterLayerRef.current
    )
      return;

    projectMarkersLayerRef.current.clearLayers();
    projectPolygonsLayerRef.current.clearLayers();
    clusterLayerRef.current.clearLayers();

    const isProjectsLayerVisible = layers.find(l => l.id === 'projects')?.visible !== false;
    const isBoundariesLayerVisible = layers.find(l => l.id === 'boundaries')?.visible !== false;

    if (!isProjectsLayerVisible && !isBoundariesLayerVisible) return;

    // Use clustering at wider zoom levels (zoom < 9) when no single project is active
    const useClustering = currentZoom < 9 && !selectedProject;

    if (useClustering && isProjectsLayerVisible) {
      const clusters = calculateClusters(projects, 45);

      clusters.forEach(cluster => {
        if (cluster.projects.length === 1) {
          const p = cluster.projects[0];
          const isSelected = selectedProject?.id === p.id;
          const score = p.risk?.score ?? 50;
          // Beyond 1:1M scale, do not show numerical score text on marker
          const icon = createRiskMarkerIcon(p.risk?.level || 'MEDIUM', isSelected, score, isScaleWithinOneMillion);
          const marker = L.marker([p.latitude, p.longitude], { icon });

          marker.on('click', () => onSelectProject(p));

          const theme = getRiskTheme(p.risk?.level || 'MEDIUM');
          marker.bindTooltip(
            `
            <div class="p-2 min-w-[190px] text-xs font-sans">
              <div class="flex items-center justify-between gap-2 mb-1">
                <span class="font-bold text-slate-900 truncate max-w-[130px]">${p.name}</span>
                <span class="px-1.5 py-0.5 rounded font-mono font-bold text-[10px] text-white" style="background-color: ${theme.hex};">
                  ${score}/100
                </span>
              </div>
              <div class="text-[11px] text-slate-600">${p.district}, ${p.state}</div>
              <div class="text-[10px] text-blue-600 font-semibold mt-1">Click to view project intelligence &rarr;</div>
            </div>
            `,
            { direction: 'top', offset: [0, -12] }
          );

          clusterLayerRef.current?.addLayer(marker);
        } else {
          // Multi-project cluster
          const icon = createClusterIcon(cluster);
          const marker = L.marker([cluster.centerLat, cluster.centerLng], { icon });

          marker.on('click', () => {
            // Check if projects in the cluster are at identical coordinates
            const allSameCoords = cluster.projects.every(
              p =>
                Math.abs(p.latitude - cluster.centerLat) < 0.001 &&
                Math.abs(p.longitude - cluster.centerLng) < 0.001
            );

            if (allSameCoords || currentZoom >= 13) {
              // Open modal list of clustered projects
              setActiveClusterModal(cluster);
            } else {
              // Zoom into the cluster smoothly
              const nextZoom = Math.min(currentZoom + 3, 12);
              mapInstanceRef.current?.flyTo([cluster.centerLat, cluster.centerLng], nextZoom, {
                duration: 1.0,
              });
            }
          });

          marker.bindTooltip(
            `
            <div class="p-2.5 text-xs font-sans min-w-[200px]">
              <div class="font-bold text-slate-900 mb-1 flex items-center justify-between">
                <span>${cluster.projects.length} Corridors Cluster</span>
                <span class="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 font-bold">Avg ${cluster.avgScore}/100</span>
              </div>
              <div class="text-[11px] text-slate-600 mb-1.5">Highest Risk: <strong class="text-rose-600">${cluster.maxLevel.replace('_', ' ')}</strong></div>
              <div class="text-[10px] text-blue-600 font-semibold border-t border-slate-100 pt-1">
                Click to zoom in or inspect cluster &rarr;
              </div>
            </div>
            `,
            { direction: 'top', offset: [0, -16] }
          );

          clusterLayerRef.current?.addLayer(marker);
        }
      });
    } else {
      // Detailed Zoom (Zoom >= 9) or active selection: Render individual projects & boundaries
      projects.forEach((project, idx) => {
        if (!isValidCoordinate(project.latitude, project.longitude)) return;

        const isSelected = selectedProject?.id === project.id;
        const theme = getRiskTheme(project.risk?.level || 'MEDIUM');
        const score = project.risk?.score ?? 50;

        // Render project marker if project layer is active
        if (isProjectsLayerVisible) {
          const icon = createRiskMarkerIcon(
            project.risk?.level || 'MEDIUM',
            isSelected,
            score,
            isScaleWithinOneMillion
          );
          const marker = L.marker([project.latitude, project.longitude], { icon });

          marker.on('click', () => {
            onSelectProject(project);
          });

          const tooltipContent = `
            <div class="p-2.5 min-w-[220px] max-w-[260px] text-xs font-sans">
              <div class="flex items-center justify-between gap-2 mb-1.5">
                <span class="font-bold text-slate-900 truncate flex-1">${project.name}</span>
                <span class="px-1.5 py-0.5 rounded font-mono font-bold text-[10px] text-white shrink-0" style="background-color: ${theme.hex};">
                  ${score}/100
                </span>
              </div>
              <div class="text-[11px] text-slate-600 flex items-center justify-between mb-1">
                <span>${project.district}, ${project.state}</span>
                <span class="font-semibold text-slate-800">${project.acquisitionProgressPct}% Acquired</span>
              </div>
              <div class="pt-1.5 border-t border-slate-200 flex items-center justify-between text-[10px]">
                <span class="text-amber-700 font-medium">Est. Delay: ~${project.risk?.estimatedDelayMonths || 0} mo</span>
                <span class="text-rose-600 font-semibold">${project.legalIssues?.length || 0} stays</span>
              </div>
              <div class="mt-1 text-[10px] text-blue-600 font-medium text-right">
                Click to inspect full panel &rarr;
              </div>
            </div>
          `;

          marker.bindTooltip(tooltipContent, {
            direction: 'top',
            offset: [0, -16],
            className:
              'custom-leaflet-tooltip shadow-xl rounded-xl border border-slate-200 bg-white/95 backdrop-blur',
          });

          projectMarkersLayerRef.current?.addLayer(marker);
        }

        // Render Project Acquisition Boundaries (Polygons) if boundaries layer is active
        if (isBoundariesLayerVisible && project.boundaryGeoJson && project.boundaryGeoJson.geometry) {
          try {
            const geoJsonLayer = L.geoJSON(project.boundaryGeoJson as any, {
              style: {
                color: theme.strokeHex,
                weight: isSelected ? 3.5 : 2,
                opacity: isSelected ? 0.95 : 0.85,
                fillColor: theme.hex,
                fillOpacity: isSelected ? 0.42 : 0.22,
                dashArray: isSelected ? undefined : '5, 5',
              },
            });

            geoJsonLayer.on('click', () => {
              onSelectProject(project);
            });

            geoJsonLayer.bindTooltip(
              `
              <div class="p-1.5 text-xs font-sans">
                <span class="text-[10px] font-bold uppercase tracking-wider text-slate-500">Project Land RoW Boundary</span>
                <div class="font-bold text-slate-900">${project.name}</div>
                <div class="text-[11px] text-slate-600 font-mono">${project.landRequiredAcres} Acres Required &bull; ${project.acquisitionProgressPct}% Cleared</div>
              </div>
              `,
              { direction: 'center', permanent: false }
            );

            projectPolygonsLayerRef.current?.addLayer(geoJsonLayer);
          } catch (err) {
            console.warn('Invalid boundary GeoJSON for project:', project.id, err);
          }
        }
      });
    }
  }, [projects, selectedProject, layers, currentZoom, isScaleWithinOneMillion, createRiskMarkerIcon, createClusterIcon, onSelectProject]);

  // 6. Fly to Selected Project
  const prevSelectedIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (!mapInstanceRef.current || !selectedProject) return;
    if (prevSelectedIdRef.current === selectedProject.id) return;
    if (!isValidCoordinate(selectedProject.latitude, selectedProject.longitude)) return;

    prevSelectedIdRef.current = selectedProject.id;
    try {
      mapInstanceRef.current.flyTo([selectedProject.latitude, selectedProject.longitude], 11, {
        duration: 1.2,
        easeLinearity: 0.25,
      });
    } catch (err) {
      console.warn('Map flyTo failed:', err);
    }
  }, [selectedProject]);

  // 7. Render Buffer Radius Circle around selected project
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    if (bufferLayerRef.current) {
      try {
        mapInstanceRef.current.removeLayer(bufferLayerRef.current);
      } catch {
        // ignore
      }
      bufferLayerRef.current = null;
    }

    if (
      selectedProject &&
      bufferRadiusKm &&
      isValidCoordinate(selectedProject.latitude, selectedProject.longitude)
    ) {
      try {
        const radiusMeters = bufferRadiusKm * 1000;
        const circle = L.circle([selectedProject.latitude, selectedProject.longitude], {
          radius: radiusMeters,
          color: '#2563eb',
          weight: 2,
          dashArray: '6, 6',
          fillColor: '#3b82f6',
          fillOpacity: 0.08,
        }).addTo(mapInstanceRef.current);

        circle.bindTooltip(
          `<div class="font-mono text-xs font-semibold text-blue-700 bg-white px-2 py-1 rounded shadow border border-blue-200">${bufferRadiusKm} km Risk Buffer Radius</div>`,
          { permanent: false, direction: 'center' }
        );

        bufferLayerRef.current = circle;
      } catch (err) {
        console.warn('Buffer circle creation failed:', err);
      }
    }
  }, [selectedProject, bufferRadiusKm]);

  // 8. Render Historical Projects Layer
  useEffect(() => {
    if (!mapInstanceRef.current || !historicalLayerRef.current) return;

    historicalLayerRef.current.clearLayers();

    const isHistoricalVisible = layers.find(l => l.id === 'historical')?.visible;
    if (!isHistoricalVisible) return;

    MOCK_HISTORICAL_PROJECTS_GEOJSON.features.forEach(feat => {
      if (!feat.geometry || !Array.isArray(feat.geometry.coordinates)) return;
      const [lng, lat] = feat.geometry.coordinates;
      if (!isValidCoordinate(lat, lng)) return;

      const props = feat.properties;

      const icon = L.divIcon({
        html: `
          <div class="w-6 h-6 rounded-full bg-indigo-600 text-white border-2 border-white shadow-md flex items-center justify-center text-[10px] font-bold font-mono">
            H
          </div>
        `,
        className: 'historical-marker',
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      const marker = L.marker([lat, lng], { icon });

      marker.bindTooltip(
        `
        <div class="p-2 text-xs font-sans min-w-[180px]">
          <div class="font-bold text-slate-900">${props.name}</div>
          <div class="text-slate-600 text-[11px]">${props.type} &bull; Final Delay: <strong>${props.finalDelayMonths} months</strong></div>
          <div class="text-[10px] text-indigo-700 font-semibold mt-1">Precedent Delay Score: ${props.riskScore}/100</div>
        </div>
      `,
        { direction: 'top', offset: [0, -12] }
      );

      historicalLayerRef.current?.addLayer(marker);
    });
  }, [layers]);

  // 9. Render Verified Environmental & Legal GIS Layers
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    Object.values(environmentalLayersRef.current).forEach(layer => {
      try {
        mapInstanceRef.current?.removeLayer(layer);
      } catch {
        // ignore
      }
    });
    environmentalLayersRef.current = {};

    const activeLayers = layers.filter(
      l =>
        l.visible &&
        (l.category === 'environmental' || l.category === 'legal' || l.category === 'administrative' || l.category === 'infrastructure')
    );

    activeLayers.forEach(layerConfig => {
      const matchingFeatures = MOCK_ENVIRONMENTAL_GEOJSON.features.filter(
        f => f.properties.layer === layerConfig.id
      );

      if (matchingFeatures.length === 0) return;

      try {
        const geoJsonLayer = L.geoJSON(
          {
            type: 'FeatureCollection',
            features: matchingFeatures,
          } as any,
          {
            style: {
              color: layerConfig.color,
              fillColor: layerConfig.fillColor || layerConfig.color,
              fillOpacity: layerConfig.opacity ? layerConfig.opacity * 0.4 : 0.3,
              weight: 2,
              dashArray: layerConfig.category === 'legal' ? '4, 4' : undefined,
            },
            onEachFeature: (feature, layer) => {
              layer.on('click', () => {
                if (onInspectFeature) {
                  onInspectFeature(feature);
                }
              });

              layer.bindTooltip(
                `
                <div class="p-2 text-xs font-sans min-w-[200px]">
                  <span class="text-[10px] font-bold uppercase tracking-wider text-slate-500">${feature.properties.type}</span>
                  <div class="font-bold text-slate-900">${feature.properties.name}</div>
                  <div class="text-[11px] text-slate-600">${feature.properties.areaAcres} Acres &bull; ${feature.properties.regulation}</div>
                  <div class="text-[10px] text-slate-500 mt-1 italic">${feature.properties.description}</div>
                </div>
              `,
                { direction: 'center', permanent: false }
              );
            },
          }
        );

        geoJsonLayer.addTo(mapInstanceRef.current!);
        environmentalLayersRef.current[layerConfig.id] = geoJsonLayer;
      } catch (err) {
        console.warn('Failed to render environmental layer:', layerConfig.id, err);
      }
    });
  }, [layers, onInspectFeature]);

  // 10. Render Acquisition Friction Delay Heatmap Layer
  useEffect(() => {
    if (!mapInstanceRef.current || !heatmapLayerRef.current) return;

    heatmapLayerRef.current.clearLayers();

    const isHeatmapVisible = layers.find(l => l.id === 'heatmap')?.visible;
    if (!isHeatmapVisible) return;

    const hotspotCoords = [
      { lat: 23.332, lng: 86.365, radius: 18000, intensity: 0.45, label: 'Purulia Tribal Tenancy Hotspot' },
      { lat: 22.545, lng: 88.425, radius: 14000, intensity: 0.65, label: 'East Kolkata Wetlands Ramsar Buffer' },
      { lat: 22.569, lng: 88.363, radius: 8000, intensity: 0.70, label: 'Bowbazar Soft-Aquifer Subsidence Zone' },
      { lat: 22.721, lng: 88.482, radius: 22000, intensity: 0.55, label: 'Jessore Road Supreme Court Tree Stay' },
      { lat: 22.576, lng: 88.305, radius: 10000, intensity: 0.50, label: 'Kona Expressway Rehabilitation Zone' },
      { lat: 22.18, lng: 88.82, radius: 25000, intensity: 0.65, label: 'Sundarbans Biosphere Buffer Zone' },
    ];

    hotspotCoords.forEach(spot => {
      if (!isValidCoordinate(spot.lat, spot.lng)) return;

      try {
        const circle = L.circle([spot.lat, spot.lng], {
          radius: spot.radius,
          color: '#ef4444',
          fillColor: '#f97316',
          fillOpacity: spot.intensity * 0.35,
          weight: 0,
        });

        circle.bindTooltip(
          `<div class="text-xs font-bold text-red-600">${spot.label}</div>`,
          { direction: 'center' }
        );

        heatmapLayerRef.current?.addLayer(circle);
      } catch {
        // ignore
      }
    });
  }, [layers]);

  // 11. Coordinate Search Execution Handler
  const handleExecuteCoordinateSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setCoordSearchError(null);

    const input = coordSearchInput.trim();
    if (!input) {
      setCoordSearchError('Please enter latitude and longitude coordinates.');
      return;
    }

    // Match patterns: "22.5726, 88.3639", "22.5726 88.3639", "22.5726;88.3639", etc.
    const parts = input.split(/[\s,;]+/).map(p => p.trim()).filter(Boolean);

    if (parts.length !== 2) {
      setCoordSearchError('Invalid format. Please enter coordinates like: 22.5726, 88.3639');
      return;
    }

    const lat = parseFloat(parts[0]);
    const lng = parseFloat(parts[1]);

    if (isNaN(lat) || isNaN(lng) || !isValidCoordinate(lat, lng)) {
      setCoordSearchError('Coordinates out of valid range (-90 to 90 lat, -180 to 180 lng).');
      return;
    }

    // Valid coordinates!
    setSearchedCoords({ lat, lng });

    if (mapInstanceRef.current && searchMarkerLayerRef.current) {
      searchMarkerLayerRef.current.clearLayers();

      // Create search pin icon
      const searchPinIcon = L.divIcon({
        html: `
          <div class="relative flex items-center justify-center cursor-pointer" style="width: 36px; height: 36px;">
            <div class="absolute -inset-2 rounded-full animate-ping opacity-50 bg-blue-600"></div>
            <div class="w-9 h-9 rounded-full bg-blue-600 text-white border-2 border-white shadow-2xl flex items-center justify-center font-bold">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path>
                <circle cx="12" cy="10" r="3"></circle>
              </svg>
            </div>
          </div>
        `,
        className: 'custom-search-marker',
        iconSize: [36, 36],
        iconAnchor: [18, 36],
        popupAnchor: [0, -36],
      });

      const marker = L.marker([lat, lng], { icon: searchPinIcon });

      const popupHtml = `
        <div class="p-2.5 text-xs font-sans min-w-[210px]">
          <div class="font-bold text-slate-900 mb-1 flex items-center gap-1.5">
            <span class="w-2 h-2 rounded-full bg-blue-600"></span>
            <span>Geographic Coordinate Pin</span>
          </div>
          <div class="font-mono text-slate-700 bg-slate-100 p-1.5 rounded text-[11px] mb-2 font-semibold">
            ${lat.toFixed(5)}° N, ${lng.toFixed(5)}° E
          </div>
          <div class="text-[10px] text-slate-500">
            Latitude: ${lat}<br/>Longitude: ${lng}
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml).openPopup();
      searchMarkerLayerRef.current.addLayer(marker);

      mapInstanceRef.current.flyTo([lat, lng], 13, {
        duration: 1.2,
      });
    }
  };

  const handleClearCoordinateSearch = () => {
    setCoordSearchInput('');
    setCoordSearchError(null);
    setSearchedCoords(null);
    if (searchMarkerLayerRef.current) {
      searchMarkerLayerRef.current.clearLayers();
    }
  };

  // Map Navigation Handlers
  const handleZoomIn = () => mapInstanceRef.current?.zoomIn();
  const handleZoomOut = () => mapInstanceRef.current?.zoomOut();

  const handleResetView = () => {
    if (!mapInstanceRef.current) return;

    const validProjects = projects.filter(p => isValidCoordinate(p.latitude, p.longitude));

    if (validProjects.length === 0) {
      mapInstanceRef.current.setView([22.85, 88.25], 8);
      return;
    }

    try {
      const latLngs: [number, number][] = validProjects.map(p => [p.latitude, p.longitude]);
      const bounds = L.latLngBounds(latLngs);

      if (bounds.isValid()) {
        mapInstanceRef.current.fitBounds(bounds, {
          padding: [50, 50],
          maxZoom: 13,
        });
      } else {
        mapInstanceRef.current.setView([22.85, 88.25], 8);
      }
    } catch {
      mapInstanceRef.current.setView([22.85, 88.25], 8);
    }
  };

  const toggleFullscreen = () => {
    if (!mapContainerRef.current) return;

    if (!isFullscreen) {
      if (mapContainerRef.current.requestFullscreen) {
        mapContainerRef.current.requestFullscreen();
      }
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
      setIsFullscreen(false);
    }
  };

  // Group Layers by Category for clean Layer Manager
  const categorizedLayers = useMemo(() => {
    const projectLayers = layers.filter(
      l => l.category === 'projects' || l.category === 'boundaries' || l.category === 'historical' || l.category === 'legal' || l.category === 'heatmap'
    );
    const envLayers = layers.filter(l => l.category === 'environmental');
    const adminInfraLayers = layers.filter(
      l => l.category === 'administrative' || l.category === 'infrastructure'
    );

    return {
      projects: projectLayers,
      environmental: envLayers,
      adminInfra: adminInfraLayers,
    };
  }, [layers]);

  const displayedLayersList = useMemo(() => {
    if (layerFilterTab === 'PROJECTS') return categorizedLayers.projects;
    if (layerFilterTab === 'ENVIRONMENT') return categorizedLayers.environmental;
    if (layerFilterTab === 'ADMIN_INFRA') return categorizedLayers.adminInfra;
    return layers;
  }, [layerFilterTab, categorizedLayers, layers]);

  return (
    <div className="relative w-full h-full min-w-0 min-h-0 bg-slate-100 dark:bg-slate-950 select-none overflow-hidden font-sans">
      {/* Leaflet DOM Anchor */}
      <div ref={mapContainerRef} className="w-full h-full min-w-0 min-h-0 z-0" />

      {/* Top-Left: Map-Specific Coordinate Search Bar */}
      <div className="absolute top-4 left-4 z-20 flex flex-col gap-1.5 max-w-[calc(100vw-32px)] sm:max-w-sm">
        <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg p-1.5 flex items-center gap-1.5">
          <div className="p-1.5 text-blue-600 dark:text-blue-400">
            <Search className="w-4 h-4" />
          </div>
          <form onSubmit={handleExecuteCoordinateSearch} className="flex-1 flex items-center min-w-0">
            <input
              id="input-map-coordinate-search"
              type="text"
              value={coordSearchInput}
              onChange={e => {
                setCoordSearchInput(e.target.value);
                if (coordSearchError) setCoordSearchError(null);
              }}
              placeholder="Enter Lat, Lng (e.g. 22.5726, 88.3639)"
              className="w-full bg-transparent text-slate-800 dark:text-slate-100 placeholder-slate-400 text-xs focus:outline-none font-mono py-1 px-1 truncate"
            />
            {coordSearchInput && (
              <button
                type="button"
                onClick={handleClearCoordinateSearch}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                title="Clear coordinate input"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              type="submit"
              className="ml-1 px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shrink-0 transition-all shadow-sm flex items-center gap-1"
            >
              <span>Go</span>
            </button>
          </form>
        </div>

        {/* Coordinate Validation Error Message */}
        {coordSearchError && (
          <div className="bg-rose-50 dark:bg-rose-950/90 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs px-3 py-1.5 rounded-lg shadow-md flex items-center justify-between gap-2 animate-in fade-in duration-150">
            <div className="flex items-center gap-1.5 min-w-0">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-rose-500" />
              <span className="truncate">{coordSearchError}</span>
            </div>
            <button onClick={() => setCoordSearchError(null)} className="shrink-0 text-rose-500 hover:text-rose-700">
              <X className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* Active Coordinate Search Badge */}
        {searchedCoords && !coordSearchError && (
          <div className="bg-blue-50 dark:bg-blue-950/90 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-[11px] px-3 py-1 rounded-lg shadow-md flex items-center justify-between gap-2">
            <span className="font-mono truncate">
              Pin at {searchedCoords.lat.toFixed(4)}°, {searchedCoords.lng.toFixed(4)}°
            </span>
            <button
              onClick={handleClearCoordinateSearch}
              className="text-blue-500 hover:text-blue-700 font-semibold text-[10px] uppercase underline ml-1 shrink-0"
            >
              Remove
            </button>
          </div>
        )}
      </div>

      {/* Floating Map Controls (Top-Right) */}
      <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
        {/* Layer Switcher Button */}
        <div className="relative">
          <button
            id="btn-gis-layers"
            onClick={() => setShowLayerMenu(!showLayerMenu)}
            className={`p-2.5 rounded-xl shadow-lg border backdrop-blur-md transition-all flex items-center gap-2 text-xs font-semibold ${
              showLayerMenu
                ? 'bg-blue-600 text-white border-blue-500 shadow-blue-500/30'
                : 'bg-white/95 dark:bg-slate-900/90 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
            title="Toggle Spatial GIS Layers & Basemaps"
          >
            <Layers className="w-4 h-4" />
            <span className="hidden sm:inline">GIS Layers</span>
          </button>

          {/* Layer Menu Dropdown */}
          {showLayerMenu && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl p-3.5 text-xs z-30 animate-in fade-in zoom-in-95 duration-150">
              {/* Header */}
              <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
                  <Layers className="w-4 h-4 text-blue-500" />
                  <span>LandIntel GIS Layer Control</span>
                </div>
                <button
                  onClick={() => setShowLayerMenu(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* 1. Base Map Mode Selector */}
              <div className="mb-3">
                <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1.5">
                  Geographic Basemap Mode
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {(
                    [
                      { id: 'CLEAN_LIGHT', label: 'Clean Light (Default)', icon: Sun },
                      { id: 'OPEN_STANDARD', label: 'Open Standard', icon: Globe },
                      { id: 'SATELLITE', label: 'Satellite Imagery', icon: MapIcon },
                      { id: 'NATURAL_GREENERY', label: 'Natural / Greenery', icon: Trees },
                    ] as const
                  ).map(mode => {
                    const Icon = mode.icon;
                    const isCurrent = mapMode === mode.id;
                    return (
                      <button
                        key={mode.id}
                        type="button"
                        onClick={() => setMapMode(mode.id)}
                        className={`flex items-center gap-1.5 p-2 rounded-lg text-left transition-all border ${
                          isCurrent
                            ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-500 text-blue-700 dark:text-blue-300 font-semibold'
                            : 'bg-slate-50 dark:bg-slate-800/50 border-transparent text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        <Icon className={`w-3.5 h-3.5 shrink-0 ${isCurrent ? 'text-blue-600' : 'text-slate-400'}`} />
                        <span className="text-[11px] truncate">{mode.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Layer Filter Tabs */}
              <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-lg mb-2.5">
                {[
                  { id: 'ALL', label: 'All Layers' },
                  { id: 'PROJECTS', label: 'Projects' },
                  { id: 'ENVIRONMENT', label: 'Natural' },
                  { id: 'ADMIN_INFRA', label: 'Boundaries' },
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setLayerFilterTab(tab.id as any)}
                    className={`flex-1 py-1 text-[10px] font-semibold rounded-md transition-all text-center ${
                      layerFilterTab === tab.id
                        ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* 3. Layers List */}
              <div className="space-y-1.5 max-h-64 overflow-y-auto custom-scrollbar pr-1">
                {displayedLayersList.map(layer => (
                  <label
                    key={layer.id}
                    className="flex items-start gap-2.5 p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-800"
                  >
                    <input
                      type="checkbox"
                      checked={layer.visible}
                      onChange={() => onToggleLayer(layer.id)}
                      className="mt-0.5 rounded border-slate-300 dark:border-slate-700 text-blue-600 focus:ring-blue-500 bg-white dark:bg-slate-800"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-medium text-slate-800 dark:text-slate-200 text-xs truncate">
                          {layer.name}
                        </span>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {layer.isAvailable ? (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 font-mono font-medium">
                              {layer.featureCount} Features
                            </span>
                          ) : (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 font-mono font-medium">
                              API Ready
                            </span>
                          )}
                          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: layer.color }} />
                        </div>
                      </div>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight mt-0.5">
                        {layer.description}
                      </p>
                      {layer.sourceLabel && (
                        <span className="text-[9px] text-slate-400 dark:text-slate-500 font-mono block mt-0.5">
                          Source: {layer.sourceLabel}
                        </span>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Zoom & View Controls */}
        <div className="bg-white/95 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg flex flex-col divide-y divide-slate-200 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
          <button
            id="btn-map-zoom-in"
            onClick={handleZoomIn}
            className="p-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            id="btn-map-zoom-out"
            onClick={handleZoomOut}
            className="p-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            id="btn-map-reset-view"
            onClick={handleResetView}
            className="p-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors"
            title="Fit All Regional Corridor Bounds"
          >
            <Navigation className="w-4 h-4" />
          </button>
          <button
            id="btn-map-fullscreen"
            onClick={toggleFullscreen}
            className="p-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Floating 5-Tier Legend (Bottom-Right) */}
      <div className="absolute bottom-6 right-4 z-20 bg-white/95 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-xl p-3 shadow-xl hidden md:block max-w-xs">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            5-Tier Risk & Delay Index
          </span>
          <span className="text-[9px] font-mono text-slate-400">
            {isScaleWithinOneMillion ? 'Detailed View' : '< 1:1M Overview'}
          </span>
        </div>
        <div className="grid grid-cols-1 gap-1.5 text-xs font-medium">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-600 shadow-sm shadow-red-500/50"></span>
            <span className="text-slate-700 dark:text-slate-300">Critical Delay (85–100)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-sm shadow-rose-500/50"></span>
            <span className="text-slate-700 dark:text-slate-300">High Risk (70–84)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-sm shadow-amber-500/50"></span>
            <span className="text-slate-700 dark:text-slate-300">Moderate Risk (46–69)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-sm shadow-blue-500/50"></span>
            <span className="text-slate-700 dark:text-slate-300">Lower Risk (25–45)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50"></span>
            <span className="text-slate-700 dark:text-slate-300">On Schedule (0–24)</span>
          </div>
        </div>
      </div>

      {/* Scale & Active Mode Status Bar (Bottom-Left) */}
      <div className="absolute bottom-6 left-4 z-20 bg-white/95 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 shadow-xl flex items-center gap-3 text-[11px] text-slate-700 dark:text-slate-300 font-mono">
        <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
          <Compass className="w-3.5 h-3.5 text-blue-500" />
          <span>Zoom: {currentZoom}</span>
        </div>
        <div className="w-px h-3 bg-slate-200 dark:bg-slate-800" />
        <span className="text-slate-700 dark:text-slate-300 font-sans">
          Mode: <strong>{BASEMAP_TILES[mapMode].name}</strong>
        </span>
        <div className="w-px h-3 bg-slate-200 dark:bg-slate-800" />
        <span className="text-slate-700 dark:text-slate-300">
          {projects.length} Corridors
        </span>
        {selectedProject && (
          <>
            <div className="w-px h-3 bg-slate-200 dark:bg-slate-800" />
            <span className="text-blue-600 dark:text-blue-400 font-semibold truncate max-w-[180px]">
              {selectedProject.name}
            </span>
          </>
        )}
      </div>

      {/* Interactive Cluster Inspection Modal (for dense co-located corridors) */}
      {activeClusterModal && (
        <div className="absolute inset-0 z-40 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-md w-full p-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                  Clustered Infrastructure Corridors ({activeClusterModal.projects.length})
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Multiple infrastructure projects in close spatial proximity
                </p>
              </div>
              <button
                onClick={() => setActiveClusterModal(null)}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-72 overflow-y-auto custom-scrollbar my-2">
              {activeClusterModal.projects.map(proj => {
                const theme = getRiskTheme(proj.risk?.level || 'MEDIUM');
                return (
                  <button
                    key={proj.id}
                    onClick={() => {
                      onSelectProject(proj);
                      setActiveClusterModal(null);
                    }}
                    className="w-full p-3 text-left hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors flex items-center justify-between gap-3 group rounded-xl"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-slate-900 dark:text-slate-100 text-xs group-hover:text-blue-600 dark:group-hover:text-blue-400 truncate">
                        {proj.name}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-2">
                        <span>{proj.district}, {proj.state}</span>
                        <span>&bull;</span>
                        <span>{proj.acquisitionProgressPct}% Acquired</span>
                      </div>
                    </div>
                    <div
                      className="px-2 py-1 rounded-md text-white font-mono font-bold text-xs shrink-0"
                      style={{ backgroundColor: theme.hex }}
                    >
                      {proj.risk?.score ?? 50}/100
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setActiveClusterModal(null)}
                className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
