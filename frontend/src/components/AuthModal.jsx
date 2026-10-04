import React, { useState } from 'react';
import { X, Truck, Package, Shield, UserCheck, KeyRound, Mail, Phone, Lock, AlertCircle } from 'lucide-react';

export default function AuthModal({ isOpen, onClose, onLogin, onRegister }) {
  const [isRegister, setIsRegister] = useState(false);
  const [role, setRole] = useState('driver');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const validateInputs = () => {
    setError('');
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^\+?[0-9\s\-]{8,16}$/;

    if (!email || !emailRegex.test(email.trim())) {
      setError('Please enter a valid email address (e.g. user@domain.com)');
      return false;
    }

    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters long');
      return false;
    }

    if (isRegister) {
      if (!name || name.trim().length < 2) {
        setError('Full Name is required (minimum 2 characters)');
        return false;
      }

      if (!phone || !phoneRegex.test(phone.trim())) {
        setError('Please enter a valid phone number (8 to 16 digits)');
        return false;
      }

      if (!['driver', 'shipper', 'admin'].includes(role)) {
        setError('Please select a valid role (Driver, Shipper, or Admin)');
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateInputs()) return;

    setLoading(true);
    setError('');
    try {
      if (isRegister) {
        await onRegister({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          phone: phone.trim(),
          password,
          role
        });
      } else {
        await onLogin(email.trim().toLowerCase(), password);
      }
      onClose();
    } catch (err) {
      setError(err.message || 'Authentication failed. Please check inputs.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-3xl p-6 sm:p-8 shadow-2xl relative">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-2 rounded-xl bg-slate-800/50 hover:bg-slate-800 transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-emerald-500/20 text-emerald-400 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <KeyRound className="w-6 h-6" />
          </div>
          <h3 className="text-2xl font-black text-white">
            {isRegister ? 'Register New Account' : 'Sign In to RouteNova'}
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            JWT Production Authentication & RBAC Engine
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-slate-950 p-1 rounded-2xl mb-6 border border-slate-800">
          <button
            type="button"
            onClick={() => { setIsRegister(false); setError(''); }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
              !isRegister ? 'bg-slate-800 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setIsRegister(true); setError(''); }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
              isRegister ? 'bg-slate-800 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Register
          </button>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs p-3 rounded-xl mb-4 flex items-start gap-2 font-semibold">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {isRegister && (
            <>
              <div>
                <label className="text-[11px] font-bold text-slate-300 uppercase block mb-1">Select User Role</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setRole('driver')}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition-all flex flex-col items-center gap-1 ${
                      role === 'driver' ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400' : 'border-slate-800 bg-slate-950 text-slate-400'
                    }`}
                  >
                    <Truck className="w-4 h-4" /> Driver
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('shipper')}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition-all flex flex-col items-center gap-1 ${
                      role === 'shipper' ? 'border-blue-500 bg-blue-500/10 text-blue-400' : 'border-slate-800 bg-slate-950 text-slate-400'
                    }`}
                  >
                    <Package className="w-4 h-4" /> Shipper
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('admin')}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition-all flex flex-col items-center gap-1 ${
                      role === 'admin' ? 'border-purple-500 bg-purple-500/10 text-purple-400' : 'border-slate-800 bg-slate-950 text-slate-400'
                    }`}
                  >
                    <Shield className="w-4 h-4" /> Admin
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-300 uppercase block mb-1">Full Name</label>
                <div className="relative">
                  <UserCheck className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Ramesh Kumar"
                    className="w-full bg-slate-950 border border-slate-800 pl-10 pr-4 py-3 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-300 uppercase block mb-1">Phone Number</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 9876543210"
                    className="w-full bg-slate-950 border border-slate-800 pl-10 pr-4 py-3 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <label className="text-[11px] font-bold text-slate-300 uppercase block mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@routenova.in"
                className="w-full bg-slate-950 border border-slate-800 pl-10 pr-4 py-3 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-300 uppercase block mb-1">Password (min 6 chars)</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-950 border border-slate-800 pl-10 pr-4 py-3 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-slate-950 font-black py-3.5 rounded-xl text-xs shadow-xl transition-all mt-4 flex items-center justify-center gap-2"
          >
            {loading ? 'AUTHENTICATING...' : isRegister ? 'CREATE ACCOUNT & GENERATE JWT' : 'SIGN IN TO DASHBOARD'}
          </button>
        </form>

      </div>
    </div>
  );
}
