import React, { useState, useEffect } from 'react';
import { Package, Plus, MapPin, Navigation, Truck, ShieldCheck, Clock, CheckCircle2, AlertCircle, Trash2, Eye, X, Filter } from 'lucide-react';
import { api } from '../services/api';

export default function ShipperDashboard({ user, shipments, onCreateShipment, onSelectShipmentToTrack, onRefreshShipments }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [packageType, setPackageType] = useState('Gunnysacks');
  const [weight, setWeight] = useState('120');
  const [offeredPrice, setOfferedPrice] = useState('1850');
  const [pickupAddr, setPickupAddr] = useState('Bengaluru KSRTC Hub');
  const [destAddr, setDestAddr] = useState('Mandya Village APMC');
  const [priority, setPriority] = useState('MEDIUM');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedShipment, setSelectedShipment] = useState(null);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    const parsedWeight = parseFloat(weight);
    const parsedPrice = parseFloat(offeredPrice);

    if (!name || name.trim().length < 2) {
      setErrorMsg('Load name is required (minimum 2 characters)');
      return;
    }

    if (isNaN(parsedWeight) || parsedWeight <= 0) {
      setErrorMsg('Weight must be a positive number greater than 0 kg');
      return;
    }

    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      setErrorMsg('Offered price must be greater than ₹0');
      return;
    }

    setIsSubmitting(true);
    try {
      await onCreateShipment({
        name: name.trim(),
        title: name.trim(),
        description: description.trim(),
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
      setName('');
      setDescription('');
      setErrorMsg('');
    } catch (err) {
      setErrorMsg(err.message || 'Failed to dispatch shipment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteShipment = async (shipmentId) => {
    if (!window.confirm("Are you sure you want to cancel and delete this shipment dispatch?")) return;
    try {
      await api.deleteShipment(shipmentId);
      setSelectedShipment(null);
      if (onRefreshShipments) onRefreshShipments();
    } catch (err) {
      alert(err.message || 'Failed to cancel shipment');
    }
  };

  const filteredShipments = shipments.filter(s => {
    if (filterStatus === 'ALL') return true;
    if (filterStatus === 'AVAILABLE') return s.status === 'AVAILABLE';
    if (filterStatus === 'ACTIVE') return ['ACCEPTED', 'PICKED_UP', 'IN_TRANSIT', 'ARRIVED'].includes(s.status);
    if (filterStatus === 'COMPLETED') return ['DELIVERED', 'PAYMENT_RELEASED'].includes(s.status);
    return true;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'AVAILABLE':
        return <span className="px-2.5 py-1 text-[10px] font-extrabold bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full">BROADCASTING</span>;
      case 'ACCEPTED':
      case 'PICKED_UP':
      case 'IN_TRANSIT':
      case 'ARRIVED':
        return <span className="px-2.5 py-1 text-[10px] font-extrabold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full animate-pulse">{status.replace('_', ' ')}</span>;
      case 'DELIVERED':
      case 'PAYMENT_RELEASED':
        return <span className="px-2.5 py-1 text-[10px] font-extrabold bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-full">COMPLETED</span>;
      case 'CANCELLED':
        return <span className="px-2.5 py-1 text-[10px] font-extrabold bg-red-500/10 text-red-400 border border-red-500/20 rounded-full">CANCELLED</span>;
      default:
        return <span className="px-2.5 py-1 text-[10px] font-extrabold bg-slate-800 text-slate-400 rounded-full">{status}</span>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 py-6">
      
      {/* Header Banner */}
      <div className="glass-card p-6 sm:p-8 rounded-3xl border border-blue-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-bold uppercase mb-2">
            <Package className="w-3.5 h-3.5" /> Shipper & Rural Producer Dashboard
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white italic">
            My Dispatches & Shipments 📦
          </h2>
          <p className="text-slate-400 text-xs mt-1">
            Create, track, and manage micro-freight loads dispatched to corridor return drivers.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black px-6 py-3.5 rounded-2xl shadow-xl transition-all flex items-center justify-center gap-2 text-xs"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          DISPATCH NEW SHIPMENT
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900/90 p-2 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400 ml-2" />
          <span className="text-xs font-bold text-slate-400 uppercase">Filter:</span>
        </div>
        <div className="flex overflow-x-auto gap-2">
          <button
            onClick={() => setFilterStatus('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filterStatus === 'ALL' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white bg-slate-950'
            }`}
          >
            All Shipments ({shipments.length})
          </button>
          <button
            onClick={() => setFilterStatus('AVAILABLE')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filterStatus === 'AVAILABLE' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white bg-slate-950'
            }`}
          >
            Broadcasting ({shipments.filter(s => s.status === 'AVAILABLE').length})
          </button>
          <button
            onClick={() => setFilterStatus('ACTIVE')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filterStatus === 'ACTIVE' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white bg-slate-950'
            }`}
          >
            In Transit ({shipments.filter(s => ['ACCEPTED', 'PICKED_UP', 'IN_TRANSIT', 'ARRIVED'].includes(s.status)).length})
          </button>
          <button
            onClick={() => setFilterStatus('COMPLETED')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filterStatus === 'COMPLETED' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white bg-slate-950'
            }`}
          >
            Delivered ({shipments.filter(s => ['DELIVERED', 'PAYMENT_RELEASED'].includes(s.status)).length})
          </button>
        </div>
      </div>

      {/* DISPATCH NEW SHIPMENT MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-3xl p-6 sm:p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-white flex items-center gap-2">
                <Package className="w-5 h-5 text-blue-400" /> Create & Broadcast Shipment
              </h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-white p-2 rounded-xl bg-slate-800">
                <X className="w-4 h-4" />
              </button>
            </div>

            {errorMsg && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs p-3 rounded-xl mb-4 flex items-center gap-2 font-semibold">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="text-[11px] font-bold text-slate-300 uppercase block mb-1">Shipment Name / Title *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Organic Basmati Rice Sacks"
                  className="w-full bg-slate-950 border border-slate-800 p-3 rounded-xl text-white focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-300 uppercase block mb-1">Description / Notes</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Fragile agricultural produce, requires dry storage"
                  rows={2}
                  className="w-full bg-slate-950 border border-slate-800 p-3 rounded-xl text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-300 uppercase block mb-1">Package Type</label>
                  <input
                    type="text"
                    value={packageType}
                    onChange={(e) => setPackageType(e.target.value)}
                    placeholder="Gunnysacks"
                    className="w-full bg-slate-950 border border-slate-800 p-3 rounded-xl text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-300 uppercase block mb-1">Weight (kg) *</label>
                  <input
                    type="number"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 p-3 rounded-xl text-white focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-300 uppercase block mb-1">Offered Price (₹) *</label>
                  <input
                    type="number"
                    value={offeredPrice}
                    onChange={(e) => setOfferedPrice(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 p-3 rounded-xl text-white focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-300 uppercase block mb-1">Pickup Location</label>
                  <input
                    type="text"
                    value={pickupAddr}
                    onChange={(e) => setPickupAddr(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 p-3 rounded-xl text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-300 uppercase block mb-1">Destination Village</label>
                  <input
                    type="text"
                    value={destAddr}
                    onChange={(e) => setDestAddr(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 p-3 rounded-xl text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-300 uppercase block mb-1">Shipment Priority</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 p-3 rounded-xl text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="LOW">LOW PRIORITY</option>
                  <option value="MEDIUM">MEDIUM PRIORITY</option>
                  <option value="HIGH">HIGH PRIORITY</option>
                  <option value="URGENT">URGENT EXPEDITED</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black py-3.5 rounded-xl shadow-lg transition-all mt-4"
              >
                {isSubmitting ? 'BROADCASTING VIA API...' : 'BROADCAST TO DRIVERS (FASTAPI API)'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* SHIPMENT DETAILS MODAL */}
      {selectedShipment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-3xl p-6 sm:p-8 shadow-2xl relative space-y-6">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-xl font-black text-white">{selectedShipment.name || selectedShipment.title}</h3>
                  {getStatusBadge(selectedShipment.status)}
                </div>
                <p className="text-xs text-slate-400">ID: {selectedShipment.id}</p>
              </div>
              <button onClick={() => setSelectedShipment(null)} className="text-slate-400 hover:text-white p-2 rounded-xl bg-slate-800">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-4 pb-2 border-b border-slate-800">
                <div>
                  <p className="text-slate-500 font-bold uppercase text-[10px]">Package Type</p>
                  <p className="text-white font-bold">{selectedShipment.package_type}</p>
                </div>
                <div>
                  <p className="text-slate-500 font-bold uppercase text-[10px]">Weight Payload</p>
                  <p className="text-emerald-400 font-black">{selectedShipment.weight || selectedShipment.weight_kg} kg</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pb-2 border-b border-slate-800">
                <div>
                  <p className="text-slate-500 font-bold uppercase text-[10px]">Offered Payout</p>
                  <p className="text-emerald-400 font-black text-lg">₹{(selectedShipment.offered_price || selectedShipment.offered_price_inr).toLocaleString('en-IN')}</p>
                </div>
                <div>
                  <p className="text-slate-500 font-bold uppercase text-[10px]">Priority Level</p>
                  <p className="text-amber-400 font-bold">{selectedShipment.priority}</p>
                </div>
              </div>

              <div className="space-y-1 pt-1">
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-blue-400" />
                  <span>Pickup: <strong>{selectedShipment.pickup_location}</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <Navigation className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Destination: <strong>{selectedShipment.destination}</strong></span>
                </div>
              </div>
            </div>

            {selectedShipment.driver_name && (
              <div className="bg-emerald-950/20 border border-emerald-500/30 p-4 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Truck className="w-6 h-6 text-emerald-400" />
                  <div>
                    <p className="text-xs font-black text-white">{selectedShipment.driver_name}</p>
                    <p className="text-[10px] text-emerald-400 font-bold">Assigned Corridor Driver</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    const shp = selectedShipment;
                    setSelectedShipment(null);
                    onSelectShipmentToTrack(shp);
                  }}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold px-4 py-2 rounded-xl text-xs shadow"
                >
                  Track Live GPS
                </button>
              </div>
            )}

            {/* Delete / Cancel Action */}
            {selectedShipment.status !== 'DELIVERED' && selectedShipment.status !== 'PAYMENT_RELEASED' && (
              <button
                onClick={() => handleDeleteShipment(selectedShipment.id)}
                className="w-full bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 font-extrabold py-3 rounded-xl text-xs flex items-center justify-center gap-2 transition-all"
              >
                <Trash2 className="w-4 h-4" /> CANCEL & DELETE SHIPMENT
              </button>
            )}

          </div>
        </div>
      )}

      {/* Dispatches List */}
      <div className="space-y-4">
        <h3 className="text-xl font-black text-white italic">Active Shipment Dispatches</h3>

        {filteredShipments.length === 0 ? (
          <div className="glass-card p-12 rounded-3xl border border-slate-800 text-center space-y-4">
            <Package className="w-12 h-12 text-slate-600 mx-auto" />
            <p className="text-slate-400 text-xs">No shipments found matching the selected filter.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredShipments.map((shp) => (
              <div key={shp.id} className="glass-card p-6 rounded-3xl border border-slate-800 space-y-4 hover:border-slate-700 transition-all">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-extrabold text-white text-base">{shp.name || shp.title}</h4>
                      {getStatusBadge(shp.status)}
                    </div>
                    <p className="text-xs text-slate-400">
                      {shp.package_type} • Weight: <strong className="text-slate-200">{shp.weight || shp.weight_kg}kg</strong>
                    </p>
                  </div>
                  <p className="text-xl font-black text-blue-400">₹{(shp.offered_price || shp.offered_price_inr).toLocaleString('en-IN')}</p>
                </div>

                <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 text-xs text-slate-300 space-y-1">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-blue-400" />
                    <span>Pickup: {shp.pickup_location}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Navigation className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Drop: {shp.destination}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    onClick={() => setSelectedShipment(shp)}
                    className="text-xs font-extrabold text-slate-300 hover:text-white flex items-center gap-1.5 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl hover:bg-slate-800"
                  >
                    <Eye className="w-3.5 h-3.5 text-blue-400" /> View Details
                  </button>

                  {shp.driver_name && (
                    <button
                      onClick={() => onSelectShipmentToTrack(shp)}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-extrabold px-3 py-1.5 rounded-xl shadow"
                    >
                      Track GPS
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
