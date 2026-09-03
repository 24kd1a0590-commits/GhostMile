import React, { useState, useEffect } from 'react';
import { Truck, MapPin, CheckCircle2, ShieldCheck, Fuel, Leaf, DollarSign, Sparkles, Navigation, AlertTriangle, ArrowRight, Package, ArrowUpDown, Cpu, Route } from 'lucide-react';
import confetti from 'canvas-confetti';
import LiveMap from './LiveMap';
import ProofModal from './ProofModal';
import { api } from '../services/api';

export default function DriverDashboard({ user, shipments, onRefreshShipments }) {
  const [destination, setDestination] = useState('Mandya APMC Market, Karnataka');
  const [selectedBundles, setSelectedBundles] = useState([]);
  const [activeTab, setActiveTab] = useState('recommended');
  const [activeStep, setActiveStep] = useState('matches');
  const [activeShipment, setActiveShipment] = useState(null);
  
  const [matches, setMatches] = useState([]);
  const [sortBy, setSortBy] = useState('match_score');
  const [loadingMatches, setLoadingMatches] = useState(false);

  const MAX_CAPACITY = user?.vehicle_capacity_kg || 500;
  const totalWeight = selectedBundles.reduce((sum, s) => sum + (s.weight || s.weight_kg || 0), 0);
  const totalEarningsINR = selectedBundles.reduce((sum, s) => sum + (s.offered_price || s.offered_price_inr || 0), 0);
  const capacityPct = Math.min(100, Math.round((totalWeight / MAX_CAPACITY) * 100));

  const fuelSavedLiters = selectedBundles.reduce((sum, s) => sum + (s.fuel_saved_liters || 1.4), 0).toFixed(1);
  const co2PreventedKg = selectedBundles.reduce((sum, s) => sum + (s.co2_saved_kg || 3.75), 0).toFixed(1);

  useEffect(() => {
    fetchRecommendedMatches();
  }, [shipments, sortBy, destination]);

  const fetchRecommendedMatches = async () => {
    setLoadingMatches(true);
    try {
      const matchData = await api.getRecommendedMatches({
        sort_by: sortBy,
        curr_lat: 12.9716,
        curr_lng: 77.5946,
        dest_lat: 12.5218,
        dest_lng: 76.8951,
        available_capacity: MAX_CAPACITY - totalWeight,
        truck_capacity: MAX_CAPACITY
      });
      setMatches(matchData);
    } catch (e) {
      console.warn("Match engine API error", e);
    } finally {
      setLoadingMatches(false);
    }
  };

  const toggleSelectBundle = (shipment) => {
    const isSelected = selectedBundles.some(b => b.id === shipment.id);
    const shpWeight = shipment.weight || shipment.weight_kg || 50;

    if (isSelected) {
      setSelectedBundles(selectedBundles.filter(b => b.id !== shipment.id));
    } else {
      if (totalWeight + shpWeight > MAX_CAPACITY) {
        alert("⚠️ TRUCK OVERLOAD: Payload weight exceeds remaining truck capacity limit!");
        return;
      }
      setSelectedBundles([...selectedBundles, shipment]);
    }
  };

  const handleLockEscrowAndStart = async () => {
    if (selectedBundles.length === 0) return;

    try {
      for (const item of selectedBundles) {
        await api.acceptShipment(item.id);
      }

      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#16a34a', '#2563eb', '#fbbf24']
      });

      setActiveShipment(selectedBundles[0]);
      setTimeout(() => {
        setActiveStep('map');
        if (onRefreshShipments) onRefreshShipments();
      }, 800);
    } catch (err) {
      alert(err.message || 'Failed to accept shipments via API');
    }
  };

  const handleArrivedAtDestination = async () => {
    if (activeShipment) {
      try {
        await api.updateShipment(activeShipment.id, { status: 'ARRIVED' });
      } catch (e) {}
    }
    setActiveStep('proof');
  };

  const handleProofComplete = async () => {
    if (activeShipment) {
      try {
        await api.releasePayment(activeShipment.id);
      } catch (e) {}
    }
    setActiveStep('completed');
  };

  const availableShipments = shipments.filter(s => s.status === 'AVAILABLE');
  const activeDeliveries = shipments.filter(s => ['ACCEPTED', 'PICKED_UP', 'IN_TRANSIT', 'ARRIVED'].includes(s.status));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 py-6">
      
      {/* Header Banner */}
      <div className="glass-card p-6 sm:p-8 rounded-3xl border border-emerald-500/20 relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold uppercase mb-2">
              <Cpu className="w-3.5 h-3.5" /> RouteNova Smart Matching Engine
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white italic">
              Hello, {user?.name || 'Ramesh Kumar'} 🚚
            </h2>
            <p className="text-slate-400 text-xs mt-1">
              Vehicle: {user?.vehicle_type || 'Light Commercial Truck'} ({MAX_CAPACITY}kg Payload Limit)
            </p>
          </div>

          <div className="w-full md:w-auto bg-slate-900 border border-slate-800 p-4 rounded-2xl flex items-center gap-4">
            <MapPin className="w-6 h-6 text-emerald-400 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase">Target Destination Corridor</p>
              <input
                type="text"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                className="bg-transparent text-sm font-black text-white focus:outline-none w-full"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Driver Sub-Tabs */}
      {activeStep === 'matches' && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/90 p-2 rounded-2xl border border-slate-800">
          <div className="flex gap-2 overflow-x-auto">
            <button
              onClick={() => setActiveTab('recommended')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === 'recommended' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-white bg-slate-950'
              }`}
            >
              <Sparkles className="w-4 h-4 text-emerald-300" />
              Recommended Matches ({matches.length})
            </button>
            <button
              onClick={() => setActiveTab('available')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === 'available' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-white bg-slate-950'
              }`}
            >
              <Package className="w-4 h-4" />
              Available Shipments ({availableShipments.length})
            </button>
            <button
              onClick={() => setActiveTab('active')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === 'active' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-white bg-slate-950'
              }`}
            >
              <Truck className="w-4 h-4" />
              Active Deliveries ({activeDeliveries.length})
            </button>
          </div>

          {activeTab === 'recommended' && (
            <div className="flex items-center gap-2 px-3 py-1 bg-slate-950 rounded-xl border border-slate-800">
              <ArrowUpDown className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-xs text-slate-400 font-bold">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-transparent text-xs font-bold text-emerald-400 focus:outline-none cursor-pointer"
              >
                <option value="match_score" className="bg-slate-900 text-white">Best Match</option>
                <option value="earnings" className="bg-slate-900 text-white">Highest Earnings</option>
                <option value="detour" className="bg-slate-900 text-white">Lowest Detour</option>
                <option value="priority" className="bg-slate-900 text-white">Highest Priority</option>
              </select>
            </div>
          )}
        </div>
      )}

      {/* STEP 1: MATCHES & BUNDLE OPTIMIZATION */}
      {activeStep === 'matches' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Matches / Available / Active List */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* RECOMMENDED MATCHES TAB */}
            {activeTab === 'recommended' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-black text-white italic">RouteNova Smart Matching Engine</h3>
                    <p className="text-xs text-slate-400">Deterministic scoring (0.35 route + 0.25 capacity + 0.20 distance + 0.10 priority + 0.10 timing)</p>
                  </div>
                  <span className="text-xs text-emerald-400 font-extrabold bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                    Deterministic AI Active
                  </span>
                </div>

                {loadingMatches ? (
                  <div className="glass-card p-12 text-center text-xs text-slate-400 font-bold animate-pulse">
                    Computing deterministic corridor match scores...
                  </div>
                ) : matches.length === 0 ? (
                  <div className="glass-card p-12 text-center text-xs text-slate-400">
                    No available shipments matching current corridor criteria.
                  </div>
                ) : (
                  matches.map((m) => {
                    const shp = m.shipment;
                    const isSelected = selectedBundles.some(b => b.id === shp.id);

                    return (
                      <div
                        key={shp.id}
                        onClick={() => toggleSelectBundle(shp)}
                        className={`glass-card p-6 rounded-3xl border transition-all cursor-pointer hover:scale-[1.01] ${
                          isSelected ? 'border-emerald-500 bg-emerald-950/20 shadow-xl' : 'border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        {/* Card Top Row */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                          <div className="flex items-start gap-3">
                            <div className={`w-5 h-5 rounded-md flex items-center justify-center mt-1 border ${
                              isSelected ? 'bg-emerald-500 border-emerald-400 text-slate-950' : 'border-slate-700 bg-slate-900'
                            }`}>
                              {isSelected && <CheckCircle2 className="w-4 h-4 stroke-[3]" />}
                            </div>
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 text-[10px] font-black rounded uppercase">
                                  #{shp.id}
                                </span>
                                <h4 className="font-extrabold text-white text-lg">{shp.name || shp.title}</h4>
                              </div>
                              <p className="text-xs text-slate-400">
                                {shp.package_type} • Weight: <span className="text-emerald-400 font-bold">{shp.weight || shp.weight_kg}kg</span>
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 self-end sm:self-center">
                            <div className="bg-emerald-500/10 border border-emerald-500/30 px-3.5 py-1.5 rounded-2xl text-right">
                              <p className="text-base font-black text-emerald-400">{m.match_score}% MATCH</p>
                              <p className="text-[10px] font-bold text-emerald-300 uppercase">{m.recommendation}</p>
                            </div>
                          </div>
                        </div>

                        {/* Recommendation Reason */}
                        <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 text-xs text-slate-300 mb-4 flex items-start gap-2 italic">
                          <Sparkles className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                          <span>{m.reason}</span>
                        </div>

                        {/* Match Metrics Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs">
                          <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                            <p className="text-[9px] font-bold text-slate-500 uppercase">Earnings</p>
                            <p className="font-black text-emerald-400">+ ₹{m.estimated_earnings}</p>
                          </div>
                          <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                            <p className="text-[9px] font-bold text-slate-500 uppercase">Detour</p>
                            <p className="font-bold text-blue-400">{m.estimated_detour_km} km detour</p>
                          </div>
                          <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                            <p className="text-[9px] font-bold text-slate-500 uppercase">Capacity</p>
                            <p className="font-bold text-teal-300">{m.capacity_used_pct}% used</p>
                          </div>
                          <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                            <p className="text-[9px] font-bold text-slate-500 uppercase">Fuel Saved</p>
                            <p className="font-bold text-amber-400">{m.fuel_saved_liters} L saved</p>
                          </div>
                          <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 col-span-2 sm:col-span-1">
                            <p className="text-[9px] font-bold text-slate-500 uppercase">CO₂ Prevented</p>
                            <p className="font-bold text-emerald-300">{m.co2_saved_kg} kg avoided</p>
                          </div>
                        </div>

                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* AVAILABLE SHIPMENTS TAB */}
            {activeTab === 'available' && (
              <div className="space-y-4">
                <h3 className="text-xl font-black text-white italic">All Available Shipments</h3>
                {availableShipments.map((shp) => {
                  const isSelected = selectedBundles.some(b => b.id === shp.id);
                  return (
                    <div
                      key={shp.id}
                      onClick={() => toggleSelectBundle(shp)}
                      className={`glass-card p-6 rounded-3xl border transition-all cursor-pointer ${
                        isSelected ? 'border-emerald-500 bg-emerald-950/20' : 'border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-extrabold text-white text-base">{shp.name || shp.title}</h4>
                          <p className="text-xs text-slate-400">{shp.package_type} • {shp.weight || shp.weight_kg}kg</p>
                        </div>
                        <p className="text-xl font-black text-emerald-400">₹{(shp.offered_price || shp.offered_price_inr).toLocaleString('en-IN')}</p>
                      </div>
                      <div className="text-xs text-slate-300 space-y-1">
                        <p>Pickup: {shp.pickup_location}</p>
                        <p>Destination: {shp.destination}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* ACTIVE DELIVERIES TAB */}
            {activeTab === 'active' && (
              <div className="space-y-4">
                <h3 className="text-xl font-black text-white italic">Active Driver Deliveries</h3>
                {activeDeliveries.length === 0 ? (
                  <div className="glass-card p-8 rounded-3xl text-center text-xs text-slate-400">
                    No active deliveries in transit. Select bundles from recommended matches to start!
                  </div>
                ) : (
                  activeDeliveries.map((shp) => (
                    <div key={shp.id} className="glass-card p-6 rounded-3xl border border-emerald-500/30 space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 text-[10px] font-black rounded uppercase">
                            {shp.status}
                          </span>
                          <h4 className="font-extrabold text-white text-lg mt-1">{shp.name || shp.title}</h4>
                        </div>
                        <button
                          onClick={() => {
                            setActiveShipment(shp);
                            setActiveStep('map');
                          }}
                          className="bg-emerald-600 text-white font-extrabold px-4 py-2 rounded-xl text-xs"
                        >
                          Resume Navigation
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

          </div>

          {/* Right Capacity & Impact Summary Panel */}
          <div className="space-y-6">
            <div className="glass-card p-6 rounded-3xl border border-slate-800 space-y-4">
              <div className="flex justify-between items-center text-xs">
                <span className="font-extrabold uppercase text-slate-300">Payload Capacity</span>
                <span className="font-black text-white">{totalWeight}kg / {MAX_CAPACITY}kg ({capacityPct}%)</span>
              </div>

              <div className="w-full bg-slate-900 h-3 rounded-full overflow-hidden p-0.5 border border-slate-800">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    capacityPct > 85 ? 'bg-amber-500' : 'bg-gradient-to-r from-emerald-500 to-teal-400'
                  }`}
                  style={{ width: `${capacityPct}%` }}
                ></div>
              </div>
            </div>

            {selectedBundles.length > 0 && (
              <div className="bg-slate-900 border border-emerald-500/30 p-6 rounded-3xl space-y-4 shadow-2xl">
                <div className="flex justify-between items-center pb-3 border-b border-slate-800">
                  <h4 className="text-xs font-black uppercase text-emerald-400">Optimization Summary</h4>
                  <span className="text-[10px] font-extrabold bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full">
                    {selectedBundles.length} Bundles Selected
                  </span>
                </div>

                <div className="pt-2">
                  <p className="text-xs text-slate-400 font-bold">Total Additional Earnings:</p>
                  <p className="text-3xl font-black text-emerald-400">₹{totalEarningsINR.toLocaleString('en-IN')}</p>
                </div>

                <button
                  onClick={handleLockEscrowAndStart}
                  className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-slate-950 font-black py-4 rounded-2xl shadow-xl transition-all flex items-center justify-center gap-2 text-sm"
                >
                  <ShieldCheck className="w-5 h-5 stroke-[2.5]" />
                  ACCEPT BUNDLES & START (₹{totalEarningsINR.toLocaleString('en-IN')})
                </button>
              </div>
            )}
          </div>

        </div>
      )}

      {/* STEP 2: LIVE MAP ROUTE TRACKING */}
      {activeStep === 'map' && (
        <div className="space-y-6 animate-fade-in">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-black text-white italic">Live Route Navigation & GPS Tracking</h3>
            <button
              onClick={handleArrivedAtDestination}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-black px-6 py-3 rounded-2xl text-xs shadow-lg transition-all flex items-center gap-2"
            >
              ARRIVED AT UNLOAD SITE <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="h-[450px] rounded-3xl overflow-hidden border-2 border-slate-800 shadow-2xl relative">
            <LiveMap
              origin={{ lat: 12.9716, lng: 77.5946, name: activeShipment?.pickup_location || "KSRTC Pickup" }}
              destination={{ lat: 12.5218, lng: 76.8951, name: activeShipment?.destination || "Mandya APMC Market" }}
              isDemoMoving={true}
            />
          </div>
        </div>
      )}

      {/* STEP 3: DIGITAL PROOF OF DELIVERY & QR VERIFICATION */}
      {activeStep === 'proof' && (
        <ProofModal
          shipment={activeShipment || shipments[0]}
          onCompleteProof={handleProofComplete}
        />
      )}

      {/* STEP 4: COMPLETED & PAID SCREEN */}
      {activeStep === 'completed' && (
        <div className="glass-card p-12 rounded-3xl border border-emerald-500/30 text-center space-y-6 animate-fade-in max-w-xl mx-auto shadow-2xl">
          <div className="w-20 h-20 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto text-4xl shadow-inner">
            💰
          </div>
          <h2 className="text-4xl font-black text-white italic tracking-tight">
            PAID ₹{(totalEarningsINR || 1850).toLocaleString('en-IN')}
          </h2>
          <p className="text-xs font-extrabold uppercase text-emerald-400 tracking-wider">
            Instant FastAPI Demo Escrow Release Successful
          </p>
          <button
            onClick={() => { setActiveStep('matches'); setSelectedBundles([]); if (onRefreshShipments) onRefreshShipments(); }}
            className="bg-slate-900 border border-slate-700 hover:bg-slate-800 text-white font-extrabold px-8 py-3.5 rounded-2xl text-xs shadow-lg transition-all"
          >
            COMPLETE TRIP & RETURN HOME
          </button>
        </div>
      )}

    </div>
  );
}
