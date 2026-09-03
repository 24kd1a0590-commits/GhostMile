import React, { useState } from 'react';
import { Camera, Upload, CheckCircle2, ShieldCheck, QrCode, AlertCircle, ArrowRight, Sparkles, Check } from 'lucide-react';
import confetti from 'canvas-confetti';
import { QRCodeSVG } from 'qrcode.react';
import { api } from '../services/api';

export default function ProofModal({ shipment, onCompleteProof }) {
  const [stage, setStage] = useState('pickup_capture');
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [generatedQrToken, setGeneratedQrToken] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleSimulateCameraCapture = (type) => {
    const demoUrl = type === 'PICKUP'
      ? 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=600&q=80'
      : 'https://images.unsplash.com/photo-1566576721346-d4a3b4eaeb55?auto=format&fit=crop&w=600&q=80';
    setPreviewUrl(demoUrl);
    setSelectedImage({ name: `${type.toLowerCase()}_demo_capture.jpg`, type: 'image/jpeg' });
  };

  const submitPickupProof = async () => {
    setIsSubmitting(true);
    setErrorMsg('');
    try {
      await api.uploadPickupProof({
        shipment_id: shipment.id,
        photo_url: previewUrl,
        image_metadata: {
          file_name: selectedImage?.name || 'pickup_capture.jpg',
          capture_mode: 'DEMO_CAMERA_METADATA',
          timestamp: new Date().toISOString()
        }
      });

      setStage('delivery_capture');
      setPreviewUrl('');
      setSelectedImage(null);
    } catch (err) {
      setErrorMsg(err.message || 'Pickup proof upload failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitDeliveryProof = async () => {
    setIsSubmitting(true);
    setErrorMsg('');
    try {
      const res = await api.uploadDeliveryProof({
        shipment_id: shipment.id,
        photo_url: previewUrl,
        image_metadata: {
          file_name: selectedImage?.name || 'delivery_capture.jpg',
          capture_mode: 'DEMO_CAMERA_METADATA',
          timestamp: new Date().toISOString()
        }
      });

      const qrCodeToken = res.verification_code || `RN-QR-${shipment.id.slice(-6).toUpperCase()}`;
      setGeneratedQrToken(qrCodeToken);
      setVerificationCode(qrCodeToken);
      setStage('qr_verification');
    } catch (err) {
      setErrorMsg(err.message || 'Delivery proof upload failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitQrVerification = async () => {
    setIsSubmitting(true);
    setErrorMsg('');
    try {
      await api.verifyDelivery({
        shipment_id: shipment.id,
        verification_code: verificationCode.trim(),
        verifier_name: 'Mandya APMC Receiver'
      });

      await api.releaseEscrow(shipment.id);

      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#16a34a', '#2563eb', '#fbbf24']
      });

      setStage('success');
      setTimeout(() => {
        if (onCompleteProof) onCompleteProof();
      }, 2000);
    } catch (err) {
      setErrorMsg(err.message || 'Verification failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const txnId = `TXN-RN-${(shipment?.id || '94F8A2').slice(-6).toUpperCase()}`;
  const amount = shipment?.offered_price || shipment?.offered_price_inr || 850;

  return (
    <div className="glass-card p-6 sm:p-8 rounded-3xl border border-emerald-500/30 max-w-xl mx-auto space-y-6 animate-fade-in shadow-2xl">
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-2xl flex items-center justify-center font-black">
            📷
          </div>
          <div>
            <h3 className="font-extrabold text-white text-lg">Digital Proof of Delivery</h3>
            <p className="text-xs text-slate-400">ID: {shipment?.id || 'shp_demo'}</p>
          </div>
        </div>
        <span className="px-3 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded-full text-[10px] font-black uppercase">
          DEMO STORAGE MODE
        </span>
      </div>

      {errorMsg && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs p-3 rounded-xl flex items-center gap-2 font-semibold">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* STEP 1: PICKUP CAPTURE */}
      {stage === 'pickup_capture' && (
        <div className="space-y-4 text-center">
          <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-3">
            <h4 className="text-sm font-black text-white uppercase">Step 1: Capture Pickup Photo</h4>
            <p className="text-xs text-slate-400">
              Photograph loaded cargo at origin hub before starting corridor transit.
            </p>

            {previewUrl ? (
              <div className="relative rounded-xl overflow-hidden border border-emerald-500/40">
                <img src={previewUrl} alt="Pickup Cargo" className="w-full h-48 object-cover" />
                <span className="absolute top-2 left-2 bg-slate-950/80 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded">
                  Preview Ready
                </span>
              </div>
            ) : (
              <div className="border-2 border-dashed border-slate-800 rounded-2xl p-8 space-y-3">
                <Camera className="w-10 h-10 text-slate-600 mx-auto" />
                <div className="flex justify-center gap-3 text-xs">
                  <button
                    onClick={() => handleSimulateCameraCapture('PICKUP')}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-black px-4 py-2 rounded-xl"
                  >
                    Simulate Camera Snap
                  </button>
                  <label className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-black px-4 py-2 rounded-xl cursor-pointer">
                    Upload Photo
                    <input type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
                  </label>
                </div>
              </div>
            )}
          </div>

          <div className="bg-slate-950/50 p-3 rounded-xl text-[11px] text-slate-400 border border-slate-800 flex items-center justify-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>Metadata Logged & Verified via Recipient QR Code</span>
          </div>

          <button
            onClick={submitPickupProof}
            disabled={!previewUrl || isSubmitting}
            className={`w-full py-3.5 rounded-xl font-black text-xs transition-all ${
              previewUrl ? 'bg-emerald-600 text-white hover:bg-emerald-500' : 'bg-slate-800 text-slate-500 cursor-not-allowed'
            }`}
          >
            {isSubmitting ? 'SAVING PICKUP PROOF...' : 'CONFIRM PICKUP & START TRANSIT'}
          </button>
        </div>
      )}

      {/* STEP 2: DELIVERY CAPTURE */}
      {stage === 'delivery_capture' && (
        <div className="space-y-4 text-center">
          <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-3">
            <h4 className="text-sm font-black text-white uppercase">Step 2: Capture Unloading Photo</h4>
            <p className="text-xs text-slate-400">
              Photograph unloaded shipment at rural destination APMC yard.
            </p>

            {previewUrl ? (
              <div className="relative rounded-xl overflow-hidden border border-emerald-500/40">
                <img src={previewUrl} alt="Delivery Cargo" className="w-full h-48 object-cover" />
              </div>
            ) : (
              <div className="border-2 border-dashed border-slate-800 rounded-2xl p-8 space-y-3">
                <Camera className="w-10 h-10 text-slate-600 mx-auto" />
                <div className="flex justify-center gap-3 text-xs">
                  <button
                    onClick={() => handleSimulateCameraCapture('DELIVERY')}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-black px-4 py-2 rounded-xl"
                  >
                    Simulate Camera Snap
                  </button>
                  <label className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-black px-4 py-2 rounded-xl cursor-pointer">
                    Upload Photo
                    <input type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
                  </label>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={submitDeliveryProof}
            disabled={!previewUrl || isSubmitting}
            className={`w-full py-3.5 rounded-xl font-black text-xs transition-all ${
              previewUrl ? 'bg-emerald-600 text-white hover:bg-emerald-500' : 'bg-slate-800 text-slate-500 cursor-not-allowed'
            }`}
          >
            {isSubmitting ? 'GENERATING VERIFICATION QR...' : 'GENERATE RECIPIENT VERIFICATION QR'}
          </button>
        </div>
      )}

      {/* STEP 3: RECIPIENT QR VERIFICATION */}
      {stage === 'qr_verification' && (
        <div className="space-y-6 text-center">
          <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-4">
            <h4 className="text-sm font-black text-white uppercase">Step 3: Recipient QR Code Scan</h4>
            <p className="text-xs text-slate-400">
              Have receiver scan this QR code or input code to release demo escrow payout.
            </p>

            <div className="bg-white p-4 rounded-2xl w-44 h-44 mx-auto flex items-center justify-center shadow-xl">
              <QRCodeSVG value={generatedQrToken || "RN-QR-VERIFY"} size={144} />
            </div>

            <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl">
              <p className="text-[10px] text-slate-400 font-bold uppercase">Verification Token</p>
              <p className="font-mono text-base font-black text-emerald-400">{generatedQrToken}</p>
            </div>
          </div>

          <button
            onClick={submitQrVerification}
            disabled={isSubmitting}
            className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-slate-950 font-black py-4 rounded-xl shadow-xl transition-all text-xs flex items-center justify-center gap-2"
          >
            <ShieldCheck className="w-5 h-5 stroke-[2.5]" />
            VERIFY DELIVERY & RELEASE ESCROW PAYOUT
          </button>
        </div>
      )}

      {/* STEP 4: SUCCESS WITH DEMO ESCROW STATUS */}
      {stage === 'success' && (
        <div className="text-center space-y-6 py-4 animate-fade-in">
          <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto text-3xl shadow-inner">
            🎉
          </div>
          
          <div className="space-y-1">
            <h3 className="text-2xl font-black text-white italic">Delivery Verified & Paid!</h3>
            <p className="text-xs font-mono text-slate-400 font-bold">TXN ID: {txnId}</p>
          </div>

          <div className="bg-slate-950 p-5 rounded-2xl border border-emerald-500/30 space-y-3 text-left">
            <div className="flex justify-between items-center pb-2 border-b border-slate-900">
              <span className="text-xs font-bold text-slate-300">Escrow Status</span>
              <span className="text-xs font-black text-emerald-400 uppercase">RELEASED</span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2 text-emerald-400 font-bold">
                <Check className="w-4 h-4 stroke-[3]" />
                <span>✓ Delivery Verified</span>
              </div>
              <div className="flex items-center gap-2 text-emerald-400 font-bold">
                <Check className="w-4 h-4 stroke-[3]" />
                <span>✓ Payment Released (₹{amount.toLocaleString('en-IN')})</span>
              </div>
            </div>

            <p className="text-[10px] font-extrabold text-amber-400 text-center uppercase tracking-wider pt-2 border-t border-slate-900">
              DEMO PAYMENT — No real money transferred
            </p>
          </div>
        </div>
      )}

    </div>
  );
}
