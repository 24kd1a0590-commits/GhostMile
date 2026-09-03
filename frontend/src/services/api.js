const API_BASE_URL = 'http://localhost:8000/api';

const getHeaders = () => {
  const token = localStorage.getItem('routenova_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
};

export const api = {
  // Authentication APIs
  login: async (email, password) => {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || 'Login failed.');
    
    localStorage.setItem('routenova_token', data.access_token);
    localStorage.setItem('routenova_user', JSON.stringify(data));
    return data;
  },

  register: async (userData) => {
    const res = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    const data = await res.json();
    if (!res.ok) {
      if (Array.isArray(data.detail)) {
        const msg = data.detail.map(d => d.msg).join(', ');
        throw new Error(msg);
      }
      throw new Error(data.detail || 'Registration failed.');
    }
    
    localStorage.setItem('routenova_token', data.access_token);
    localStorage.setItem('routenova_user', JSON.stringify(data));
    return data;
  },

  getCurrentUser: async () => {
    const token = localStorage.getItem('routenova_token');
    if (!token) return null;

    try {
      const res = await fetch(`${API_BASE_URL}/users/me`, { headers: getHeaders() });
      if (!res.ok) {
        localStorage.removeItem('routenova_token');
        localStorage.removeItem('routenova_user');
        return null;
      }
      return await res.json();
    } catch (e) {
      const cached = localStorage.getItem('routenova_user');
      return cached ? JSON.parse(cached) : null;
    }
  },

  logout: async () => {
    try {
      await fetch(`${API_BASE_URL}/auth/logout`, { method: 'POST', headers: getHeaders() });
    } catch (e) {}
    localStorage.removeItem('routenova_token');
    localStorage.removeItem('routenova_user');
  },

  // Full Shipment CRUD APIs
  createShipment: async (shipmentData) => {
    const res = await fetch(`${API_BASE_URL}/shipments`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(shipmentData)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || 'Create shipment failed.');
    return data;
  },

  getShipments: async (filters = {}) => {
    let queryParams = [];
    if (filters.status) queryParams.push(`status=${encodeURIComponent(filters.status)}`);
    if (filters.shipper_id) queryParams.push(`shipper_id=${encodeURIComponent(filters.shipper_id)}`);
    if (filters.driver_id) queryParams.push(`driver_id=${encodeURIComponent(filters.driver_id)}`);
    
    const queryString = queryParams.length > 0 ? `?${queryParams.join('&')}` : '';
    const res = await fetch(`${API_BASE_URL}/shipments${queryString}`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch shipments.');
    return await res.json();
  },

  getShipmentById: async (shipmentId) => {
    const res = await fetch(`${API_BASE_URL}/shipments/${shipmentId}`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Shipment not found.');
    return await res.json();
  },

  updateShipment: async (shipmentId, updateData) => {
    const res = await fetch(`${API_BASE_URL}/shipments/${shipmentId}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(updateData)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || 'Failed to update shipment.');
    return data;
  },

  deleteShipment: async (shipmentId) => {
    const res = await fetch(`${API_BASE_URL}/shipments/${shipmentId}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || 'Failed to delete shipment.');
    return data;
  },

  acceptShipment: async (shipmentId) => {
    const res = await fetch(`${API_BASE_URL}/shipments/${shipmentId}/accept`, {
      method: 'POST',
      headers: getHeaders()
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || 'Failed to accept shipment.');
    return data;
  },

  // RouteNova Smart Matching Engine
  getRecommendedMatches: async (params = {}) => {
    const sortBy = params.sort_by || 'match_score';
    const currLat = params.curr_lat || 12.9716;
    const currLng = params.curr_lng || 77.5946;
    const destLat = params.dest_lat || 12.5218;
    const destLng = params.dest_lng || 76.8951;
    const availableCap = params.available_capacity || 400.0;
    const truckCap = params.truck_capacity || 500.0;

    const url = `${API_BASE_URL}/matches?sort_by=${sortBy}&curr_lat=${currLat}&curr_lng=${currLng}&dest_lat=${destLat}&dest_lng=${destLng}&available_capacity=${availableCap}&truck_capacity=${truckCap}`;
    
    const res = await fetch(url, { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to compute smart matches.');
    return await res.json();
  },

  // Live Tracking
  sendTrackingPing: async (pingData) => {
    try {
      await fetch(`${API_BASE_URL}/tracking`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(pingData)
      });
    } catch (e) {}
  },

  getTrackingState: async (shipmentId) => {
    const res = await fetch(`${API_BASE_URL}/tracking/${shipmentId}`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Get tracking state failed');
    return await res.json();
  },

  // Digital Proof of Delivery APIs
  uploadPickupProof: async (proofData) => {
    const res = await fetch(`${API_BASE_URL}/proofs/pickup`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(proofData)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || 'Pickup proof upload failed');
    return data;
  },

  uploadDeliveryProof: async (proofData) => {
    const res = await fetch(`${API_BASE_URL}/proofs/delivery`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(proofData)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || 'Delivery proof upload failed');
    return data;
  },

  verifyDelivery: async (verifyData) => {
    const res = await fetch(`${API_BASE_URL}/proofs/verify`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(verifyData)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || 'QR verification failed');
    return data;
  },

  // DEMO Escrow & Payment Lifecycle APIs
  initiateEscrow: async (shipmentId, amountInr) => {
    const res = await fetch(`${API_BASE_URL}/payments/escrow`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ shipment_id: shipmentId, amount_inr: amountInr })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || 'Escrow initiation failed');
    return data;
  },

  releaseEscrow: async (shipmentId) => {
    const res = await fetch(`${API_BASE_URL}/payments/release`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ shipment_id: shipmentId })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || 'Payment release failed');
    return data;
  },

  getPaymentDetails: async (shipmentId) => {
    const res = await fetch(`${API_BASE_URL}/payments/${shipmentId}`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch payment details');
    return await res.json();
  },

  // Environmental Analytics Engine APIs
  getEnvironmentalAnalytics: async (params = {}) => {
    const eff = params.fuel_efficiency || 8.5;
    const factor = params.emission_factor || 2.68;
    const res = await fetch(`${API_BASE_URL}/analytics/environmental?fuel_efficiency=${eff}&emission_factor=${factor}`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Fetch environmental analytics failed');
    return await res.json();
  },

  // System Analytics
  getAnalytics: async () => {
    const res = await fetch(`${API_BASE_URL}/analytics`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Fetch analytics failed');
    return await res.json();
  }
};
