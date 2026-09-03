import React from 'react';
import { Home, Compass, Package, Activity, User, LogIn, Truck } from 'lucide-react';

export default function MobileBottomNav({ activeTab, setActiveTab, user, onOpenAuth, onOpenProfile }) {
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-slate-950/95 backdrop-blur-xl border-t border-slate-800 px-2 py-2 shadow-2xl">
      <div className="grid grid-cols-5 gap-1 text-center">
        
        {/* Home */}
        <button
          onClick={() => setActiveTab('landing')}
          className={`flex flex-col items-center justify-center py-1.5 rounded-xl transition-all ${
            activeTab === 'landing' ? 'text-emerald-400 font-bold bg-slate-900' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Home className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">Home</span>
        </button>

        {/* Matches */}
        <button
          onClick={() => setActiveTab('driver')}
          className={`flex flex-col items-center justify-center py-1.5 rounded-xl transition-all ${
            activeTab === 'driver' ? 'text-emerald-400 font-bold bg-slate-900' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Truck className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">Matches</span>
        </button>

        {/* Shipments */}
        <button
          onClick={() => setActiveTab('shipper')}
          className={`flex flex-col items-center justify-center py-1.5 rounded-xl transition-all ${
            activeTab === 'shipper' ? 'text-blue-400 font-bold bg-slate-900' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Package className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">Shipments</span>
        </button>

        {/* Impact & Tracking */}
        <button
          onClick={() => setActiveTab('analytics')}
          className={`flex flex-col items-center justify-center py-1.5 rounded-xl transition-all ${
            activeTab === 'analytics' ? 'text-amber-400 font-bold bg-slate-900' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Activity className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">Impact</span>
        </button>

        {/* Profile / Auth */}
        {user ? (
          <button
            onClick={onOpenProfile}
            className="flex flex-col items-center justify-center py-1.5 rounded-xl text-slate-400 hover:text-white transition-all"
          >
            <User className="w-5 h-5 mb-0.5 text-emerald-400" />
            <span className="text-[10px] truncate max-w-[50px]">{user.name.split(' ')[0]}</span>
          </button>
        ) : (
          <button
            onClick={onOpenAuth}
            className="flex flex-col items-center justify-center py-1.5 rounded-xl text-emerald-400 hover:text-emerald-300 font-bold transition-all"
          >
            <LogIn className="w-5 h-5 mb-0.5" />
            <span className="text-[10px]">Login</span>
          </button>
        )}

      </div>
    </div>
  );
}
