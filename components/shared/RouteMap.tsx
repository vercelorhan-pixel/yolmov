/**
 * ============================================
 * RouteMap Component (React-Leaflet)
 * ============================================
 * 
 * Özellikler:
 * - İnteraktif harita (pin sürükleme)
 * - Başlangıç/Bitiş marker'ları
 * - Rota çizgisi (polyline)
 * - Otomatik zoom/center ayarlama
 * - Touch-friendly (mobil uyumlu)
 */

import React, { useEffect, useRef, useState } from 'react';
import type { Coordinates, LocationPoint, RouteData } from '../../types';

// NOT: Leaflet CSS ve kütüphaneleri package.json'a eklendikten sonra
// bu import'lar aktif edilecek. Şimdilik placeholder.

interface RouteMapProps {
  startLocation: LocationPoint | null;
  endLocation: LocationPoint | null;
  route: RouteData | null;
  onStartChange?: (location: LocationPoint) => void;
  onEndChange?: (location: LocationPoint) => void;
  height?: string;
  className?: string;
}

/**
 * PLACEHOLDER COMPONENT
 * 
 * react-leaflet kurulumundan sonra gerçek implementasyon aktif edilecek.
 * Şimdilik basit harita gösterimi.
 */
export function RouteMap({
  startLocation,
  endLocation,
  route,
  onStartChange,
  onEndChange,
  height = '400px',
  className = ''
}: RouteMapProps) {
  return (
    <div 
      className={`bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl border-2 border-blue-200 flex items-center justify-center ${className}`}
      style={{ height }}
    >
      <div className="text-center p-8">
        <div className="text-6xl mb-4">🗺️</div>
        <h3 className="text-xl font-bold text-slate-700 mb-2">
          Harita Modülü
        </h3>
        <p className="text-sm text-slate-500 max-w-md">
          React-Leaflet entegrasyonu tamamlandıktan sonra buraya
          interaktif harita yüklenecek.
        </p>
        
        {startLocation && (
          <div className="mt-4 p-3 bg-white/70 rounded-lg text-left">
            <p className="text-xs font-bold text-green-700">📍 Başlangıç</p>
            <p className="text-sm text-slate-700">{startLocation.address || 'Konum seçildi'}</p>
            <p className="text-xs text-slate-500">
              {startLocation.coords.latitude.toFixed(6)}, {startLocation.coords.longitude.toFixed(6)}
            </p>
          </div>
        )}
        
        {endLocation && (
          <div className="mt-2 p-3 bg-white/70 rounded-lg text-left">
            <p className="text-xs font-bold text-red-700">🏁 Bitiş</p>
            <p className="text-sm text-slate-700">{endLocation.address || 'Konum seçildi'}</p>
            <p className="text-xs text-slate-500">
              {endLocation.coords.latitude.toFixed(6)}, {endLocation.coords.longitude.toFixed(6)}
            </p>
          </div>
        )}
        
        {route && (
          <div className="mt-2 p-3 bg-blue-50 rounded-lg">
            <p className="text-xs font-bold text-blue-700">🛣️ Rota Bilgisi</p>
            <p className="text-sm text-blue-900">
              {route.distance} KM • {Math.round(route.duration / 60)} dakika
            </p>
            {route.fromCache && (
              <span className="text-xs text-blue-600">⚡ Cache'den yüklendi</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * ============================================
 * GERÇEK REACT-LEAFLET IMPLEMENTATION
 * ============================================
 * 
 * Aşağıdaki kod react-leaflet kurulumundan sonra aktif edilecek:
 */

/*
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Custom marker icons
const startIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const endIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Auto-fit bounds component
function AutoFitBounds({ 
  start, 
  end 
}: { 
  start: Coordinates | null; 
  end: Coordinates | null 
}) {
  const map = useMap();
  
  useEffect(() => {
    if (start && end) {
      const bounds = L.latLngBounds(
        [start.latitude, start.longitude],
        [end.latitude, end.longitude]
      );
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [start, end, map]);
  
  return null;
}

export function RouteMap({
  startLocation,
  endLocation,
  route,
  onStartChange,
  onEndChange,
  height = '400px',
  className = ''
}: RouteMapProps) {
  const [center, setCenter] = useState<[number, number]>([39.9334, 32.8597]); // Ankara default
  
  // Başlangıç konumu varsa merkezi ayarla
  useEffect(() => {
    if (startLocation) {
      setCenter([startLocation.coords.latitude, startLocation.coords.longitude]);
    }
  }, [startLocation]);
  
  return (
    <div className={className} style={{ height }}>
      <MapContainer
        center={center}
        zoom={13}
        style={{ height: '100%', width: '100%', borderRadius: '1rem' }}
        className="z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {startLocation && (
          <Marker
            position={[startLocation.coords.latitude, startLocation.coords.longitude]}
            icon={startIcon}
            draggable={!!onStartChange}
            eventHandlers={{
              dragend: (e) => {
                if (onStartChange) {
                  const newPos = e.target.getLatLng();
                  onStartChange({
                    coords: { latitude: newPos.lat, longitude: newPos.lng },
                    address: startLocation.address,
                    name: 'Başlangıç'
                  });
                }
              }
            }}
          />
        )}
        
        {endLocation && (
          <Marker
            position={[endLocation.coords.latitude, endLocation.coords.longitude]}
            icon={endIcon}
            draggable={!!onEndChange}
            eventHandlers={{
              dragend: (e) => {
                if (onEndChange) {
                  const newPos = e.target.getLatLng();
                  onEndChange({
                    coords: { latitude: newPos.lat, longitude: newPos.lng },
                    address: endLocation.address,
                    name: 'Bitiş'
                  });
                }
              }
            }}
          />
        )}
        
        {route && route.geometry && route.geometry.length > 0 && (
          <Polyline
            positions={route.geometry}
            color="#3B82F6"
            weight={4}
            opacity={0.7}
          />
        )}
        
        <AutoFitBounds 
          start={startLocation?.coords || null} 
          end={endLocation?.coords || null} 
        />
      </MapContainer>
    </div>
  );
}
*/

// ============================================
// EXPORT DEFAULT
// ============================================

export default RouteMap;
