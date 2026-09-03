import React, { useState } from 'react';
import { Settings, Users, Shield, Server, Activity, Database, CheckCircle2, RefreshCw, IndianRupee, Fuel, Leaf, Truck, Package, AlertTriangle, Filter, Search, ArrowUpRight, TrendingUp, BarChart3, Bell } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, AreaChart, Area, LineChart, Line } from 'recharts';

const dailyShipmentsData = [
  { day: 'Mon', shipments: 12, deliveries: 10, revenue: 14200, utilization: 68, co2_kg: 84 },
  { day: 'Tue', shipments: 18, deliveries: 15, revenue: 21500, utilization: 74, co2_kg: 126 },
  { day: 'Wed', shipments: 15, deliveries: 14, revenue: 18900, utilization: 72, co2_kg: 110 },
  { day: 'Thu', shipments: 24, deliveries: 22, revenue: 31000, utilization: 81, co2_kg: 168 },
  { day: 'Fri', shipments: 28, deliveries: 25, revenue: 38500, utilization: 86, co2_kg: 195 },
  { day: 'Sat', shipments: 32, deliveries: 29, revenue: 45200, utilization: 89, co2_kg: 224 },
  { day: 'Sun', shipments: 22, deliveries: 20, revenue: 29400, utilization: 76, co2_kg: 154 },
];

const mockRecentShipments = [
  { id: 'shp_41c0ff13', name: 'Organic Basmati Rice', shipper: 'Kaveri Farmers', route: 'Mandya → Bengaluru', weight: '180 kg', price: '₹2,400', status: 'IN_TRANSIT' },
  { id: 'shp_ac5a4761', name: 'Fresh Tomato Crates', shipper: 'Mandya Produce Co', route: 'Mandya → Mysuru', weight: '120 kg', price: '₹1,850', status: 'ACCEPTED' },
  { id: 'shp_dfa21747', name: 'Organic Wheat Gunnysacks', shipper: 'Hassan APMC Union', route: 'Hassan → Bengaluru', weight: '250 kg', price: '₹3,200', status: 'PAYMENT_RELEASED' },
  { id: 'shp_88f9102b', name: 'Jaggery Boxes', shipper: 'Srirangapatna APMC', route: 'Srirangapatna → Mandya', weight: '90 kg', price: '₹1,400', status: 'DELIVERED' },
];

const mockRecentUsers = [
  { id: 'usr_drv_1', name: 'Suresh Kumar', role: 'driver', phone: '+91 9876543210', date: '2026-09-02', status: 'VERIFIED' },
  { id: 'usr_shp_1', name: 'Kaveri Organic Farmers', role: 'shipper', phone: '+91 9123456789', date: '2026-09-02', status: 'VERIFIED' },
  { id: 'usr_drv_2', name: 'Ramesh Gowda', role: 'driver', phone: '+91 9988776655', date: '2026-09-01', status: 'VERIFIED' },
  { id: 'usr_shp_2', name: 'Mandya Produce Co', role: 'shipper', phone: '+91 9776655443', date: '2026-08-31', status: 'VERIFIED' },
];

const mockActiveDrivers = [
  { id: 'drv_1', name: 'Suresh Kumar', vehicle: 'Mahindra Bolero LCV Truck', capacity: '500 kg', rating: '⭐ 4.9', location: 'Bengaluru Hub' },
  { id: 'drv_2', name: 'Ramesh Gowda', vehicle: 'Tata Ace Gold Pickup', capacity: '600 kg', rating: '⭐ 4.8', location: 'Mandya APMC' },
  { id: 'drv_3', name: 'Vijay Patil', vehicle: 'Ashok Leyland Dost', capacity: '750 kg', rating: '⭐ 4.7', location: 'Mysuru Yard' },
];

