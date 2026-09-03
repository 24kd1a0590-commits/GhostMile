import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import LandingPage from './components/LandingPage';
import AuthModal from './components/AuthModal';
import UserProfileModal from './components/UserProfileModal';
import DriverDashboard from './components/DriverDashboard';
import ShipperDashboard from './components/ShipperDashboard';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import AdminDashboard from './components/AdminDashboard';
import { api } from './services/api';
import { ShieldAlert, ArrowRight } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('landing');
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [shipments, setShipments] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [roleWarning, setRoleWarning] = useState(null);

  // Initial load
  useEffect(() => {
    initUserSession();
    fetchData();
  }, []);

  const initUserSession = async () => {
    const token = localStorage.getItem('routenova_token');
    if (token) {
      try {
        const u = await api.getCurrentUser();
        if (u) {
          setUser(u);
          setUserProfile(u);
        }
      } catch (e) {
        console.warn("Session restore failed", e);
      }
    }
  };

  const fetchData = async () => {
    try {
      const shps = await api.getShipments();
      setShipments(shps);
      const stats = await api.getAnalytics();
      setAnalytics(stats);
    } catch (e) {
      console.warn("Error fetching data from API", e);
    }
  };

  const handleLogin = async (email, password) => {
    const authData = await api.login(email, password);
    setUser(authData);
    const profile = await api.getCurrentUser();
    setUserProfile(profile || authData);
    fetchData();

    if (authData.role === 'driver') {
      setActiveTab('driver');
    } else if (authData.role === 'shipper') {
      setActiveTab('shipper');
    } else if (authData.role === 'admin') {
      setActiveTab('admin');
    }
  };

  const handleRegister = async (userData) => {
    const authData = await api.register(userData);
    setUser(authData);
    const profile = await api.getCurrentUser();
    setUserProfile(profile || authData);
    fetchData();

    if (authData.role === 'driver') {
      setActiveTab('driver');
    } else if (authData.role === 'shipper') {
      setActiveTab('shipper');
    } else if (authData.role === 'admin') {
      setActiveTab('admin');
    }
  };

  const handleLogout = async () => {
    await api.logout();
    setUser(null);
    setUserProfile(null);
    setActiveTab('landing');
    setRoleWarning(null);
  };

  const handleTabChange = (targetTab) => {
    setRoleWarning(null);

    if (targetTab === 'landing' || targetTab === 'analytics') {
      setActiveTab(targetTab);
      return;
    }

    if (!user) {
      setIsAuthOpen(true);
      return;
    }

    const role = user.role;

    if (targetTab === 'driver' && role !== 'driver' && role !== 'admin') {
      setRoleWarning({
        title: 'Driver Dashboard Restricted',
        message: `You are logged in as a ${role.toUpperCase()}. Only DRIVERS can access the Driver Route Optimizer.`,
        suggestedTab: role === 'shipper' ? 'shipper' : 'admin'
      });
      setActiveTab('restricted');
      return;
    }

    if (targetTab === 'shipper' && role !== 'shipper' && role !== 'admin') {
      setRoleWarning({
        title: 'Shipper Dashboard Restricted',
        message: `You are logged in as a ${role.toUpperCase()}. Only SHIPPERS can dispatch new loads.`,
        suggestedTab: role === 'driver' ? 'driver' : 'admin'
      });
      setActiveTab('restricted');
      return;
    }

    if (targetTab === 'admin' && role !== 'admin') {
      setRoleWarning({
        title: 'Admin Control Center Restricted',
        message: `System Admin privileges required. Your current account role is ${role.toUpperCase()}.`,
        suggestedTab: role === 'driver' ? 'driver' : 'shipper'
      });
      setActiveTab('restricted');
      return;
    }

    setActiveTab(targetTab);
  };

  const handleCreateShipment = async (shipmentData) => {
    await api.createShipment(shipmentData);
    fetchData();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-emerald-500 selection:text-slate-950">
      
      <div>
        <Navbar
          activeTab={activeTab === 'restricted' ? (user?.role || 'landing') : activeTab}
          setActiveTab={handleTabChange}
          user={user}
          onOpenAuth={() => setIsAuthOpen(true)}
          onOpenProfile={() => setIsProfileOpen(true)}
          onLogout={handleLogout}
        />

        <main className="animate-fade-in">
          {activeTab === 'landing' && (
            <LandingPage
              onSelectRole={(role) => handleTabChange(role)}
              onOpenAuth={() => setIsAuthOpen(true)}
            />
          )}

          {activeTab === 'driver' && (
            <DriverDashboard
              user={user}
              shipments={shipments}
              onRefreshShipments={fetchData}
            />
          )}

          {activeTab === 'shipper' && (
            <ShipperDashboard
              user={user}
              shipments={shipments}
              onCreateShipment={handleCreateShipment}
              onSelectShipmentToTrack={(shp) => setActiveTab('driver')}
              onRefreshShipments={fetchData}
            />
          )}

          {activeTab === 'analytics' && (
            <AnalyticsDashboard analytics={analytics} />
          )}

          {activeTab === 'admin' && (
            <AdminDashboard analytics={analytics} />
          )}

          {activeTab === 'restricted' && roleWarning && (
            <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-6 animate-fade-in">
              <div className="w-20 h-20 bg-red-500/10 border border-red-500/30 text-red-400 rounded-3xl flex items-center justify-center mx-auto shadow-2xl">
                <ShieldAlert className="w-10 h-10" />
              </div>
              <h2 className="text-3xl font-black text-white italic">{roleWarning.title}</h2>
              <p className="text-slate-300 text-sm max-w-md mx-auto leading-relaxed">
                {roleWarning.message}
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                <button
                  onClick={() => setActiveTab(roleWarning.suggestedTab)}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-black px-6 py-3.5 rounded-2xl text-xs shadow-lg transition-all flex items-center gap-2"
                >
                  GO TO YOUR {roleWarning.suggestedTab.toUpperCase()} DASHBOARD <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={handleLogout}
                  className="bg-slate-900 border border-slate-700 hover:bg-slate-800 text-slate-300 font-extrabold px-6 py-3.5 rounded-2xl text-xs transition-all"
                >
                  LOG OUT & SWITCH ACCOUNT
                </button>
              </div>
            </div>
          )}
        </main>
      </div>

      <Footer />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onLogin={handleLogin}
        onRegister={handleRegister}
      />

      <UserProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        profile={userProfile}
        onLogout={handleLogout}
      />

    </div>
  );
}
