'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';

export default function LandingPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [merchantName, setMerchantName] = useState('');

  useEffect(() => {
    const cached = localStorage.getItem('bs_merchant');
    if (cached) {
      try {
        const m = JSON.parse(cached);
        setIsLoggedIn(true);
        setMerchantName(m.businessName);
      } catch (e) {}
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('bs_merchant');
    setIsLoggedIn(false);
    setMerchantName('');
  };

  return (
    <div>
      <nav className="navbar">
        <Link href="/" className="nav-brand">
          BS Solutions
        </Link>
        <div className="nav-links">
          <Link href="/simulator" className="nav-link">Paytm Simulator</Link>
          {isLoggedIn ? (
            <>
              <Link href="/dashboard" className="nav-link">Dashboard ({merchantName})</Link>
              <button onClick={handleLogout} className="btn btn-sm">Logout</button>
            </>
          ) : (
            <Link href="/login" className="btn btn-primary btn-sm">Merchant Login</Link>
          )}
        </div>
      </nav>

      <main className="container">
        <section className="hero">
          <div className="hero-tag">UPI GATEWAY ENGINE</div>
          <h1 className="hero-title">
            The Self-Hosted <span>UPI Gateway</span>
          </h1>
          <p className="hero-subtitle">
            Integrate dynamic UPI payments on your website. Verify transactions instantly by checking your Paytm Business Dashboard credits automatically using secure staff credentials.
          </p>
          <div className="hero-actions">
            {isLoggedIn ? (
              <Link href="/dashboard" className="btn btn-primary">Go to Dashboard</Link>
            ) : (
              <Link href="/login" className="btn btn-primary">Get API Key Now</Link>
            )}
            <Link href="/simulator" className="btn">Open Paytm Simulator</Link>
          </div>
        </section>

        <section style={{ marginTop: '2rem' }}>
          <h2 style={{ textAlign: 'center', marginBottom: '2rem', fontSize: '2rem' }}>Gateway Architecture</h2>
          <div className="features-grid">
            <div className="card">
              <h3 style={{ color: '#3b82f6', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                🔑 Developer API
              </h3>
              <p style={{ color: 'var(--text-muted)' }}>
                Generate secure API keys to integrate payment requests. Execute simple POST requests to initiate payments from your backend.
              </p>
            </div>
            
            <div className="card">
              <h3 style={{ color: '#10b981', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                📱 Dynamic UPI QRs
              </h3>
              <p style={{ color: 'var(--text-muted)' }}>
                Generates instant checkout screens with custom UPI deep links (`upi://pay`), supporting all UPI apps (GPay, PhonePe, Paytm, BHIM) out of the box.
              </p>
            </div>

            <div className="card">
              <h3 style={{ color: '#f59e0b', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                🤖 Crawler Verification
              </h3>
              <p style={{ color: 'var(--text-muted)' }}>
                Automated dashboard verify system checks for credit settlements inside Paytm in real-time, matching transaction amounts and timestamps instantly.
              </p>
            </div>
          </div>
        </section>

        <footer style={{ marginTop: '6rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', borderTop: '1px solid rgba(255,255,255,0.05)', padding: '2rem' }}>
          &copy; {new Date().getFullYear()} BS Solutions. Designed for high performance developers. All rights reserved.
        </footer>
      </main>
    </div>
  );
}