const mockSystemAlerts = [
  { type: 'HEALTH', message: 'FastAPI REST Server active on port 8000', time: '1 min ago', status: 'OK' },
  { type: 'DATABASE', message: 'MongoDB Motor async driver connected cleanly', time: '5 mins ago', status: 'OK' },
  { type: 'MATCHING', message: 'Smart Matching Engine processed 32 corridor queries', time: '12 mins ago', status: 'OK' },
  { type: 'ESCROW', message: 'Demo Escrow Ledger audit verified 100% payout compliance', time: '20 mins ago', status: 'OK' },
];

export default function AdminDashboard({ analytics }) {
  const [timeRange, setTimeRange] = useState('7d');
  const [regionFilter, setRegionFilter] = useState('ALL');
  const [activeTableTab, setActiveTableTab] = useState('shipments'); // 'shipments' | 'users' | 'drivers' | 'alerts'

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 py-6">
      
      {/* HEADER BANNER WITH SIH PITCH & FILTERS */}
      <div className="bg-slate-900 border border-purple-500/30 p-6 sm:p-8 rounded-3xl space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20 text-xs font-bold uppercase mb-2">
              <Settings className="w-3.5 h-3.5" /> SIH Hackathon Command Center
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              RouteNova Platform Control Center 🛡️
            </h1>
            <p className="text-slate-400 text-xs mt-1">
              Scalability & district-wide micro-logistics analytics across rural commercial corridors.
            </p>
          </div>

          <div className="bg-emerald-500/10 border border-emerald-500/30 px-4 py-2.5 rounded-2xl flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-emerald-400 animate-ping"></span>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">System Health</p>
              <p className="text-xs font-black text-emerald-400">FASTAPI & MONGODB ONLINE</p>
            </div>
          </div>
        </div>

        {/* FILTERS BAR */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-800 text-xs">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <span className="font-bold text-slate-400 uppercase">District Region:</span>
            <select
              value={regionFilter}
              onChange={(e) => setRegionFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 p-2 rounded-xl text-white font-bold focus:outline-none"
            >
              <option value="ALL">All Corridors (Karnataka State)</option>
              <option value="MANDYA">Mandya District Corridor</option>
              <option value="MYSURU">Mysuru APMC Hub</option>
              <option value="HASSAN">Hassan Agritech Zone</option>
            </select>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setTimeRange('7d')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                timeRange === '7d' ? 'bg-purple-600 text-white' : 'bg-slate-950 text-slate-400 hover:text-white'
              }`}
            >
              Last 7 Days
            </button>
            <button
              onClick={() => setTimeRange('30d')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                timeRange === '30d' ? 'bg-purple-600 text-white' : 'bg-slate-950 text-slate-400 hover:text-white'
              }`}
            >
              Last 30 Days
            </button>
            <button
              onClick={() => setTimeRange('all')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                timeRange === 'all' ? 'bg-purple-600 text-white' : 'bg-slate-950 text-slate-400 hover:text-white'
              }`}
            >
              All Time
            </button>
          </div>
        </div>
      </div>

      {/* TOP 8 CORE METRIC CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        
        {/* Total Users */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase">Total Users</span>
            <Users className="w-4 h-4 text-purple-400" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-white">{analytics?.total_users || 28}</p>
          <p className="text-[11px] text-purple-400 font-bold">Drivers & Shippers</p>
        </div>

        {/* Active Drivers */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase">Active Drivers</span>
            <Truck className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-emerald-400">{analytics?.total_drivers || 14}</p>
          <p className="text-[11px] text-emerald-400 font-bold">Verified Trucks</p>
        </div>

        {/* Active Shippers */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase">Active Shippers</span>
            <Package className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-blue-400">{analytics?.total_shippers || 14}</p>
          <p className="text-[11px] text-blue-400 font-bold">Rural Farmers & Unions</p>
        </div>

        {/* Active Shipments */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase">Active Shipments</span>
            <Activity className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-amber-400">{analytics?.active_shipments || 4}</p>
          <p className="text-[11px] text-amber-400 font-bold">Corridor Pipeline</p>
        </div>

        {/* Completed Deliveries */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase">Completed</span>
            <CheckCircle2 className="w-4 h-4 text-teal-400" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-teal-400">{analytics?.completed_deliveries || 18}</p>
          <p className="text-[11px] text-teal-400 font-bold">100% QR Verified</p>
        </div>

        {/* Total Logistics Value */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase">Logistics Value</span>
            <IndianRupee className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-white">₹{(analytics?.total_revenue_inr || 45200).toLocaleString('en-IN')}</p>
          <p className="text-[11px] text-emerald-400 font-bold">Processed Escrow</p>
        </div>

        {/* Fuel Saved */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase">Fuel Saved</span>
            <Fuel className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-white">167.1 <span className="text-sm font-bold text-blue-400">L</span></p>
          <p className="text-[11px] text-blue-400 font-bold">Diesel Conserved</p>
        </div>

        {/* CO2 Avoided */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase">CO₂ Avoided</span>
            <Leaf className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-white">447.8 <span className="text-sm font-bold text-emerald-400">kg</span></p>
          <p className="text-[11px] text-emerald-400 font-bold">IPCC Metric Standard</p>
        </div>

      </div>

      {/* VISUAL CHARTS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Chart 1: Shipments & Deliveries per Day */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-white text-base flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-purple-400" /> Shipments & Deliveries Volume
            </h3>
            <span className="text-[10px] font-bold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded">Daily Pipeline</span>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyShipmentsData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="day" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '10px', fontSize: '11px' }} />
                <Bar dataKey="shipments" name="Broadcast Shipments" fill="#9333ea" radius={[4, 4, 0, 0]} />
                <Bar dataKey="deliveries" name="Completed Deliveries" fill="#16a34a" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Revenue Growth */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-white text-base flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" /> Logistics Revenue Growth (₹)
            </h3>
            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">Cumulative Escrow</span>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyShipmentsData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="day" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '10px', fontSize: '11px' }} />
                <Area type="monotone" dataKey="revenue" name="Revenue (₹)" stroke="#16a34a" fill="#16a34a" fillOpacity={0.25} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Capacity Utilization */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-white text-base flex items-center gap-2">
              <Activity className="w-4 h-4 text-amber-400" /> Return Capacity Utilization (%)
            </h3>
            <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">Truck Load Factor</span>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailyShipmentsData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="day" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '10px', fontSize: '11px' }} />
                <Line type="monotone" dataKey="utilization" name="Capacity Used (%)" stroke="#fbbf24" strokeWidth={3} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 4: CO2 Reduction */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-white text-base flex items-center gap-2">
              <Leaf className="w-4 h-4 text-emerald-400" /> Daily CO₂ Reduction (kg)
            </h3>
            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">Decarbonization Impact</span>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyShipmentsData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="day" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '10px', fontSize: '11px' }} />
                <Bar dataKey="co2_kg" name="CO₂ Prevented (kg)" fill="#2563eb" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* DATA TABLES SECTION WITH TABS */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-6">
        
        {/* Table Sub-Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTableTab('shipments')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTableTab === 'shipments' ? 'bg-purple-600 text-white shadow' : 'bg-slate-950 text-slate-400 hover:text-white'
              }`}
            >
              Recent Shipments ({mockRecentShipments.length})
            </button>
            <button
              onClick={() => setActiveTableTab('users')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTableTab === 'users' ? 'bg-purple-600 text-white shadow' : 'bg-slate-950 text-slate-400 hover:text-white'
              }`}
            >
              Recent Users ({mockRecentUsers.length})
            </button>
            <button
              onClick={() => setActiveTableTab('drivers')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTableTab === 'drivers' ? 'bg-purple-600 text-white shadow' : 'bg-slate-950 text-slate-400 hover:text-white'
              }`}
            >
              Active Drivers ({mockActiveDrivers.length})
            </button>
            <button
              onClick={() => setActiveTableTab('alerts')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTableTab === 'alerts' ? 'bg-purple-600 text-white shadow' : 'bg-slate-950 text-slate-400 hover:text-white'
              }`}
            >
              System Alerts ({mockSystemAlerts.length})
            </button>
          </div>
        </div>

        {/* TABLE 1: RECENT SHIPMENTS */}
        {activeTableTab === 'shipments' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
                  <th className="pb-3">Shipment ID</th>
                  <th className="pb-3">Cargo Name</th>
                  <th className="pb-3">Shipper</th>
                  <th className="pb-3">Corridor Route</th>
                  <th className="pb-3">Weight</th>
                  <th className="pb-3">Price</th>
                  <th className="pb-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {mockRecentShipments.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-950/40">
                    <td className="py-3.5 font-mono text-slate-400 font-bold">{s.id}</td>
                    <td className="py-3.5 font-bold text-white">{s.name}</td>
                    <td className="py-3.5 text-slate-300">{s.shipper}</td>
                    <td className="py-3.5 text-slate-300">{s.route}</td>
                    <td className="py-3.5 text-emerald-400 font-bold">{s.weight}</td>
                    <td className="py-3.5 font-black text-white">{s.price}</td>
                    <td className="py-3.5">
                      <span className="px-2.5 py-1 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-full text-[10px] font-bold">
                        {s.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* TABLE 2: RECENT USERS */}
        {activeTableTab === 'users' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
                  <th className="pb-3">User ID</th>
                  <th className="pb-3">Name</th>
                  <th className="pb-3">Role</th>
                  <th className="pb-3">Phone</th>
                  <th className="pb-3">Registration Date</th>
                  <th className="pb-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {mockRecentUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-950/40">
                    <td className="py-3.5 font-mono text-slate-400 font-bold">{u.id}</td>
                    <td className="py-3.5 font-bold text-white">{u.name}</td>
                    <td className="py-3.5 uppercase font-bold text-purple-400">{u.role}</td>
                    <td className="py-3.5 text-slate-300">{u.phone}</td>
                    <td className="py-3.5 text-slate-400">{u.date}</td>
                    <td className="py-3.5">
                      <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-[10px] font-bold">
                        {u.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* TABLE 3: ACTIVE DRIVERS */}
        {activeTableTab === 'drivers' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
                  <th className="pb-3">Driver ID</th>
                  <th className="pb-3">Driver Name</th>
                  <th className="pb-3">Vehicle Type</th>
                  <th className="pb-3">Max Capacity</th>
                  <th className="pb-3">Rating</th>
                  <th className="pb-3">Current Hub</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {mockActiveDrivers.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-950/40">
                    <td className="py-3.5 font-mono text-slate-400 font-bold">{d.id}</td>
                    <td className="py-3.5 font-bold text-white">{d.name}</td>
                    <td className="py-3.5 text-slate-300">{d.vehicle}</td>
                    <td className="py-3.5 text-emerald-400 font-bold">{d.capacity}</td>
                    <td className="py-3.5 text-amber-400 font-bold">{d.rating}</td>
                    <td className="py-3.5 text-slate-300">{d.location}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* TABLE 4: SYSTEM ALERTS */}
        {activeTableTab === 'alerts' && (
          <div className="space-y-3">
            {mockSystemAlerts.map((alert, idx) => (
              <div key={idx} className="bg-slate-950 border border-slate-800 p-4 rounded-2xl flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-emerald-500/10 text-emerald-400 rounded-xl flex items-center justify-center font-bold">
                    <Bell className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-bold text-white">{alert.message}</p>
                    <p className="text-[10px] text-slate-500">{alert.time}</p>
                  </div>
                </div>
                <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-[10px] font-bold">
                  {alert.status}
                </span>
              </div>
            ))}
          </div>
        )}

      </div>

    </div>
  );
}
