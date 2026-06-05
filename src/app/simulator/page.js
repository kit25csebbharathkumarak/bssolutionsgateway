'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

export default function PaytmSimulator() {
  const [mid, setMid] = useState('');
  const [amount, setAmount] = useState('10.00');
  const [senderName, setSenderName] = useState('Bhavesh Sharma');
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [listLoading, setListLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Prefill MID if logged in as merchant
  useEffect(() => {
    const cached = localStorage.getItem('bs_merchant');
    if (cached) {
      try {
        const m = JSON.parse(cached);
        if (m.paytmMID) {
          setMid(m.paytmMID);
        }
      } catch (e) {}
    }
  }, []);

  // Poll transactions list when MID changes
  useEffect(() => {
    if (!mid) return;
    
    fetchSimulatorTransactions();
    const interval = setInterval(fetchSimulatorTransactions, 4000);
    return () => clearInterval(interval);
  }, [mid]);

  const fetchSimulatorTransactions = async () => {
    if (!mid) return;
    setListLoading(true);
    try {
      const res = await fetch(`/api/mock/paytm/transactions?mid=${mid}`);
      const data = await res.json();
      if (res.ok && data.transactions) {
        setTransactions(data.transactions.reverse()); // latest first
      }
    } catch (err) {
      console.error('Error fetching mock transactions:', err);
    } finally {
      setListLoading(false);
    }
  };

  const handleSimulateCredit = async (e) => {
    e.preventDefault();
    if (!mid) {
      alert('Please enter a Paytm Merchant ID (MID).');
      return;
    }
    setLoading(true);
    setSuccessMsg('');

    try {
      const res = await fetch('/api/mock/paytm/credit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paytmMID: mid,
          amount: Number(amount),
          senderName
        })
      });

      const data = await res.json();
      if (res.ok) {
        setSuccessMsg(`Successfully credited ₹${amount} from ${senderName}.`);
        fetchSimulatorTransactions();
      } else {
        alert(data.error || 'Simulation failed.');
      }
    } catch (err) {
      alert('Network failure.');
    } finally {
      setLoading(false);
    }
  };

  const handleClearTransactions = async () => {
    if (!confirm('Are you sure you want to clear simulator logs?')) return;
    try {
      const res = await fetch(`/api/mock/paytm/transactions?mid=${mid}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setTransactions([]);
        setSuccessMsg('Simulator database cleared.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      {/* Navbar with Paytm brand colors */}
      <nav className="navbar" style={{ borderBottom: '2px solid #00baf2' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '1.4rem', fontWeight: '900', color: '#002e6e', letterSpacing: '-0.5px' }}>
            <span style={{ color: '#00baf2' }}>paytm</span> business
          </span>
          <span style={{ background: '#00baf2', color: '#fff', fontSize: '0.65rem', padding: '0.15rem 0.4rem', borderRadius: '4px', fontWeight: 'bold' }}>
            GATEWAY SIMULATOR
          </span>
        </div>
        <div className="nav-links">
          <Link href="/" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '0.9rem' }}>
            Back to BS Solutions
          </Link>
        </div>
      </nav>

      <main className="container">
        <div style={{ marginBottom: '2.5rem' }}>
          <h1 style={{ fontSize: '2.25rem', fontWeight: '800' }}>Paytm Business Sandbox</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            This simulator allows you to mock payments landing in your Paytm Account. The BS Solutions crawler polls this mock database to verify gateway orders.
          </p>
        </div>

        <div className="simulator-layout">
          {/* Credit form */}
          <div className="card">
            <h3 style={{ color: '#00baf2', marginBottom: '1.25rem' }}>💸 Simulate UPI Payment Credit</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
              Create a mock incoming payment to trigger the crawler verification. Match the Merchant ID and amount of your open order.
            </p>

            {successMsg && (
              <div style={{
                background: 'rgba(16, 185, 129, 0.12)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                color: 'var(--color-success)',
                padding: '0.75rem',
                borderRadius: '8px',
                fontSize: '0.85rem',
                marginBottom: '1rem'
              }}>
                ✔ {successMsg}
              </div>
            )}

            <form onSubmit={handleSimulateCredit}>
              <div className="form-group">
                <label className="form-label">Paytm Merchant ID (MID)</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="Enter Merchant MID matching your settings"
                  value={mid}
                  onChange={(e) => setMid(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Credit Amount (₹)</label>
                <input 
                  type="number" 
                  step="0.01" 
                  className="form-input" 
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Sender Name (Simulated Customer)</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                  required
                />
              </div>

              <button type="submit" className="btn btn-success" style={{ width: '100%', marginTop: '0.5rem', background: '#00baf2', boxShadow: '0 4px 14px rgba(0, 186, 242, 0.4)' }} disabled={loading}>
                {loading ? <span className="spinner"></span> : 'Send Simulated Payment Credit'}
              </button>
            </form>
          </div>

          {/* Ledger display */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ color: '#00baf2' }}>📊 Paytm Settlement Log</h3>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button 
                  onClick={fetchSimulatorTransactions} 
                  className="btn btn-sm"
                  disabled={listLoading}
                >
                  Refresh
                </button>
                <button 
                  onClick={handleClearTransactions} 
                  className="btn btn-danger btn-sm"
                  disabled={transactions.length === 0}
                >
                  Clear Logs
                </button>
              </div>
            </div>

            {!mid ? (
              <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-muted)' }}>
                <p style={{ fontSize: '2rem' }}>🔑</p>
                <p style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>Enter Merchant ID on the left to load transaction history.</p>
              </div>
            ) : transactions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-muted)' }}>
                <p style={{ fontSize: '2rem' }}>🧾</p>
                <p style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>No settlements showing on this MID yet.</p>
              </div>
            ) : (
              <div className="table-container" style={{ maxHeight: '350px' }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Paytm Txn ID</th>
                      <th>Sender</th>
                      <th>Amount</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((tx) => (
                      <tr key={tx.id}>
                        <td style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{tx.txnId}</td>
                        <td style={{ fontSize: '0.85rem' }}>{tx.senderName}</td>
                        <td style={{ color: '#10b981', fontWeight: 'bold' }}>₹{tx.amount.toFixed(2)}</td>
                        <td>
                          {tx.isClaimed ? (
                            <span className="badge badge-success" style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.25)', color: '#10b981' }}>
                              CLAIMED BY CRAWLER
                            </span>
                          ) : (
                            <span className="badge badge-pending" style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.25)', color: '#f59e0b' }}>
                              UNCLAIMED CREDIT
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
