import React, { useState, useEffect } from 'react';
import { Package, Plus, MapPin, Navigation, Truck, ShieldCheck, Clock, CheckCircle2, AlertCircle, Trash2, Eye, X, Filter, Lock, Check, Star, ArrowRight, Radio, Search, Scale, IndianRupee, Compass } from 'lucide-react';
import LiveMap from './LiveMap';
import { api } from '../services/api';

const mockRecommendedDrivers = [
  {
    id: 'drv_1',
    name: 'Suresh Kumar',
    rating: 4.9,
    reviews: 128,
    vehicle: 'Mahindra Bolero LCV Truck',
    capacity_kg: 500,
    match_pct: 96,
    eta_mins: 35,
    price_inr: 1850,
    phone: '+91 9876543210'
  },
  {
    id: 'drv_2',
    name: 'Ramesh Gowda',
    rating: 4.8,
    reviews: 94,
    vehicle: 'Tata Ace Gold Pickup',
    capacity_kg: 600,
    match_pct: 92,
    eta_mins: 45,
    price_inr: 1800,
    phone: '+91 9123456789'
  },
  {
    id: 'drv_3',
    name: 'Vijay Patil',
    rating: 4.7,
    reviews: 62,
    vehicle: 'Ashok Leyland Dost',
    capacity_kg: 750,
    match_pct: 88,
    eta_mins: 55,
    price_inr: 1750,
    phone: '+91 9988776655'
  }
];

