import React from 'react';
import { Truck, Package, ShieldCheck, BarChart3, Settings, LogIn, LogOut, User, Sparkles } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, user, onOpenAuth, onOpenProfile, onLogout }) {
  return (
    <header className="sticky top-0 z-50 glass-card border-b border-slate-800 bg-slate-950/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand Logo */}
        <div 
          onClick={() => setActiveTab('landing')} 
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-900/40 group-hover:scale-105 transition-all">
            <Truck className="w-6 h-6 text-slate-950 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-white tracking-tight italic">
                Route<span className="text-emerald-400">Nova</span>
              </h1>
              <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-extrabold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full">
                SIH 2024 MVP
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase">
              Smart Rural Logistics
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="hidden md:flex items-center gap-1 bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800">
          <button
            onClick={() => setActiveTab('landing')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'landing' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Home
          </button>

          <button
            onClick={() => setActiveTab('driver')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'driver' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Truck className="w-3.5 h-3.5" />
            Driver Dashboard
          </button>

          <button
            onClick={() => setActiveTab('shipper')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'shipper' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            Shipper Dashboard
          </button>

          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'analytics' ? 'bg-amber-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            Impact & Analytics
          </button>

          <button
            onClick={() => setActiveTab('admin')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'admin' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            Admin
          </button>
        </nav>

        {/* Right Actions / Auth Pill */}
        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-2">
              <button
                onClick={onOpenProfile}
                className="bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl px-3 py-1.5 flex items-center gap-2 transition-all"
                title="View Profile"
              >
                <User className="w-4 h-4 text-emerald-400" />
                <div className="text-left">
                  <p className="text-xs font-bold text-slate-200 line-clamp-1">{user.name}</p>
                  <p className="text-[9px] font-extrabold uppercase text-emerald-400">{user.role}</p>
                </div>
              </button>
              <button
                onClick={onLogout}
                className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-red-400 hover:border-red-500/30 transition-all"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-slate-950 font-black px-4 py-2 rounded-xl text-xs shadow-lg shadow-emerald-950 transition-all flex items-center gap-2"
            >
              <LogIn className="w-4 h-4" />
              Sign In / Register
            </button>
          )}
        </div>

      </div>

      {/* Mobile Tab bar */}
      <div className="md:hidden flex overflow-x-auto border-t border-slate-800/80 px-2 py-2 gap-2 bg-slate-950">
        <button
          onClick={() => setActiveTab('landing')}
          className={`flex-1 py-1.5 px-3 rounded-lg text-[11px] font-bold whitespace-nowrap ${
            activeTab === 'landing' ? 'bg-emerald-600 text-white' : 'text-slate-400 bg-slate-900'
          }`}
        >
          Home
        </button>
        <button
          onClick={() => setActiveTab('driver')}
          className={`flex-1 py-1.5 px-3 rounded-lg text-[11px] font-bold whitespace-nowrap ${
            activeTab === 'driver' ? 'bg-emerald-600 text-white' : 'text-slate-400 bg-slate-900'
          }`}
        >
          Driver
        </button>
        <button
          onClick={() => setActiveTab('shipper')}
          className={`flex-1 py-1.5 px-3 rounded-lg text-[11px] font-bold whitespace-nowrap ${
            activeTab === 'shipper' ? 'bg-blue-600 text-white' : 'text-slate-400 bg-slate-900'
          }`}
        >
          Shipper
        </button>
        <button
          onClick={() => setActiveTab('analytics')}
          className={`flex-1 py-1.5 px-3 rounded-lg text-[11px] font-bold whitespace-nowrap ${
            activeTab === 'analytics' ? 'bg-amber-600 text-white' : 'text-slate-400 bg-slate-900'
          }`}
        >
          Analytics
        </button>
        <button
          onClick={() => setActiveTab('admin')}
          className={`flex-1 py-1.5 px-3 rounded-lg text-[11px] font-bold whitespace-nowrap ${
            activeTab === 'admin' ? 'bg-purple-600 text-white' : 'text-slate-400 bg-slate-900'
          }`}
        >
          Admin
        </button>
      </div>
    </header>
  );
}
