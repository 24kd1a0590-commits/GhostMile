import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, AreaChart, Area } from 'recharts';
import { BarChart3, TrendingUp, Leaf, Fuel, DollarSign, Award, Truck } from 'lucide-react';

const analyticsData = [
  { month: 'Jan', deliveries: 12, earnings: 28400, fuelSaved: 95, co2Saved: 254.6 },
  { month: 'Feb', deliveries: 19, earnings: 42100, fuelSaved: 142, co2Saved: 380.5 },
  { month: 'Mar', deliveries: 25, earnings: 56800, fuelSaved: 188, co2Saved: 503.8 },
  { month: 'Apr', deliveries: 31, earnings: 71200, fuelSaved: 235, co2Saved: 629.8 },
  { month: 'May', deliveries: 42, earnings: 94500, fuelSaved: 310, co2Saved: 830.8 },
  { month: 'Jun', deliveries: 48, earnings: 112000, fuelSaved: 365, co2Saved: 978.2 }
];

export default function AnalyticsDashboard({ analytics }) {
  const totalRevenue = analytics?.total_revenue_inr || 45200;
  const fuelSaved = analytics?.fuel_saved_liters || 147;
  const co2Saved = analytics?.co2_avoided_kg || 393.96;
  const emptyKmAvoided = analytics?.empty_km_avoided || 420;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 py-6">
      
      {/* Header Banner */}
      <div className="glass-card p-6 sm:p-8 rounded-3xl border border-amber-500/20">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-white italic">Environmental & Economic Impact Dashboard</h2>
            <p className="text-xs text-slate-400">Real-time performance metrics and sustainability analytics.</p>
          </div>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="glass-card p-6 rounded-3xl border border-slate-800 space-y-2">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-xs font-bold uppercase">Empty Return Trips Avoided</span>
            <Truck className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-3xl font-black text-white">{emptyKmAvoided} km</p>
          <p className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" /> +28% efficiency boost
          </p>
        </div>

        <div className="glass-card p-6 rounded-3xl border border-slate-800 space-y-2">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-xs font-bold uppercase">Total Fuel Saved</span>
            <Fuel className="w-4 h-4 text-teal-400" />
          </div>
          <p className="text-3xl font-black text-white">{fuelSaved} L</p>
          <p className="text-[11px] text-teal-400 font-semibold">Avoided diesel waste</p>
        </div>

        <div className="glass-card p-6 rounded-3xl border border-slate-800 space-y-2">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-xs font-bold uppercase">CO2 Emissions Prevented</span>
            <Leaf className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-3xl font-black text-white">{co2Saved} kg</p>
          <p className="text-[11px] text-amber-400 font-semibold">2.68 kg CO2 / L factor</p>
        </div>

        <div className="glass-card p-6 rounded-3xl border border-slate-800 space-y-2">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-xs font-bold uppercase">Added Driver Earnings</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-3xl font-black text-emerald-400">₹{totalRevenue.toLocaleString('en-IN')}</p>
          <p className="text-[11px] text-emerald-400 font-semibold">Direct UPI Payouts</p>
        </div>

      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Monthly Earnings & Deliveries Chart */}
        <div className="glass-card p-6 rounded-3xl border border-slate-800 space-y-4">
          <h4 className="text-base font-extrabold text-white">Monthly Delivery Payout Growth (₹)</h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analyticsData}>
                <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff' }} />
                <Bar dataKey="earnings" fill="#16a34a" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Environmental Impact Chart */}
        <div className="glass-card p-6 rounded-3xl border border-slate-800 space-y-4">
          <h4 className="text-base font-extrabold text-white">Cumulative CO2 Reduction (kg)</h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analyticsData}>
                <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff' }} />
                <Area type="monotone" dataKey="co2Saved" stroke="#14b8a6" fill="#14b8a6" fillOpacity={0.2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

    </div>
  );
}
