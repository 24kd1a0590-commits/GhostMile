import React from 'react';
import { X, User, Mail, Phone, ShieldCheck, Truck, Calendar, Key } from 'lucide-react';

export default function UserProfileModal({ isOpen, onClose, profile, onLogout }) {
  if (!isOpen || !profile) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-3xl p-6 sm:p-8 shadow-2xl relative">
        
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-2 rounded-xl bg-slate-800/50 hover:bg-slate-800 transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 font-black rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg text-xl">
            {profile.name ? profile.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <h3 className="text-2xl font-black text-white">{profile.name}</h3>
          <span className="inline-block mt-1 px-3 py-0.5 text-xs font-black uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-full">
            {profile.role} ACCOUNT
          </span>
        </div>

        <div className="space-y-3 bg-slate-950 p-4 rounded-2xl border border-slate-800 text-xs text-slate-300">
          
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <span className="text-slate-500 font-bold flex items-center gap-2">
              <Mail className="w-4 h-4 text-emerald-400" /> Email Address
            </span>
            <span className="font-semibold text-white">{profile.email}</span>
          </div>

          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <span className="text-slate-500 font-bold flex items-center gap-2">
              <Phone className="w-4 h-4 text-teal-400" /> Phone Number
            </span>
            <span className="font-semibold text-white">{profile.phone || '+91 9876543210'}</span>
          </div>

          {profile.role === 'driver' && (
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-slate-500 font-bold flex items-center gap-2">
                <Truck className="w-4 h-4 text-amber-400" /> Vehicle
              </span>
              <span className="font-semibold text-white">{profile.vehicle_type || 'Light Commercial Truck'} ({profile.vehicle_capacity_kg || 500}kg)</span>
            </div>
          )}

          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-bold flex items-center gap-2">
              <Key className="w-4 h-4 text-purple-400" /> Authentication
            </span>
            <span className="text-emerald-400 font-bold">JWT Bearer Token Active</span>
          </div>

        </div>

        <button
          onClick={() => { onLogout(); onClose(); }}
          className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 font-extrabold py-3 rounded-xl text-xs shadow-md transition-all mt-6"
        >
          LOG OUT OF ROUTENOVA
        </button>

      </div>
    </div>
  );
}
