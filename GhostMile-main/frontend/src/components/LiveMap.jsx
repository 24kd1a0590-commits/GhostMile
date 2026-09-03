import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Navigation, Compass, MapPin, Gauge, Radio, AlertTriangle } from 'lucide-react';
import { api } from '../services/api';

export default function LiveMap({ shipmentId, origin, destination, isDriver = false, isDemoMode = true }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const driverMarkerRef = useRef(null);
  const polylineRef = useRef(null);

  const [speedKmh, setSpeedKmh] = useState(42);
  const [etaMins, setEtaMins] = useState(25);
  const [distanceKm, setDistanceKm] = useState(18.4);
  const [useRealGps, setUseRealGps] = useState(false);
  const [gpsError, setGpsError] = useState(null);
  const [trackingMode, setTrackingMode] = useState(isDemoMode ? 'DEMO TRACKING' : 'LIVE GPS TRACKING');

  const startLat = origin?.lat || origin?.pickup_coordinates?.lat || 12.9716;
  const startLng = origin?.lng || origin?.pickup_coordinates?.lng || 77.5946;
  const destLat = destination?.lat || destination?.destination_coordinates?.lat || 12.5218;
  const destLng = destination?.lng || destination?.destination_coordinates?.lng || 76.8951;

  // Initialize Leaflet Map safely
  useEffect(() => {
    if (!mapRef.current) return;
    
    // Clean up any existing map instance on container re-render
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const truckIcon = L.divIcon({
      className: 'custom-truck-marker',
      html: `
        <div style="background-color: #16a34a; border: 3px solid #ffffff; width: 40px; height: 40px; border-radius: 50%; display: flex; items-center; justify-content: center; box-shadow: 0 4px 14px rgba(0,0,0,0.6); font-size: 20px;">
          🚚
        </div>
      `,
      iconSize: [40, 40],
      iconAnchor: [20, 20]
    });

    const destinationIcon = L.divIcon({
      className: 'custom-dest-marker',
      html: `
        <div style="background-color: #ef4444; border: 3px solid #ffffff; width: 34px; height: 34px; border-radius: 50%; display: flex; items-center; justify-content: center; box-shadow: 0 4px 14px rgba(0,0,0,0.6); font-size: 16px;">
          📍
        </div>
      `,
      iconSize: [34, 34],
      iconAnchor: [17, 17]
    });

    const map = L.map(mapRef.current, {
      center: [startLat, startLng],
      zoom: 11,
      zoomControl: false
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap'
    }).addTo(map);

    const polyline = L.polyline([
      [startLat, startLng],
      [destLat, destLng]
    ], {
      color: '#16a34a',
      weight: 5,
      opacity: 0.85,
      dashArray: '8, 8'
    }).addTo(map);

    polylineRef.current = polyline;

    L.marker([destLat, destLng], { icon: destinationIcon })
      .addTo(map)
      .bindPopup(`<b>${destination?.name || destination?.address_name || 'Destination Hub'}</b>`);

    const driverMarker = L.marker([startLat, startLng], { icon: truckIcon })
      .addTo(map)
      .bindPopup("<b>Driver Truck (RouteNova Live GPS)</b>");

    driverMarkerRef.current = driverMarker;
    mapInstanceRef.current = map;

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [shipmentId]);

  // Request Browser GPS for Driver
  const handleRequestGps = () => {
    if (!("geolocation" in navigator)) {
      setGpsError("Geolocation is not supported by your browser.");
      return;
    }

    setGpsError(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUseRealGps(true);
        setTrackingMode('LIVE GPS TRACKING');
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        if (driverMarkerRef.current) {
          driverMarkerRef.current.setLatLng([lat, lng]);
        }
        if (mapInstanceRef.current) {
          mapInstanceRef.current.panTo([lat, lng]);
        }

        // Send real ping to backend API
        if (shipmentId) {
          api.sendTrackingPing({
            shipment_id: shipmentId,
            lat,
            lng,
            speed_kmh: position.coords.speed ? (position.coords.speed * 3.6) : 40.0,
            is_demo: false
          });
        }
      },
      (err) => {
        setGpsError("GPS permission denied or unavailable. Using DEMO TRACKING mode.");
        setUseRealGps(false);
        setTrackingMode('DEMO TRACKING');
      },
      { enableHighAccuracy: true }
    );
  };

  // Periodic Tracking Update Loop (DEMO vs REAL)
  useEffect(() => {
    let step = 0;
    const totalSteps = 100;

    const interval = setInterval(async () => {
      if (useRealGps && isDriver) {
        navigator.geolocation.getCurrentPosition((pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          if (driverMarkerRef.current) driverMarkerRef.current.setLatLng([lat, lng]);
          
          if (shipmentId) {
            api.sendTrackingPing({
              shipment_id: shipmentId,
              lat,
              lng,
              speed_kmh: pos.coords.speed ? (pos.coords.speed * 3.6) : 42.0,
              is_demo: false
            });
          }
        });
      } else {
        // Simulated Movement for DEMO_MODE or Shipper View
        step = (step + 1) % totalSteps;
        const progress = step / totalSteps;
        const currLat = startLat + (destLat - startLat) * progress;
        const currLng = startLng + (destLng - startLng) * progress;

        if (driverMarkerRef.current) {
          driverMarkerRef.current.setLatLng([currLat, currLng]);
        }

        setSpeedKmh(Math.floor(38 + Math.random() * 8));
        setDistanceKm(Math.max(0.5, (18.4 * (1 - progress)).toFixed(1)));
        setEtaMins(Math.max(1, Math.round(25 * (1 - progress))));

        // Log ping to backend if driver in demo mode
        if (isDriver && shipmentId) {
          api.sendTrackingPing({
            shipment_id: shipmentId,
            lat: currLat,
            lng: currLng,
            speed_kmh: 40.0,
            is_demo: true
          });
        }

        // If shipper view, fetch latest state from API
        if (!isDriver && shipmentId) {
          try {
            const state = await api.getTrackingState(shipmentId);
            setDistanceKm(state.distance_remaining_km);
            setEtaMins(state.eta_minutes);
            setSpeedKmh(state.speed_kmh);
            setTrackingMode(state.is_demo ? 'DEMO TRACKING' : 'LIVE GPS TRACKING');
          } catch (e) {}
        }
      }
    }, 2500);

    return () => clearInterval(interval);
  }, [useRealGps, isDriver, shipmentId]);

  return (
    <div className="relative w-full h-full">
      
      {/* Map DOM Element */}
      <div ref={mapRef} className="w-full h-full" />

      {/* Floating HUD overlay */}
      <div className="absolute top-4 left-4 right-4 z-[1000] flex flex-col sm:flex-row items-center justify-between gap-3 pointer-events-none">
        
        <div className="bg-slate-950/90 border border-slate-800 p-3.5 rounded-2xl backdrop-blur-md pointer-events-auto flex items-center gap-4 text-xs shadow-2xl">
          <div className="flex items-center gap-2">
            <Gauge className="w-4 h-4 text-emerald-400" />
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase">Speed</p>
              <p className="font-black text-white">{speedKmh} km/h</p>
            </div>
          </div>

          <div className="w-px h-8 bg-slate-800"></div>

          <div className="flex items-center gap-2">
            <Compass className="w-4 h-4 text-blue-400" />
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase">Dist Rem.</p>
              <p className="font-black text-white">{distanceKm} km</p>
            </div>
          </div>

          <div className="w-px h-8 bg-slate-800"></div>

          <div className="flex items-center gap-2">
            <Navigation className="w-4 h-4 text-amber-400" />
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase">ETA</p>
              <p className="font-black text-emerald-400 font-extrabold">{etaMins} mins</p>
            </div>
          </div>
        </div>

        {/* Mode Indicator & Driver GPS Request */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {isDriver && !useRealGps && (
            <button
              onClick={handleRequestGps}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-[10px] px-3 py-2 rounded-full shadow-lg transition-all flex items-center gap-1.5"
            >
              <Radio className="w-3.5 h-3.5 animate-pulse" /> Enable Real GPS
            </button>
          )}

          <div className={`px-3 py-1.5 rounded-full backdrop-blur-md flex items-center gap-2 text-[10px] font-black uppercase tracking-wider border shadow-lg ${
            trackingMode.includes('LIVE') ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
          }`}>
            <span className={`w-2 h-2 rounded-full ${trackingMode.includes('LIVE') ? 'bg-emerald-400 animate-ping' : 'bg-amber-400 animate-pulse'}`}></span>
            <span>{trackingMode}</span>
          </div>
        </div>

      </div>

      {gpsError && (
        <div className="absolute bottom-4 left-4 right-4 z-[1000] bg-amber-950/90 border border-amber-500/40 text-amber-300 text-xs p-3 rounded-2xl flex items-center justify-between pointer-events-auto shadow-2xl">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <span>{gpsError}</span>
          </div>
          <button onClick={() => setGpsError(null)} className="text-amber-400 font-bold hover:text-white text-xs">
            Dismiss
          </button>
        </div>
      )}

    </div>
  );
}
