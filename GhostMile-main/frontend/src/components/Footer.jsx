import React from 'react';
import { Truck, Leaf, Shield, Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-slate-950 border-t border-slate-800 pt-12 pb-8 text-slate-400 text-sm mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-slate-950">
                <Truck className="w-5 h-5 stroke-[2.5]" />
              </div>
              <span className="text-xl font-black text-white italic">Route<span className="text-emerald-400">Nova</span></span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed max-w-md">
              RouteNova transforms rural micro-logistics in India by algorithmically matching unused return truck capacity with local farmers, cooperatives, and small businesses needing affordable transportation.
            </p>
            <div className="flex items-center gap-4 mt-4 text-xs font-semibold text-emerald-400">
              <span className="flex items-center gap-1"><Leaf className="w-4 h-4" /> Zero Empty Trips</span>
              <span className="flex items-center gap-1"><Shield className="w-4 h-4" /> Guaranteed Escrow</span>
            </div>
          </div>

          <div>
            <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-4">Platform Modules</h4>
            <ul className="space-y-2 text-xs">
              <li><a href="#matching" className="hover:text-emerald-400 transition-colors">Smart Matching Engine</a></li>
              <li><a href="#tracking" className="hover:text-emerald-400 transition-colors">Live GPS Corridor Tracking</a></li>
              <li><a href="#escrow" className="hover:text-emerald-400 transition-colors">Digital QR Proof of Delivery</a></li>
              <li><a href="#impact" className="hover:text-emerald-400 transition-colors">CO2 & Fuel Analytics</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-4">Hackathon Info</h4>
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
              <p className="text-xs font-extrabold text-white mb-1">Smart India Hackathon 2024</p>
              <p className="text-[11px] text-slate-400 mb-2">Category: Logistics & Supply Chain</p>
              <span className="inline-block px-2.5 py-1 text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full">
                Production-Ready Prototype
              </span>
            </div>
          </div>

        </div>

        <div className="border-t border-slate-900 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© 2024 RouteNova Team. Built for Smart India Hackathon.</p>
          <p className="flex items-center gap-1">
            Engineered with <Heart className="w-3.5 h-3.5 text-emerald-500 fill-emerald-500" /> React, FastAPI & Leaflet
          </p>
        </div>
      </div>
    </footer>
  );
}
