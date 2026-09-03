import React, { useState } from 'react';
import { Truck, Package, ShieldCheck, Zap, ArrowRight, TrendingUp, Leaf, CheckCircle2, MapPin, Calculator, Award } from 'lucide-react';

export default function LandingPage({ onSelectRole, onOpenAuth }) {
  // Interactive Savings Calculator State
  const [returnKm, setReturnKm] = useState(65);
  const [tripsPerMonth, setTripsPerMonth] = useState(12);

  const fuelSavedLiters = Math.round(returnKm * 0.35 * tripsPerMonth);
  const earningsExtraINR = Math.round(returnKm * 28 * tripsPerMonth);
  const co2AvoidedKg = Math.round(fuelSavedLiters * 2.68);

  return (
    <div className="space-y-20 pb-12">
      
      {/* HERO SECTION */}
      <section className="relative overflow-hidden pt-8 pb-16 md:pt-16 md:pb-24">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-gradient-to-tr from-emerald-600/20 via-teal-500/10 to-transparent blur-3xl rounded-full pointer-events-none -z-10"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          
          <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider mb-8 animate-pulse-glow">
            <Zap className="w-4 h-4" /> AI-Powered Rural Micro-Logistics Engine
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-white tracking-tight max-w-4xl mx-auto leading-[1.1] mb-6">
            Stop Returning Empty. <br />
            <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-500 bg-clip-text text-transparent italic">
              Monetize Unused Truck Capacity.
            </span>
          </h1>

          <p className="text-slate-300 text-base sm:text-lg max-w-2xl mx-auto mb-10 font-medium leading-relaxed">
            RouteNova algorithmically connects commercial drivers returning on empty routes with rural farmers, suppliers, and small businesses needing affordable micro-shipments.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto mb-16">
            <button
              onClick={() => onSelectRole('driver')}
              className="w-full sm:w-auto flex-1 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-slate-950 font-black px-8 py-4 rounded-2xl shadow-xl shadow-emerald-950/50 hover:scale-[1.02] transition-all flex items-center justify-center gap-3 text-sm"
            >
              <Truck className="w-5 h-5 stroke-[2.5]" />
              Driver Portal (Earn More)
            </button>
            <button
              onClick={() => onSelectRole('shipper')}
              className="w-full sm:w-auto flex-1 bg-slate-900 hover:bg-slate-800 text-white border border-slate-700 font-extrabold px-8 py-4 rounded-2xl shadow-lg hover:scale-[1.02] transition-all flex items-center justify-center gap-3 text-sm"
            >
              <Package className="w-5 h-5 text-blue-400" />
              Shipper Portal (Send Load)
            </button>
          </div>

          {/* Key Metric Tickers */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-5xl mx-auto">
            <div className="glass-card p-6 rounded-3xl border border-slate-800/80">
              <p className="text-3xl font-black text-emerald-400">92.4%</p>
              <p className="text-xs font-bold text-slate-400 uppercase mt-1">Smart Route Accuracy</p>
            </div>
            <div className="glass-card p-6 rounded-3xl border border-slate-800/80">
              <p className="text-3xl font-black text-teal-300">₹45,200+</p>
              <p className="text-xs font-bold text-slate-400 uppercase mt-1">Added Driver Earnings</p>
            </div>
            <div className="glass-card p-6 rounded-3xl border border-slate-800/80">
              <p className="text-3xl font-black text-amber-400">147 Liters</p>
              <p className="text-xs font-bold text-slate-400 uppercase mt-1">Fuel Waste Eliminated</p>
            </div>
            <div className="glass-card p-6 rounded-3xl border border-slate-800/80">
              <p className="text-3xl font-black text-emerald-300">394 kg</p>
              <p className="text-xs font-bold text-slate-400 uppercase mt-1">CO2 Emissions Avoided</p>
            </div>
          </div>

        </div>
      </section>

      {/* PROBLEM vs SOLUTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-xs font-extrabold text-emerald-400 uppercase tracking-widest mb-2">The Logistics Gap</h2>
          <h3 className="text-3xl font-black text-white">Why Rural Logistics is Broken in India</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Problem Card */}
          <div className="bg-red-950/20 border border-red-900/30 p-8 rounded-3xl relative overflow-hidden">
            <div className="w-12 h-12 bg-red-900/30 text-red-400 rounded-2xl flex items-center justify-center mb-6">
              <Truck className="w-6 h-6" />
            </div>
            <h4 className="text-xl font-bold text-white mb-4">Traditional Status Quo</h4>
            <ul className="space-y-3 text-slate-300 text-sm">
              <li className="flex items-start gap-3">
                <span className="text-red-400 font-bold">✕</span>
                Over 40% of rural commercial trucks return completely empty after drop-off.
              </li>
              <li className="flex items-start gap-3">
                <span className="text-red-400 font-bold">✕</span>
                Farmers and small traders pay exorbitant rates for small batch transport.
              </li>
              <li className="flex items-start gap-3">
                <span className="text-red-400 font-bold">✕</span>
                Severe fuel wastage, increased road congestion, and unnecessary CO2 emissions.
              </li>
            </ul>
          </div>

          {/* Solution Card */}
          <div className="bg-emerald-950/20 border border-emerald-500/30 p-8 rounded-3xl relative overflow-hidden">
            <div className="w-12 h-12 bg-emerald-500/20 text-emerald-400 rounded-2xl flex items-center justify-center mb-6">
              <Zap className="w-6 h-6" />
            </div>
            <h4 className="text-xl font-bold text-white mb-4">The RouteNova Solution</h4>
            <ul className="space-y-3 text-slate-300 text-sm">
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                Algorithmic route corridor matching without adding significant detours.
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                Affordable micro-shipment rates for agricultural produce and inputs.
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                Digital QR proof of delivery with instant UPI demo escrow settlement.
              </li>
            </ul>
          </div>

        </div>
      </section>

      {/* INTERACTIVE CALCULATOR */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="glass-card p-8 sm:p-12 rounded-3xl border border-emerald-500/20 shadow-2xl relative overflow-hidden">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-2xl font-black text-white">Interactive Earnings & Impact Simulator</h3>
              <p className="text-xs text-slate-400">Calculate how much a driver can earn on return trips while saving fuel.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="space-y-6">
              <div>
                <div className="flex justify-between text-xs font-extrabold text-slate-300 mb-2">
                  <span>Return Trip Distance (km)</span>
                  <span className="text-emerald-400">{returnKm} km</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="200"
                  value={returnKm}
                  onChange={(e) => setReturnKm(Number(e.target.value))}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-extrabold text-slate-300 mb-2">
                  <span>Trips Per Month</span>
                  <span className="text-emerald-400">{tripsPerMonth} trips</span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="30"
                  value={tripsPerMonth}
                  onChange={(e) => setTripsPerMonth(Number(e.target.value))}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
              </div>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-2xl space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-slate-800">
                <span className="text-xs text-slate-400 font-bold uppercase">Estimated Extra Monthly Income</span>
                <span className="text-2xl font-black text-emerald-400">₹{earningsExtraINR.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-slate-800">
                <span className="text-xs text-slate-400 font-bold uppercase">Fuel Saved</span>
                <span className="text-lg font-black text-teal-300">{fuelSavedLiters} Liters</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-400 font-bold uppercase">CO2 Prevented</span>
                <span className="text-lg font-black text-amber-400">{co2AvoidedKg} kg</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-xs font-extrabold text-emerald-400 uppercase tracking-widest mb-2">4-Step Workflow</h2>
          <h3 className="text-3xl font-black text-white">How RouteNova Works</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl text-center space-y-3">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-emerald-500/10 text-emerald-400 font-black text-lg flex items-center justify-center">1</div>
            <h4 className="font-bold text-white text-base">Route Registration</h4>
            <p className="text-xs text-slate-400 leading-relaxed">Driver inputs scheduled return route and available truck payload capacity.</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl text-center space-y-3">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-teal-500/10 text-teal-400 font-black text-lg flex items-center justify-center">2</div>
            <h4 className="font-bold text-white text-base">Smart Match AI</h4>
            <p className="text-xs text-slate-400 leading-relaxed">Matching algorithm scores nearby shipments based on detour corridor & payload weight.</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl text-center space-y-3">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-blue-500/10 text-blue-400 font-black text-lg flex items-center justify-center">3</div>
            <h4 className="font-bold text-white text-base">Demo Escrow Lock</h4>
            <p className="text-xs text-slate-400 leading-relaxed">Shipper funds are held safely in escrow upon pickup photo verification.</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl text-center space-y-3">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-amber-500/10 text-amber-400 font-black text-lg flex items-center justify-center">4</div>
            <h4 className="font-bold text-white text-base">QR Release</h4>
            <p className="text-xs text-slate-400 leading-relaxed">Recipient scans driver QR code at destination to instantly release UPI payout.</p>
          </div>
        </div>
      </section>

      {/* CTA BANNER */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 border border-emerald-500/30 p-10 sm:p-14 rounded-3xl text-center space-y-6 shadow-2xl relative overflow-hidden">
          <h3 className="text-3xl sm:text-4xl font-black text-white">Ready to Revolutionize Rural Transport?</h3>
          <p className="text-slate-300 text-sm max-w-xl mx-auto">Experience the SIH 2024 RouteNova Platform live.</p>
          <button
            onClick={onOpenAuth}
            className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-8 py-4 rounded-2xl text-sm shadow-xl hover:scale-105 transition-all inline-flex items-center gap-2"
          >
            Get Started <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>

    </div>
  );
}
