import React, { useState, useEffect } from 'react';
import { Truck, MapPin, CheckCircle2, ShieldCheck, Fuel, Leaf, IndianRupee, Sparkles, Navigation, AlertTriangle, ArrowRight, Package, ArrowUpDown, Cpu, Route, Scale, TrendingUp, Clock, Check, ChevronRight, Activity, Calendar, HelpCircle, Info } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, AreaChart, Area } from 'recharts';
import confetti from 'canvas-confetti';
import LiveMap from './LiveMap';
import ProofModal from './ProofModal';
import { api } from '../services/api';

const todayImpactData = [
  { time: '08:00', earnings: 0, capacity: 0, fuel: 0.0, co2: 0.0 },
  { time: '10:00', earnings: 1850, capacity: 24, fuel: 5.2, co2: 13.9 },
  { time: '12:00', earnings: 3400, capacity: 48, fuel: 9.8, co2: 26.2 },
  { time: '14:00', earnings: 5200, capacity: 62, fuel: 14.5, co2: 38.8 },
  { time: '16:00', earnings: 6850, capacity: 72, fuel: 19.2, co2: 51.4 },
  { time: '18:00', earnings: 8450, capacity: 78, fuel: 24.6, co2: 65.9 },
];

export default function DriverDashboard({ user, shipments, onRefreshShipments, showToast }) {
  const [destination, setDestination] = useState('Mandya APMC Market, Karnataka');
  const [selectedBundles, setSelectedBundles] = useState([]);
  const [activeStep, setActiveStep] = useState('overview');
  const [activeShipment, setActiveShipment] = useState(null);
  const [expandedWhyId, setExpandedWhyId] = useState(null);
  
  const [matches, setMatches] = useState([]);
  const [sortBy, setSortBy] = useState('match_score');
  const [loadingMatches, setLoadingMatches] = useState(false);

  const notify = (msg, type = 'info', title = null) => {
    if (showToast) showToast(msg, type, title);
  };

  const MAX_CAPACITY = user?.vehicle_capacity_kg || 500;
  const totalWeight = selectedBundles.reduce((sum, s) => sum + (s.weight || s.weight_kg || 0), 0);
  const totalEarningsINR = selectedBundles.reduce((sum, s) => sum + (s.offered_price || s.offered_price_inr || 0), 0);
  const capacityPct = Math.min(100, Math.round((totalWeight / MAX_CAPACITY) * 100));

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

  const handleAcceptSingleLoad = async (shipment) => {
    try {
      await api.acceptShipment(shipment.id);
      confetti({
        particleCount: 120,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#16a34a', '#2563eb', '#fbbf24']
      });

      notify(`Load Accepted! ₹${shipment.offered_price || 1850} locked in demo escrow.`, 'success', 'Load Accepted');
      setActiveShipment(shipment);
      if (onRefreshShipments) onRefreshShipments();
    } catch (err) {
      notify(err.message || 'Failed to accept load', 'error');
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
        await api.releaseEscrow(activeShipment.id);
      } catch (e) {}
    }
    setActiveStep('completed');
    notify('Delivery verified and payment released to driver wallet!', 'success', 'Payment Released');
  };

  const activeDelivery = shipments.find(s => ['ACCEPTED', 'PICKED_UP', 'IN_TRANSIT', 'ARRIVED'].includes(s.status)) || activeShipment;
  const recentDeliveries = shipments.filter(s => ['DELIVERED', 'PAYMENT_RELEASED'].includes(s.status));

  const getTimelineStepIndex = (status) => {
    switch (status) {
      case 'AVAILABLE': return 0;
      case 'ACCEPTED': return 1;
      case 'PICKED_UP': return 2;
      case 'IN_TRANSIT': return 3;
      case 'ARRIVED':
      case 'DELIVERED':
      case 'PAYMENT_RELEASED': return 4;
      default: return 0;
    }
  };

  const timelineSteps = [
    { label: 'MATCHED', description: 'Corridor match found' },
    { label: 'ACCEPTED', description: 'Driver accepted load' },
    { label: 'PICKED UP', description: 'Cargo loaded at origin' },
    { label: 'IN TRANSIT', description: 'En route to destination' },
    { label: 'DELIVERED', description: 'Verified & Escrow Paid' },
  ];

  const currentStepIdx = activeDelivery ? getTimelineStepIndex(activeDelivery.status) : 1;

  const currentHour = new Date().getHours();
  const greeting = currentHour < 12 ? 'Good morning' : currentHour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 py-6 pb-20 md:pb-6">
      
      {/* TOP HEADER & GREETING */}
      <div className="bg-slate-900 border border-slate-800 p-6 sm:p-8 rounded-3xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                {greeting}, {user?.name || 'Ramesh Kumar'}
              </h1>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                <span>ONLINE ●</span>
              </div>
            </div>
            <p className="text-slate-400 text-xs font-medium">
              Vehicle: {user?.vehicle_type || 'Light Commercial Truck'} ({MAX_CAPACITY} kg Payload Limit)
            </p>
          </div>

          <div className="w-full sm:w-auto bg-slate-950 border border-slate-800 px-4 py-3 rounded-2xl flex items-center gap-3">
            <Navigation className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Return Corridor</p>
              <input
                type="text"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                className="bg-transparent text-xs font-bold text-white focus:outline-none w-full sm:w-56"
              />
            </div>
          </div>
        </div>
      </div>

      {/* TOP KPI CARDS GRID */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase">Total Earnings</span>
            <div className="w-9 h-9 bg-slate-800 text-emerald-400 rounded-xl flex items-center justify-center font-bold">
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-white">₹8,450</p>
          <p className="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" /> +₹1,850 today
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase">Cargo Delivered</span>
            <div className="w-9 h-9 bg-slate-800 text-blue-400 rounded-xl flex items-center justify-center font-bold">
              <Scale className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-white">320 kg</p>
          <p className="text-[11px] font-bold text-blue-400 flex items-center gap-1">
            <Package className="w-3.5 h-3.5" /> 4 shipments completed
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase">Capacity Utilization</span>
            <div className="w-9 h-9 bg-slate-800 text-amber-400 rounded-xl flex items-center justify-center font-bold">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-white">78%</p>
          <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
            <div className="bg-amber-400 h-full rounded-full" style={{ width: '78%' }}></div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase">CO₂ Avoided</span>
            <div className="w-9 h-9 bg-slate-800 text-emerald-400 rounded-xl flex items-center justify-center font-bold">
              <Leaf className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-white">24.6 kg</p>
          <p className="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
            <Fuel className="w-3.5 h-3.5" /> 9.2 L diesel saved
          </p>
        </div>

      </div>

      {/* SECTION 1: CURRENT ROUTE */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Route className="w-5 h-5 text-emerald-400" /> Current Route Navigation
            </h2>
            <p className="text-xs text-slate-400">Live GPS tracking and corridor map</p>
          </div>
          {activeStep === 'map' && (
            <button
              onClick={handleArrivedAtDestination}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-2 shadow"
            >
              ARRIVED AT UNLOAD SITE <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="h-[380px] rounded-2xl overflow-hidden border border-slate-800 relative">
          <LiveMap
            shipmentId={activeDelivery?.id}
            origin={{ lat: 12.9716, lng: 77.5946, name: activeDelivery?.pickup_location || "Bengaluru Hub" }}
            destination={{ lat: 12.5218, lng: 76.8951, name: activeDelivery?.destination || "Mandya APMC Market" }}
            isDriver={true}
            isDemoMode={true}
          />
        </div>
      </div>

      {/* SECTION 2: SMART MATCHES */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Cpu className="w-5 h-5 text-emerald-400" /> RouteNova Smart Matches
            </h2>
            <p className="text-xs text-slate-400">Deterministic scoring algorithm based on corridor detour & weight capacity</p>
          </div>

          <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
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
        </div>

        {loadingMatches ? (
          <div className="p-8 text-center text-xs text-slate-400 font-medium animate-pulse">
            Computing smart corridor matches...
          </div>
        ) : matches.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            No shipments available matching current route corridor criteria.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {matches.map((m) => {
              const shp = m.shipment;
              const isExpanded = expandedWhyId === shp.id;

              return (
                <div key={shp.id} className="bg-slate-950 border border-slate-800 p-5 rounded-2xl space-y-4 hover:border-slate-700 transition-all flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="px-2.5 py-0.5 bg-emerald-500/10 text-emerald-400 text-[11px] font-extrabold rounded-full border border-emerald-500/20">
                            {m.match_score}% MATCH
                          </span>
                          <span className="text-[10px] font-bold text-slate-400 uppercase">{m.recommendation}</span>
                        </div>
                        <h3 className="font-bold text-white text-base">{shp.name || shp.title}</h3>
                        <p className="text-xs text-slate-400">{shp.package_type} • {shp.destination}</p>
                      </div>
                      <p className="text-2xl font-black text-emerald-400">₹{m.estimated_earnings}</p>
                    </div>

                    <p className="text-xs text-slate-300 italic bg-slate-900 p-3 rounded-xl border border-slate-800">
                      "{m.reason}"
                    </p>

                    <div className="grid grid-cols-4 gap-2 text-center text-xs">
                      <div className="bg-slate-900 p-2 rounded-xl border border-slate-800">
                        <p className="text-[9px] font-bold text-slate-400 uppercase">Weight</p>
                        <p className="font-bold text-white">{m.weight_kg} kg</p>
                      </div>
                      <div className="bg-slate-900 p-2 rounded-xl border border-slate-800">
                        <p className="text-[9px] font-bold text-slate-400 uppercase">Detour</p>
                        <p className="font-bold text-blue-400">{m.estimated_detour_km} km</p>
                      </div>
                      <div className="bg-slate-900 p-2 rounded-xl border border-slate-800">
                        <p className="text-[9px] font-bold text-slate-400 uppercase">Capacity</p>
                        <p className="font-bold text-amber-400">{m.capacity_used_pct}%</p>
                      </div>
                      <div className="bg-slate-900 p-2 rounded-xl border border-slate-800">
                        <p className="text-[9px] font-bold text-slate-400 uppercase">CO₂ Saved</p>
                        <p className="font-bold text-emerald-400">{m.co2_saved_kg} kg</p>
                      </div>
                    </div>

                    {/* PROMINENT "WHY THIS MATCH?" SECTION */}
                    <div className="border-t border-slate-800/80 pt-3">
                      <button
                        onClick={() => setExpandedWhyId(isExpanded ? null : shp.id)}
                        className="w-full flex items-center justify-between text-xs font-bold text-blue-400 hover:text-blue-300 transition-all bg-slate-900/60 p-2.5 rounded-xl border border-blue-500/20"
                      >
                        <span className="flex items-center gap-1.5">
                          <HelpCircle className="w-4 h-4 text-blue-400" /> Why this match? (Scoring Breakdown)
                        </span>
                        <ChevronRight className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                      </button>

                      {isExpanded && (
                        <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 mt-2 space-y-2 text-xs animate-fade-in">
                          <p className="text-[11px] font-bold text-slate-300 border-b border-slate-800 pb-1.5">
                            Match Score Calculation Formula:
                          </p>
                          <div className="space-y-1.5 text-[11px]">
                            <div className="flex justify-between items-center text-slate-300">
                              <span>1. Corridor Detour Score (35% weight):</span>
                              <span className="font-bold text-blue-400">{m.route_score}%</span>
                            </div>
                            <div className="flex justify-between items-center text-slate-300">
                              <span>2. Capacity Fit Score (25% weight):</span>
                              <span className="font-bold text-amber-400">{m.capacity_score}%</span>
                            </div>
                            <div className="flex justify-between items-center text-slate-300">
                              <span>3. Pickup Proximity (20% weight):</span>
                              <span className="font-bold text-emerald-400">{m.distance_score}%</span>
                            </div>
                            <div className="flex justify-between items-center text-slate-300">
                              <span>4. Shipment Priority (10% weight):</span>
                              <span className="font-bold text-purple-400">{m.priority_score}%</span>
                            </div>
                            <div className="flex justify-between items-center text-slate-300">
                              <span>5. Schedule Window (10% weight):</span>
                              <span className="font-bold text-teal-400">{m.timing_score}%</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => handleAcceptSingleLoad(shp)}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3.5 rounded-xl text-xs shadow transition-all flex items-center justify-center gap-2 mt-2"
                  >
                    <CheckCircle2 className="w-4 h-4" /> ACCEPT LOAD (₹{m.estimated_earnings})
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* SECTION 3: ACTIVE DELIVERY PROGRESS TIMELINE */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Truck className="w-5 h-5 text-emerald-400" /> Active Delivery Progress
            </h2>
            <p className="text-xs text-slate-400">
              {activeDelivery ? `Shipment ID: ${activeDelivery.id}` : 'No active shipment selected'}
            </p>
          </div>
          {activeDelivery && (
            <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-xs font-bold uppercase">
              {activeDelivery.status}
            </span>
          )}
        </div>

        <div className="relative py-4">
          <div className="hidden sm:block absolute top-1/2 left-0 right-0 h-1 bg-slate-800 -translate-y-1/2 z-0"></div>

          <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 relative z-10">
            {timelineSteps.map((step, idx) => {
              const isCompleted = idx < currentStepIdx;
              const isCurrent = idx === currentStepIdx;

              return (
                <div key={idx} className="flex sm:flex-col items-center gap-3 sm:text-center bg-slate-950 sm:bg-transparent p-3 sm:p-0 rounded-xl border sm:border-none border-slate-800">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                    isCompleted ? 'bg-emerald-500 text-slate-950' :
                    isCurrent ? 'bg-emerald-600 text-white ring-4 ring-emerald-500/20' :
                    'bg-slate-800 text-slate-500 border border-slate-700'
                  }`}>
                    {isCompleted ? <Check className="w-5 h-5 stroke-[3]" /> : idx + 1}
                  </div>
                  <div>
                    <p className={`text-xs font-bold ${isCurrent ? 'text-emerald-400' : isCompleted ? 'text-white' : 'text-slate-500'}`}>
                      {step.label}
                    </p>
                    <p className="text-[10px] text-slate-500">{step.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {activeDelivery && activeDelivery.status !== 'DELIVERED' && activeDelivery.status !== 'PAYMENT_RELEASED' && (
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              onClick={() => { setActiveStep('map'); }}
              className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-xl text-xs flex items-center justify-center gap-2"
            >
              <Navigation className="w-4 h-4 text-emerald-400" /> View Live Map
            </button>
            <button
              onClick={handleArrivedAtDestination}
              className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl text-xs flex items-center justify-center gap-2 shadow"
            >
              <ShieldCheck className="w-4 h-4" /> Capture Proof & Verify QR
            </button>
          </div>
        )}
      </div>

      {/* PROOF MODAL STEP */}
      {activeStep === 'proof' && (
        <ProofModal
          shipment={activeDelivery || shipments[0]}
          onCompleteProof={handleProofComplete}
        />
      )}

      {/* SECTION 4: TODAY'S IMPACT & CHARTS */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-6">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-emerald-400" /> Today's Impact & Performance
          </h2>
          <p className="text-xs text-slate-400">Hourly earnings, capacity utilization, fuel, and carbon metrics</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
            <p className="text-xs font-bold text-slate-300">Cumulative Earnings (₹)</p>
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={todayImpactData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }} />
                  <Area type="monotone" dataKey="earnings" stroke="#16a34a" fill="#16a34a" fillOpacity={0.2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
            <p className="text-xs font-bold text-slate-300">Truck Capacity Utilization (%)</p>
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={todayImpactData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }} />
                  <Bar dataKey="capacity" fill="#fbbf24" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>
      </div>

      {/* SECTION 5: RECENT DELIVERIES */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-emerald-400" /> Recent Deliveries
          </h2>
          <span className="text-xs text-slate-400">Total Completed: {recentDeliveries.length}</span>
        </div>

        {recentDeliveries.length === 0 ? (
          <div className="bg-slate-950 p-6 rounded-2xl text-center text-xs text-slate-500">
            No completed deliveries logged yet. Accept loads from Smart Matches to start!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
                  <th className="pb-3">Shipment Name</th>
                  <th className="pb-3">Route Corridor</th>
                  <th className="pb-3">Weight</th>
                  <th className="pb-3">Payout</th>
                  <th className="pb-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {recentDeliveries.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-950/40">
                    <td className="py-3 font-bold text-white">{s.name || s.title}</td>
                    <td className="py-3 text-slate-400">{s.pickup_location} → {s.destination}</td>
                    <td className="py-3 text-emerald-400 font-bold">{s.weight || s.weight_kg} kg</td>
                    <td className="py-3 font-black text-white">₹{(s.offered_price || s.offered_price_inr).toLocaleString('en-IN')}</td>
                    <td className="py-3">
                      <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-[10px] font-bold uppercase">
                        {s.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
