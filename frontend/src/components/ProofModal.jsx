import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Camera, CheckCircle2, QrCode, ShieldCheck, ArrowRight, Lock } from 'lucide-react';

export default function ProofModal({ shipment, onCompleteProof }) {
  const [pickupPhotoCaptured, setPickupPhotoCaptured] = useState(false);
  const [deliveryPhotoCaptured, setDeliveryPhotoCaptured] = useState(false);
  const [qrVerified, setQrVerified] = useState(false);

  const handleSimulatePhoto = (stage) => {
    if (stage === 'pickup') setPickupPhotoCaptured(true);
    if (stage === 'delivery') setDeliveryPhotoCaptured(true);
  };

  const handleVerifyQR = () => {
    setQrVerified(true);
    setTimeout(() => {
      onCompleteProof();
    }, 1200);
  };

  const qrData = JSON.stringify({
    shipment_id: shipment?.id || 'shp_101',
    verification: 'RELEASE_ESCROW_FUNDS',
    verifier: 'Mandya APMC Recipient',
    timestamp: new Date().toISOString()
  });

  return (
    <div className="glass-card p-6 sm:p-8 rounded-3xl border border-emerald-500/30 max-w-xl mx-auto space-y-6 animate-fade-in shadow-2xl">
      <div className="text-center">
        <div className="w-12 h-12 bg-emerald-500/20 text-emerald-400 rounded-2xl flex items-center justify-center mx-auto mb-3">
          <QrCode className="w-6 h-6" />
        </div>
        <h3 className="text-2xl font-black text-white italic">Digital Proof of Delivery Verification</h3>
        <p className="text-xs text-slate-400 mt-1">Capture load photos and scan QR code to release escrow payout.</p>
      </div>

      <div className="space-y-4">
        
        {/* Step 1: Pickup Photo */}
        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
              pickupPhotoCaptured ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-900 text-slate-500'
            }`}>
              {pickupPhotoCaptured ? <CheckCircle2 className="w-5 h-5" /> : <Camera className="w-5 h-5" />}
            </div>
            <div>
              <p className="text-xs font-bold text-white">Step 1: Capture Pickup Photo</p>
              <p className="text-[10px] text-slate-400">Lock demo escrow upon load verification</p>
            </div>
          </div>
          <button
            onClick={() => handleSimulatePhoto('pickup')}
            disabled={pickupPhotoCaptured}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              pickupPhotoCaptured ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-600 hover:bg-emerald-500 text-white'
            }`}
          >
            {pickupPhotoCaptured ? 'Captured ✓' : 'Take Photo'}
          </button>
        </div>

        {/* Step 2: Unpacking Photo */}
        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
              deliveryPhotoCaptured ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-900 text-slate-500'
            }`}>
              {deliveryPhotoCaptured ? <CheckCircle2 className="w-5 h-5" /> : <Camera className="w-5 h-5" />}
            </div>
            <div>
              <p className="text-xs font-bold text-white">Step 2: Capture Delivery Unpacking</p>
              <p className="text-[10px] text-slate-400">Confirm recipient package integrity</p>
            </div>
          </div>
          <button
            onClick={() => handleSimulatePhoto('delivery')}
            disabled={deliveryPhotoCaptured}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              deliveryPhotoCaptured ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-600 hover:bg-emerald-500 text-white'
            }`}
          >
            {deliveryPhotoCaptured ? 'Captured ✓' : 'Take Photo'}
          </button>
        </div>

        {/* Step 3: QR Code Verification Display */}
        {pickupPhotoCaptured && deliveryPhotoCaptured && (
          <div className="bg-slate-950 p-6 rounded-2xl border border-emerald-500/30 text-center space-y-4 animate-fade-in">
            <p className="text-xs font-extrabold uppercase text-emerald-400 tracking-wider">
              Step 3: Scan Recipient QR Code
            </p>

            <div className="bg-white p-4 rounded-2xl inline-block shadow-2xl border-4 border-slate-900">
              <QRCodeSVG value={qrData} size={160} />
            </div>

            <p className="text-[11px] text-slate-400">
              Show this QR code to the recipient or tap button below to simulate scan verification.
            </p>

            <button
              onClick={handleVerifyQR}
              disabled={qrVerified}
              className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-slate-950 font-black py-3.5 rounded-xl text-xs shadow-xl transition-all flex items-center justify-center gap-2"
            >
              <ShieldCheck className="w-4 h-4 stroke-[2.5]" />
              {qrVerified ? 'VERIFYING ESCROW RELEASE...' : 'SIMULATE RECIPIENT QR SCAN'}
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