export default function ShipperDashboard({ user, shipments, onCreateShipment, onSelectShipmentToTrack, onRefreshShipments, showToast }) {
  const [name, setName] = useState('');
  const [packageType, setPackageType] = useState('Gunnysacks');
  const [weight, setWeight] = useState('120');
  const [pickupAddr, setPickupAddr] = useState('Bengaluru KSRTC Hub');
  const [destAddr, setDestAddr] = useState('Mandya Village APMC');
  const [priority, setPriority] = useState('MEDIUM');
  const [offeredPrice, setOfferedPrice] = useState('1850');

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isSearchingDrivers, setIsSearchingDrivers] = useState(false);
  const [createdShipmentId, setCreatedShipmentId] = useState(null);
  const [showRecommendedDrivers, setShowRecommendedDrivers] = useState(false);
  const [selectedShipment, setSelectedShipment] = useState(null);
  const [trackingShipment, setTrackingShipment] = useState(null);
  
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const notify = (msg, type = 'info', title = null) => {
    if (showToast) showToast(msg, type, title);
  };

  const handleSubmitCreate = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    const parsedWeight = parseFloat(weight);
    const parsedPrice = parseFloat(offeredPrice);

    if (!name || name.trim().length < 2) {
      setErrorMsg('Cargo Name is required (at least 2 letters)');
      return;
    }
    if (isNaN(parsedWeight) || parsedWeight <= 0) {
      setErrorMsg('Weight must be greater than 0 kg');
      return;
    }
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      setErrorMsg('Offer Price must be greater than ₹0');
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await onCreateShipment({
        name: name.trim(),
        title: name.trim(),
        description: `Package Type: ${packageType}`,
        package_type: packageType,
        weight: parsedWeight,
        weight_kg: parsedWeight,
        offered_price: parsedPrice,
        offered_price_inr: parsedPrice,
        pickup_location: pickupAddr.trim(),
        destination: destAddr.trim(),
        pickup_coordinates: { lat: 12.9716, lng: 77.5946, address_name: pickupAddr.trim() },
        destination_coordinates: { lat: 12.5218, lng: 76.8951, address_name: destAddr.trim() },
        priority
      });

      setShowCreateModal(false);
      setIsSearchingDrivers(true);

      setTimeout(() => {
        setIsSearchingDrivers(false);
        setCreatedShipmentId(created?.id || 'shp_new');
        setShowRecommendedDrivers(true);
      }, 1500);

    } catch (err) {
      setErrorMsg(err.message || 'Failed to dispatch shipment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRequestDriver = async (driver) => {
    if (!createdShipmentId) return;
    try {
      await api.updateShipment(createdShipmentId, {
        driver_id: driver.id,
        driver_name: driver.name,
        status: 'ACCEPTED'
      });

      notify(`Driver Assigned: ${driver.name} accepted your load request!`, 'success', 'Driver Requested');
      setShowRecommendedDrivers(false);
      if (onRefreshShipments) onRefreshShipments();
    } catch (err) {
      notify(err.message || 'Failed to request driver', 'error');
    }
  };

  const handleDeleteShipment = async (shipmentId) => {
    try {
      await api.deleteShipment(shipmentId);
      setSelectedShipment(null);
      notify('Shipment cancelled and deleted cleanly', 'info');
      if (onRefreshShipments) onRefreshShipments();
    } catch (err) {
      notify(err.message || 'Failed to cancel shipment', 'error');
    }
  };

  const activeCount = shipments.filter(s => ['AVAILABLE', 'ACCEPTED', 'PICKED_UP', 'IN_TRANSIT', 'ARRIVED'].includes(s.status)).length;
  const deliveredCount = shipments.filter(s => ['DELIVERED', 'PAYMENT_RELEASED'].includes(s.status)).length;
  const totalSpentINR = shipments.filter(s => ['DELIVERED', 'PAYMENT_RELEASED'].includes(s.status))
    .reduce((sum, s) => sum + (s.offered_price || s.offered_price_inr || 0), 0);

  const filteredList = shipments.filter(s => {
    if (filterStatus === 'ACTIVE') return ['AVAILABLE', 'ACCEPTED', 'PICKED_UP', 'IN_TRANSIT', 'ARRIVED'].includes(s.status);
    if (filterStatus === 'DELIVERED') return ['DELIVERED', 'PAYMENT_RELEASED'].includes(s.status);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (s.name || '').toLowerCase().includes(q) || (s.destination || '').toLowerCase().includes(q) || (s.id || '').toLowerCase().includes(q);
    }
    return true;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'AVAILABLE':
        return <span className="px-2.5 py-1 text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full">BROADCASTING</span>;
      case 'ACCEPTED':
      case 'PICKED_UP':
      case 'IN_TRANSIT':
      case 'ARRIVED':
        return <span className="px-2.5 py-1 text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full animate-pulse">{status.replace('_', ' ')}</span>;
      case 'DELIVERED':
      case 'PAYMENT_RELEASED':
        return <span className="px-2.5 py-1 text-[10px] font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-full">DELIVERED</span>;
      default:
        return <span className="px-2.5 py-1 text-[10px] font-bold bg-slate-800 text-slate-400 rounded-full">{status}</span>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 py-6">
      
      {/* TOP GREETING & PRIMARY CTA */}
      <div className="bg-slate-900 border border-slate-800 p-6 sm:p-8 rounded-3xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Welcome, {user?.name || 'Kaveri Organic Farmers'}
          </h1>
          <p className="text-slate-400 text-xs mt-1">
            Dispatch small freight loads to empty commercial return trucks across rural corridors.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold px-6 py-3.5 rounded-2xl shadow-xl transition-all flex items-center justify-center gap-2 text-xs"
        >
          <Plus className="w-4 h-4 stroke-[3]" /> + Create Shipment
        </button>
      </div>

      {/* TOP METRICS CARDS GRID */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase">Active Shipments</span>
            <div className="w-9 h-9 bg-slate-800 text-blue-400 rounded-xl flex items-center justify-center font-bold">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-white">{activeCount}</p>
          <p className="text-[11px] font-bold text-blue-400">Broadcasting & In Transit</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase">Delivered</span>
            <div className="w-9 h-9 bg-slate-800 text-emerald-400 rounded-xl flex items-center justify-center font-bold">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-white">{deliveredCount}</p>
          <p className="text-[11px] font-bold text-emerald-400">Successfully Completed</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase">Total Spent</span>
            <div className="w-9 h-9 bg-slate-800 text-amber-400 rounded-xl flex items-center justify-center font-bold">
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-white">₹{totalSpentINR.toLocaleString('en-IN')}</p>
          <p className="text-[11px] font-bold text-amber-400">Freight Transport Payouts</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase">Avg Delivery Time</span>
            <div className="w-9 h-9 bg-slate-800 text-purple-400 rounded-xl flex items-center justify-center font-bold">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-white">1.8 <span className="text-sm font-bold text-purple-400">Hours</span></p>
          <p className="text-[11px] font-bold text-purple-400">Direct Corridor Routing</p>
        </div>

      </div>

      {/* CREATE SHIPMENT FORM MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-3xl p-6 sm:p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto space-y-6">
            <div className="flex justify-between items-center border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-xl font-black text-white flex items-center gap-2">
                  <Package className="w-5 h-5 text-blue-400" /> Create Shipment
                </h3>
                <p className="text-xs text-slate-400">Fill in load details to match corridor drivers</p>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-white p-2 rounded-xl bg-slate-800">
                <X className="w-4 h-4" />
              </button>
            </div>

            {errorMsg && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs p-3 rounded-xl flex items-center gap-2 font-semibold">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmitCreate} className="space-y-4 text-xs">
              <div>
                <label className="text-[11px] font-bold text-slate-300 uppercase block mb-1">Cargo Name *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Organic Basmati Rice Sacks"
                  className="w-full bg-slate-950 border border-slate-800 p-3.5 rounded-xl text-white focus:outline-none focus:border-blue-500 font-medium"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-300 uppercase block mb-1">Package Type</label>
                  <input
                    type="text"
                    value={packageType}
                    onChange={(e) => setPackageType(e.target.value)}
                    placeholder="Gunnysacks"
                    className="w-full bg-slate-950 border border-slate-800 p-3.5 rounded-xl text-white focus:outline-none focus:border-blue-500 font-medium"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-300 uppercase block mb-1">Weight (kg) *</label>
                  <input
                    type="number"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 p-3.5 rounded-xl text-white focus:outline-none focus:border-blue-500 font-medium"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-300 uppercase block mb-1">Pickup Location *</label>
                  <input
                    type="text"
                    value={pickupAddr}
                    onChange={(e) => setPickupAddr(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 p-3.5 rounded-xl text-white focus:outline-none focus:border-blue-500 font-medium"
                    required
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-300 uppercase block mb-1">Destination Village *</label>
                  <input
                    type="text"
                    value={destAddr}
                    onChange={(e) => setDestAddr(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 p-3.5 rounded-xl text-white focus:outline-none focus:border-blue-500 font-medium"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-300 uppercase block mb-1">Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 p-3.5 rounded-xl text-white focus:outline-none focus:border-blue-500 font-medium"
                  >
                    <option value="LOW">LOW PRIORITY</option>
                    <option value="MEDIUM">MEDIUM PRIORITY</option>
                    <option value="HIGH">HIGH PRIORITY</option>
                    <option value="URGENT">URGENT EXPEDITED</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-300 uppercase block mb-1">Offer Price (₹) *</label>
                  <input
                    type="number"
                    value={offeredPrice}
                    onChange={(e) => setOfferedPrice(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 p-3.5 rounded-xl text-white focus:outline-none focus:border-blue-500 font-medium"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black py-4 rounded-xl shadow-lg transition-all mt-4 text-xs uppercase tracking-wider"
              >
                {isSubmitting ? 'BROADCASTING SHIPMENT...' : 'BROADCAST & FIND DRIVERS'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* SEARCHING DRIVERS LOADING STATE */}
      {isSearchingDrivers && (
        <div className="bg-slate-900 border border-blue-500/30 p-8 rounded-3xl text-center space-y-4 animate-fade-in shadow-2xl">
          <div className="w-16 h-16 bg-blue-500/10 border border-blue-500/30 text-blue-400 rounded-full flex items-center justify-center mx-auto">
            <Radio className="w-8 h-8 animate-ping" />
          </div>
          <h3 className="text-xl font-black text-white italic">Finding compatible drivers...</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            RouteNova Smart Engine is searching for return trucks along the {destAddr} corridor.
          </p>
        </div>
      )}

      {/* 3 RECOMMENDED DRIVERS SELECTION MODAL */}
      {showRecommendedDrivers && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-3xl p-6 sm:p-8 shadow-2xl relative space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-xl font-black text-white flex items-center gap-2">
                  <Truck className="w-5 h-5 text-emerald-400" /> 3 Recommended Corridor Drivers
                </h3>
                <p className="text-xs text-slate-400">Select a verified return driver to transport your shipment</p>
              </div>
              <button onClick={() => setShowRecommendedDrivers(false)} className="text-slate-400 hover:text-white p-2 rounded-xl bg-slate-800">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              {mockRecommendedDrivers.map((driver) => (
                <div key={driver.id} className="bg-slate-950 border border-slate-800 p-5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:border-emerald-500/40 transition-all">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-extrabold text-white text-base">{driver.name}</h4>
                      <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 text-[10px] font-bold rounded flex items-center gap-1">
                        <Star className="w-3 h-3 fill-emerald-400" /> {driver.rating}
                      </span>
                      <span className="text-[10px] font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded">
                        {driver.match_pct}% Corridor Match
                      </span>
                    </div>

                    <p className="text-xs text-slate-400">
                      Vehicle: <strong className="text-slate-200">{driver.vehicle}</strong> ({driver.capacity_kg}kg capacity)
                    </p>

                    <div className="flex items-center gap-4 text-xs text-slate-400 pt-1">
                      <span>ETA: <strong className="text-emerald-400">{driver.eta_mins} mins</strong></span>
                      <span>Phone: <strong className="text-slate-300">{driver.phone}</strong></span>
                    </div>
                  </div>

                  <div className="w-full sm:w-auto text-right flex sm:flex-col justify-between items-center sm:items-end gap-2">
                    <p className="text-2xl font-black text-emerald-400">₹{driver.price_inr}</p>
                    <button
                      onClick={() => handleRequestDriver(driver)}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold px-5 py-2.5 rounded-xl text-xs shadow transition-all flex items-center gap-1.5"
                    >
                      REQUEST DRIVER <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TRACKING & DELIVERY TIMELINE MODAL */}
      {trackingShipment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-3xl rounded-3xl p-6 sm:p-8 shadow-2xl relative space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-xl font-black text-white flex items-center gap-2">
                  <Compass className="w-5 h-5 text-emerald-400" /> Live Delivery Tracking
                </h3>
                <p className="text-xs text-slate-400">Shipment: {trackingShipment.name || trackingShipment.title} (ID: {trackingShipment.id})</p>
              </div>
              <button onClick={() => setTrackingShipment(null)} className="text-slate-400 hover:text-white p-2 rounded-xl bg-slate-800">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="h-72 rounded-2xl overflow-hidden border border-slate-800 relative">
              <LiveMap
                shipmentId={trackingShipment.id}
                origin={{ lat: 12.9716, lng: 77.5946, name: trackingShipment.pickup_location }}
                destination={{ lat: 12.5218, lng: 76.8951, name: trackingShipment.destination }}
                isDriver={false}
                isDemoMode={true}
              />
            </div>

            <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-3">
              <h4 className="text-xs font-bold text-slate-400 uppercase">Delivery Progress Timeline</h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                <div className="bg-slate-900 p-3 rounded-xl border border-emerald-500/40 text-emerald-400 font-bold">
                  ✓ ACCEPTED
                </div>
                <div className={`p-3 rounded-xl border font-bold ${
                  ['PICKED_UP', 'IN_TRANSIT', 'ARRIVED', 'DELIVERED', 'PAYMENT_RELEASED'].includes(trackingShipment.status)
                    ? 'bg-slate-900 border-emerald-500/40 text-emerald-400' : 'bg-slate-900/40 border-slate-800 text-slate-500'
                }`}>
                  PICKED UP
                </div>
                <div className={`p-3 rounded-xl border font-bold ${
                  ['IN_TRANSIT', 'ARRIVED', 'DELIVERED', 'PAYMENT_RELEASED'].includes(trackingShipment.status)
                    ? 'bg-slate-900 border-emerald-500/40 text-emerald-400' : 'bg-slate-900/40 border-slate-800 text-slate-500'
                }`}>
                  IN TRANSIT
                </div>
                <div className={`p-3 rounded-xl border font-bold ${
                  ['DELIVERED', 'PAYMENT_RELEASED'].includes(trackingShipment.status)
                    ? 'bg-slate-900 border-emerald-500/40 text-emerald-400' : 'bg-slate-900/40 border-slate-800 text-slate-500'
                }`}>
                  DELIVERED
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* SHIPMENT CARDS & TABLE */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-6">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilterStatus('ALL')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                filterStatus === 'ALL' ? 'bg-blue-600 text-white' : 'bg-slate-950 text-slate-400 hover:text-white'
              }`}
            >
              All Dispatches ({shipments.length})
            </button>
            <button
              onClick={() => setFilterStatus('ACTIVE')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                filterStatus === 'ACTIVE' ? 'bg-blue-600 text-white' : 'bg-slate-950 text-slate-400 hover:text-white'
              }`}
            >
              Active ({activeCount})
            </button>
            <button
              onClick={() => setFilterStatus('DELIVERED')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                filterStatus === 'DELIVERED' ? 'bg-blue-600 text-white' : 'bg-slate-950 text-slate-400 hover:text-white'
              }`}
            >
              Delivered ({deliveredCount})
            </button>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search cargo, village, or ID..."
              className="bg-slate-950 border border-slate-800 pl-9 pr-4 py-2 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500 w-full sm:w-64"
            />
          </div>
        </div>

        {/* SHIPMENT TABLE */}
        {filteredList.length === 0 ? (
          <div className="bg-slate-950 p-12 rounded-2xl text-center space-y-3 border border-slate-800">
            <Package className="w-10 h-10 text-slate-600 mx-auto" />
            <p className="text-xs text-slate-400">No shipments found matching the selected filter query.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
                  <th className="pb-3">Shipment ID</th>
                  <th className="pb-3">Cargo</th>
                  <th className="pb-3">Weight</th>
                  <th className="pb-3">Destination</th>
                  <th className="pb-3">Driver</th>
                  <th className="pb-3">ETA</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3">Price</th>
                  <th className="pb-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredList.map((shp) => (
                  <tr key={shp.id} className="hover:bg-slate-950/40 transition-all">
                    <td className="py-3.5 font-mono text-slate-400 font-bold">{shp.id}</td>
                    <td className="py-3.5 font-bold text-white">{shp.name || shp.title}</td>
                    <td className="py-3.5 text-slate-300 font-bold">{shp.weight || shp.weight_kg} kg</td>
                    <td className="py-3.5 text-slate-300">{shp.destination}</td>
                    <td className="py-3.5 text-emerald-400 font-bold">
                      {shp.driver_name || <span className="text-slate-500 font-normal">Unassigned</span>}
                    </td>
                    <td className="py-3.5 text-slate-300">
                      {shp.driver_name ? '45 mins' : '-'}
                    </td>
                    <td className="py-3.5">{getStatusBadge(shp.status)}</td>
                    <td className="py-3.5 font-black text-white">₹{(shp.offered_price || shp.offered_price_inr).toLocaleString('en-IN')}</td>
                    <td className="py-3.5 text-right space-x-2">
                      <button
                        onClick={() => setTrackingShipment(shp)}
                        className="bg-slate-950 border border-slate-800 hover:bg-slate-800 text-slate-300 font-extrabold px-3 py-1.5 rounded-xl text-[11px]"
                      >
                        Track GPS
                      </button>
                      <button
                        onClick={() => handleDeleteShipment(shp.id)}
                        className="bg-red-500/10 text-red-400 hover:bg-red-500/20 px-2.5 py-1.5 rounded-xl text-[11px]"
                      >
                        <Trash2 className="w-3.5 h-3.5 inline" />
                      </button>
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
