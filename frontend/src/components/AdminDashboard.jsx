import React from 'react';
import { Settings, Users, Shield, Server, Activity, Database, CheckCircle2, RefreshCw } from 'lucide-react';

export default function AdminDashboard({ analytics }) {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 py-6">
      
      {/* Header Banner */}
      <div className="glass-card p-6 sm:p-8 rounded-3xl border border-purple-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20 text-xs font-bold uppercase mb-2">
            <Settings className="w-3.5 h-3.5" /> System Control Center
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white italic">Platform Admin Dashboard</h2>
          <p className="text-slate-400 text-xs mt-1">Manage users, review active dispatches, monitor matching engine health.</p>
        </div>

        <div className="bg-emerald-500/10 border border-emerald-500/30 px-4 py-2 rounded-2xl flex items-center gap-3">
          <span className="w-3 h-3 rounded-full bg-emerald-400 animate-ping"></span>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase">System Status</p>
            <p className="text-xs font-black text-emerald-400">FASTAPI & DEMO ENGINE HEALTHY</p>
          </div>
        </div>
      </div>

      {/* Admin Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="glass-card p-6 rounded-3xl border border-slate-800 space-y-2">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-xs font-bold uppercase">Total Users</span>
            <Users className="w-4 h-4 text-purple-400" />
          </div>
          <p className="text-3xl font-black text-white">{analytics?.total_users || 28}</p>
          <p className="text-[11px] text-slate-400">Registered drivers & shippers</p>
        </div>

        <div className="glass-card p-6 rounded-3xl border border-slate-800 space-y-2">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-xs font-bold uppercase">Active Drivers</span>
            <Shield className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-3xl font-black text-emerald-400">{analytics?.total_drivers || 14}</p>
          <p className="text-[11px] text-emerald-400">Verified commercial vehicles</p>
        </div>

        <div className="glass-card p-6 rounded-3xl border border-slate-800 space-y-2">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-xs font-bold uppercase">Active Dispatches</span>
            <Activity className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-3xl font-black text-blue-400">{analytics?.active_shipments || 4}</p>
          <p className="text-[11px] text-blue-400">In corridor matching pipeline</p>
        </div>

        <div className="glass-card p-6 rounded-3xl border border-slate-800 space-y-2">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-xs font-bold uppercase">Completed Deliveries</span>
            <CheckCircle2 className="w-4 h-4 text-teal-400" />
          </div>
          <p className="text-3xl font-black text-teal-400">{analytics?.completed_deliveries || 18}</p>
          <p className="text-[11px] text-teal-400">100% QR verified settlements</p>
        </div>

      </div>

      {/* System Config & Log Audit */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        <div className="glass-card p-6 rounded-3xl border border-slate-800 space-y-4">
          <h4 className="text-base font-extrabold text-white flex items-center gap-2">
            <Database className="w-4 h-4 text-purple-400" /> Environment & Math Model Assumptions
          </h4>

          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3 text-xs">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <span className="text-slate-400 font-bold">FastAPI Server Endpoint</span>
              <span className="text-white font-mono bg-slate-900 px-2 py-1 rounded">http://localhost:8000/api</span>
            </div>
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <span className="text-slate-400 font-bold">Database Driver</span>
              <span className="text-emerald-400 font-bold">MongoDB Async Motor Client / In-Memory Fallback</span>
            </div>
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <span className="text-slate-400 font-bold">Diesel Consumption Assumption</span>
              <span className="text-teal-300 font-bold">0.35 Liters / km (Light Commercial Truck)</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400 font-bold">CO2 Emission Factor</span>
              <span className="text-amber-400 font-bold">2.68 kg CO2 / Liter Diesel</span>
            </div>
          </div>
        </div>

        <div className="glass-card p-6 rounded-3xl border border-slate-800 space-y-4">
          <h4 className="text-base font-extrabold text-white flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-400" /> Live System Event Logs
          </h4>

          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-[11px] font-mono space-y-2 text-slate-400 max-h-56 overflow-y-auto">
            <p className="text-emerald-400">[INFO] FastAPI startup event complete. Seeded 3 demo shipments & 3 demo users.</p>
            <p className="text-blue-400">[MATCH] Calculated Smart Match score 92.4% for shipment #shp_101.</p>
            <p className="text-teal-400">[GPS] Driver ping recorded at lat: 12.9716, lng: 77.5946.</p>
            <p className="text-amber-400">[ESCROW] Lock request approved for ₹1,850. Status: HELD_IN_ESCROW.</p>
            <p className="text-purple-400">[QR] Digital delivery proof verified. Payout released to Ramesh Kumar.</p>
          </div>
        </div>

      </div>

    </div>
  );
}
