'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import QRCode from 'qrcode';

export default function CheckoutPage() {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [qrSrc, setQrSrc] = useState('');
  const [timeLeft, setTimeLeft] = useState('05:00');
  const [status, setStatus] = useState('PENDING');
  const [crawlerLogs, setCrawlerLogs] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const consoleRef = useRef(null);

  // Fetch order initially
  useEffect(() => {
    if (!orderId) return;

    const fetchOrder = async () => {
      try {
        const res = await fetch(`/api/gateway/order/status/${orderId}`);
        const data = await res.json();
        
        if (!res.ok) {
          setError(data.error || 'Payment link not found.');
        } else {
          setOrder(data);
          setStatus(data.status);
          
          // Generate QR Code from UPI URL
          if (data.status === 'PENDING') {
            const qrUrl = await QRCode.toDataURL(data.upiUrl, {
              width: 250,
              margin: 1,
              color: {
                dark: '#0f172a',
                light: '#ffffff'
              }
            });
            setQrSrc(qrUrl);
          }
        }
      } catch (err) {
        setError('Failed to load payment details.');
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId]);

  // Countdown timer logic
  useEffect(() => {
    if (!order || status !== 'PENDING') return;

    const expiryTime = new Date(order.createdAt).getTime() + 5 * 60 * 1000;

    const timer = setInterval(() => {
      const diff = expiryTime - Date.now();
      
      if (diff <= 0) {
        clearInterval(timer);
        setTimeLeft('00:00');
        setStatus('EXPIRED');
      } else {
        const minutes = Math.floor(diff / 60000);
        const seconds = Math.floor((diff % 60000) / 1000);
        setTimeLeft(
          `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
        );
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [order, status]);

  // Background verification polling
  useEffect(() => {
    if (!orderId || status !== 'PENDING') return;

    // Add initial log
    setCrawlerLogs(['[System] Polling verifier initialized. Waiting for credit...']);

    const checkPayment = async () => {
      try {
        // Trigger Paytm dashboard crawler check
        const res = await fetch(`/api/gateway/order/verify/${orderId}`, {
          method: 'POST'
        });
        const data = await res.json();

        if (data.logs) {
          setCrawlerLogs(data.logs);
        }

        if (res.ok && data.success) {
          setStatus('SUCCESS');
          setOrder(prev => prev ? { ...prev, paytmTxnId: data.txnId } : null);
          
          // Trigger redirect after a short delay if configured
          if (order?.redirectUrl) {
            setTimeout(() => {
              window.location.href = `${order.redirectUrl}?status=success&orderId=${orderId}&txnId=${data.txnId}`;
            }, 3000);
          }
        }
      } catch (err) {
        console.error('Crawler polling error:', err);
      }
    };

    // Run immediately, then poll every 5 seconds
    checkPayment();
    const interval = setInterval(checkPayment, 5000);

    return () => clearInterval(interval);
  }, [orderId, status, order?.redirectUrl]);

  // Scroll crawler console to bottom on new logs
  useEffect(() => {
    if (consoleRef.current) {
      consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
    }
  }, [crawlerLogs]);

  if (loading) {
    return (
      <div className="checkout-wrapper">
        <div className="checkout-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
          <span className="spinner" style={{ width: '40px', height: '40px' }}></span>
          <p style={{ color: 'var(--text-muted)' }}>Loading secure gateway checkout...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="checkout-wrapper">
        <div className="checkout-card" style={{ borderColor: 'var(--color-danger)' }}>
          <h2 style={{ color: 'var(--color-danger)', fontSize: '3rem', marginBottom: '1rem' }}>⚠</h2>
          <h3>Payment Link Error</h3>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>{error}</p>
          <a href="/" className="btn btn-sm" style={{ marginTop: '1.5rem' }}>Back to BS Solutions</a>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-wrapper">
      <div className="checkout-card">
        {/* Header */}
        <div className="checkout-header">
          <div className="checkout-brand">BS SOLUTIONS GATEWAY</div>
          <div className="checkout-merchant">{order.merchantBusinessName}</div>
        </div>

        {/* Amount */}
        <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: '600' }}>Amount to Pay</div>
        <div className="checkout-amount">₹{order.amount.toFixed(2)}</div>

        {status === 'PENDING' && (
          <div>
            {/* QR Code */}
            {qrSrc && (
              <div className="qr-container">
                <img src={qrSrc} alt="UPI Payment QR Code" className="qr-image" />
              </div>
            )}

            {/* Instruction */}
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
              Scan QR Code using any UPI App (Paytm, GPay, PhonePe, BHIM)
            </p>

            {/* Timer */}
            <div className="timer-box">
              <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: 'var(--color-warning)', animation: 'pulse 1.5s infinite' }}></span>
              <span>Time Left: {timeLeft}</span>
            </div>

            {/* Deep link button for mobile users */}
            <div style={{ marginTop: '1.25rem' }}>
              <a href={order.upiUrl} className="btn btn-primary btn-sm" style={{ width: '100%' }}>
                📱 Pay via Installed UPI App
              </a>
            </div>

            {/* Realtime Crawler Console */}
            <div style={{ marginTop: '1.75rem', textAlign: 'left' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span className="form-label" style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span className="spinner" style={{ width: '10px', height: '10px' }}></span>
                  Paytm Dashboard Crawler logs
                </span>
                <span style={{ fontSize: '0.75rem', color: '#10b981', fontFamily: 'monospace' }}>ACTIVE</span>
              </div>
              <div className="verify-logs-container" ref={consoleRef}>
                {crawlerLogs.map((log, i) => (
                  <div key={i} className="verify-log-item">{log}</div>
                ))}
              </div>
            </div>
          </div>
        )}

        {status === 'SUCCESS' && (
          <div style={{ padding: '2rem 0' }}>
            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: 'rgba(16, 185, 129, 0.15)',
              border: '3px solid var(--color-success)',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              fontSize: '3rem',
              color: 'var(--color-success)',
              margin: '0 auto 1.5rem',
              animation: 'bounce 1s'
            }}>
              ✔
            </div>
            <h3 style={{ color: 'var(--color-success)', marginBottom: '0.5rem' }}>Payment Successful!</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Paytm Ref ID: <span style={{ fontFamily: 'monospace', color: 'var(--text-main)' }}>{order.paytmTxnId}</span>
            </p>
            
            {order.redirectUrl ? (
              <p style={{ color: 'var(--color-primary)', fontSize: '0.8rem', marginTop: '1.5rem' }}>
                Redirecting you back to merchant website...
              </p>
            ) : (
              <div style={{ marginTop: '2rem' }}>
                <a href="/" className="btn btn-sm">Close Gateway</a>
              </div>
            )}
          </div>
        )}

        {status === 'EXPIRED' && (
          <div style={{ padding: '2rem 0' }}>
            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: 'rgba(239, 68, 68, 0.15)',
              border: '3px solid var(--color-danger)',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              fontSize: '3rem',
              color: 'var(--color-danger)',
              margin: '0 auto 1.5rem'
            }}>
              ✖
            </div>
            <h3 style={{ color: 'var(--color-danger)', marginBottom: '0.5rem' }}>Payment Expired</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              The 5-minute checkout window has closed. Please recreate the order.
            </p>
            <div style={{ marginTop: '2rem' }}>
              <a href="/" className="btn btn-sm">Cancel</a>
            </div>
          </div>
        )}
      </div>

      <style jsx global>{`
        @keyframes pulse {
          0% { opacity: 0.3; }
          50% { opacity: 1; }
          100% { opacity: 0.3; }
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
      `}</style>
    </div>
  );
}
