'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function DashboardPage() {
  const router = useRouter();
  const [merchant, setMerchant] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  
  // Credentials Form State
  const [paytmMID, setPaytmMID] = useState('');
  const [paytmMobile, setPaytmMobile] = useState('');
  const [paytmPassword, setPaytmPassword] = useState('');
  const [paytmUPI, setPaytmUPI] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveMessage, setSaveMessage] = useState({ text: '', type: '' });

  // Sandbox Form State
  const [sandboxAmount, setSandboxAmount] = useState('10.00');
  const [sandboxOrderId, setSandboxOrderId] = useState('');
  const [sandboxCustomer, setSandboxCustomer] = useState('John Doe');
  const [sandboxResult, setSandboxResult] = useState(null);
  const [sandboxLoading, setSandboxLoading] = useState(false);
  const [sandboxError, setSandboxError] = useState('');

  // Transactions State
  const [transactions, setTransactions] = useState([]);
  const [txLoading, setTxLoading] = useState(false);

  // Authenticate merchant on mount
  useEffect(() => {
    const cached = localStorage.getItem('bs_merchant');
    if (!cached) {
      router.push('/login');
      return;
    }
    
    try {
      const parsed = JSON.parse(cached);
      setMerchant(parsed);
      fetchProfile(parsed.id);
      fetchTransactions(parsed.id);
    } catch (e) {
      router.push('/login');
    }
  }, [router]);

  // Generate a random developer order ID for sandbox
  useEffect(() => {
    setSandboxOrderId('ORD_' + Math.floor(Math.random() * 100000));
  }, []);

  const fetchProfile = async (merchantId) => {
    try {
      const res = await fetch('/api/auth/profile', {
        headers: { 'x-merchant-id': merchantId }
      });
      const data = await res.json();
      if (res.ok && data.merchant) {
        setPaytmMID(data.merchant.paytmMID || '');
        setPaytmMobile(data.merchant.paytmMobile || '');
        setPaytmPassword(data.merchant.paytmPassword || '');
        setPaytmUPI(data.merchant.paytmUPI || '');
        setApiKey(data.merchant.apiKey || '');
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
    }
  };

  const fetchTransactions = async (merchantId) => {
    setTxLoading(true);
    try {
      const res = await fetch('/api/merchant/transactions', {
        headers: { 'x-merchant-id': merchantId }
      });
      const data = await res.json();
      if (res.ok && data.orders) {
        setTransactions(data.orders);
      }
    } catch (err) {
      console.error('Error fetching transactions:', err);
    } finally {
      setTxLoading(false);
    }
  };

  const handleSaveCredentials = async (e) => {
    e.preventDefault();
    if (!merchant) return;
    setSaveLoading(true);
    setSaveMessage({ text: '', type: '' });

    try {
      const res = await fetch('/api/auth/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-merchant-id': merchant.id
        },
        body: JSON.stringify({
          paytmMID,
          paytmMobile,
          paytmPassword,
          paytmUPI
        })
      });

      const data = await res.json();
      if (res.ok) {
        setSaveMessage({ text: 'Credentials updated successfully!', type: 'success' });
      } else {
        setSaveMessage({ text: data.error || 'Failed to update credentials.', type: 'danger' });
      }
    } catch (err) {
      setSaveMessage({ text: 'Connection error.', type: 'danger' });
    } finally {
      setSaveLoading(false);
    }
  };

  const handleApiKeyAction = async (action) => {
    if (!merchant) return;
    try {
      const res = await fetch('/api/auth/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-merchant-id': merchant.id
        },
        body: JSON.stringify({ action })
      });
      const data = await res.json();
      if (res.ok) {
        setApiKey(data.apiKey || '');
        if (action === 'revoke_key') {
          setSaveMessage({ text: 'API Key revoked.', type: 'warning' });
        } else {
          setSaveMessage({ text: 'New API Key generated successfully!', type: 'success' });
        }
      }
    } catch (err) {
      console.error('API Key error:', err);
    }
  };

  const handleRunSandbox = async (e) => {
    e.preventDefault();
    if (!apiKey) {
      setSandboxError('Please generate an API Key first in the Overview tab.');
      return;
    }
    setSandboxLoading(true);
    setSandboxError('');
    setSandboxResult(null);

    try {
      const res = await fetch('/api/gateway/order/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          amount: Number(sandboxAmount),
          orderId: sandboxOrderId,
          customerName: sandboxCustomer,
          redirectUrl: `${window.location.origin}/dashboard`
        })
      });

      const data = await res.json();
      if (res.ok) {
        setSandboxResult(data);
      } else {
        setSandboxError(data.error || 'Failed to initiate order.');
      }
    } catch (err) {
      setSandboxError('Connection failed.');
    } finally {
      setSandboxLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('bs_merchant');
    router.push('/login');
  };

  if (!merchant) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <span className="spinner"></span>
      </div>
    );
  }

  return (
    <div>
      <nav className="navbar">
        <Link href="/" className="nav-brand">
          BS Solutions
        </Link>
        <div className="nav-links">
          <Link href="/simulator" className="nav-link" target="_blank">Open Paytm Simulator</Link>
          <span className="nav-link" style={{ color: 'var(--text-main)', fontWeight: 'bold' }}>
            🏪 {merchant.businessName}
          </span>
          <button onClick={handleLogout} className="btn btn-sm">Logout</button>
        </div>
      </nav>

      <main className="container">
        <div className="tabs-header">
          <button 
            className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            Overview & API Credentials
          </button>
          <button 
            className={`tab-btn ${activeTab === 'sandbox' ? 'active' : ''}`}
            onClick={() => setActiveTab('sandbox')}
          >
            Developer Sandbox
          </button>
          <button 
            className={`tab-btn ${activeTab === 'transactions' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('transactions');
              fetchTransactions(merchant.id);
            }}
          >
            Transaction History
          </button>
        </div>

        {/* Tab 1: Overview */}
        {activeTab === 'overview' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {saveMessage.text && (
              <div style={{
                background: saveMessage.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                border: `1px solid ${saveMessage.type === 'success' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                color: saveMessage.type === 'success' ? 'var(--color-success)' : 'var(--color-danger)',
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                fontSize: '0.9rem'
              }}>
                {saveMessage.text}
              </div>
            )}

            <div className="simulator-layout">
              {/* Paytm Credentials Settings */}
              <div className="card">
                <h3 style={{ marginBottom: '1.25rem' }}>🔗 Paytm Business Settings</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                  Provide credentials for dashboard credit verification. We simulate crawling this account in real-time.
                </p>

                <form onSubmit={handleSaveCredentials}>
                  <div className="form-group">
                    <label className="form-label">Paytm Merchant ID (MID)</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="e.g. 2169000123456789"
                      value={paytmMID}
                      onChange={(e) => setPaytmMID(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Paytm Merchant UPI ID (VPA)</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="e.g. merchant@paytm"
                      value={paytmUPI}
                      onChange={(e) => setPaytmUPI(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Staff Role Phone Number</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="e.g. 9876543210"
                      value={paytmMobile}
                      onChange={(e) => setPaytmMobile(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Staff Role Password</label>
                    <input 
                      type="password" 
                      className="form-input" 
                      placeholder="••••••••"
                      value={paytmPassword}
                      onChange={(e) => setPaytmPassword(e.target.value)}
                      required
                    />
                  </div>

                  <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }} disabled={saveLoading}>
                    {saveLoading ? <span className="spinner"></span> : 'Save Configuration'}
                  </button>
                </form>
              </div>

              {/* Developer Keys */}
              <div className="card" style={{ height: 'fit-content' }}>
                <h3 style={{ marginBottom: '1rem' }}>🔑 API Gateway Key</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                  Use this secret key to authenticate payment requests from your server. Keep it confidential.
                </p>

                {apiKey ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div className="copy-wrapper">
                      <span className="copy-text">{apiKey}</span>
                      <button 
                        className="btn btn-sm"
                        onClick={() => {
                          navigator.clipboard.writeText(apiKey);
                          alert('API Key copied to clipboard!');
                        }}
                      >
                        Copy
                      </button>
                    </div>
                    <button 
                      onClick={() => handleApiKeyAction('revoke_key')}
                      className="btn btn-danger"
                      style={{ width: '100%' }}
                    >
                      Revoke API Key
                    </button>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                    <p style={{ color: 'var(--text-warning)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                      No active API key. Generate one to start integration.
                    </p>
                    <button 
                      onClick={() => handleApiKeyAction('generate_key')}
                      className="btn btn-primary"
                      style={{ width: '100%' }}
                    >
                      Generate API Key
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Sandbox */}
        {activeTab === 'sandbox' && (
          <div className="simulator-layout">
            <div className="card">
              <h3 style={{ marginBottom: '1.25rem' }}>🧪 Payment Sandbox Playground</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                Simulate a payment gateway call from your server. This generates a checkout URL to verify the scan and pay flow.
              </p>

              {sandboxError && (
                <div style={{
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: 'var(--color-danger)',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  fontSize: '0.85rem',
                  marginBottom: '1rem'
                }}>
                  {sandboxError}
                </div>
              )}

              <form onSubmit={handleRunSandbox}>
                <div className="form-group">
                  <label className="form-label">Payment Amount (INR)</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    className="form-input" 
                    value={sandboxAmount}
                    onChange={(e) => setSandboxAmount(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Order Reference ID (Your DB ID)</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={sandboxOrderId}
                    onChange={(e) => setSandboxOrderId(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Customer Name (Optional)</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={sandboxCustomer}
                    onChange={(e) => setSandboxCustomer(e.target.value)}
                  />
                </div>

                <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }} disabled={sandboxLoading}>
                  {sandboxLoading ? <span className="spinner"></span> : 'Generate Payment QR Link'}
                </button>
              </form>
            </div>

            <div className="card">
              <h3 style={{ marginBottom: '1rem' }}>💻 Integration Console</h3>
              
              {sandboxResult ? (
                <div>
                  <p style={{ color: 'var(--color-success)', fontSize: '0.9rem', marginBottom: '1rem', fontWeight: 'bold' }}>
                    ✔ API Call Successful!
                  </p>
                  
                  <div style={{ marginBottom: '1rem' }}>
                    <p className="form-label">Checkout URL (Redirect Customer Here)</p>
                    <div className="copy-wrapper" style={{ marginTop: '0.25rem' }}>
                      <span className="copy-text">{sandboxResult.checkoutUrl}</span>
                      <a 
                        href={sandboxResult.checkoutUrl} 
                        target="_blank" 
                        rel="noreferrer"
                        className="btn btn-primary btn-sm"
                        style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem' }}
                      >
                        Open checkout
                      </a>
                    </div>
                  </div>

                  <p className="form-label">API Response Payload</p>
                  <pre className="code-block">
                    {JSON.stringify(sandboxResult, null, 2)}
                  </pre>

                  <p className="form-label">cURL Integration Command</p>
                  <pre className="code-block" style={{ color: '#34d399', fontSize: '0.75rem', whiteSpace: 'pre-wrap' }}>
                    {`curl -X POST "${window.location.origin}/api/gateway/order/create" \\
  -H "Authorization: Bearer ${apiKey}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "amount": ${sandboxAmount},
    "orderId": "${sandboxOrderId}",
    "customerName": "${sandboxCustomer}"
  }'`}
                  </pre>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '260px', color: 'var(--text-muted)' }}>
                  <p style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>⚡</p>
                  <p style={{ fontSize: '0.85rem' }}>Fill playground form and click generate to view integration specs.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 3: Transactions */}
        {activeTab === 'transactions' && (
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3>🧾 Payment Transactions Log</h3>
              <button 
                onClick={() => fetchTransactions(merchant.id)} 
                className="btn btn-sm"
                disabled={txLoading}
              >
                {txLoading ? <span className="spinner"></span> : 'Refresh'}
              </button>
            </div>

            {transactions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-muted)' }}>
                <p style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🔍</p>
                <p style={{ fontSize: '0.9rem' }}>No transactions recorded yet. Use the Sandbox tab to create one.</p>
              </div>
            ) : (
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Gateway ID</th>
                      <th>Order Reference</th>
                      <th>Amount</th>
                      <th>Customer</th>
                      <th>Status</th>
                      <th>Paytm Ref ID</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((tx) => (
                      <tr key={tx.id}>
                        <td style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>{tx.id}</td>
                        <td style={{ fontFamily: 'monospace' }}>{tx.developerOrderId}</td>
                        <td style={{ color: 'var(--color-success)', fontWeight: 'bold' }}>₹{tx.amount.toFixed(2)}</td>
                        <td>{tx.customerName}</td>
                        <td>
                          <span className={`badge badge-${tx.status.toLowerCase()}`}>
                            {tx.status}
                          </span>
                        </td>
                        <td style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                          {tx.paytmTxnId || <span style={{ color: 'var(--text-muted)' }}>-</span>}
                        </td>
                        <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          {new Date(tx.createdAt).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
