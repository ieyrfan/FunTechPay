import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Send, ArrowDownToLine, ArrowUpRight, LogOut, Loader2, QrCode, Smartphone, ReceiptText, ShieldCheck, Target, Share2, CheckCircle, Settings, X, PieChart, Users, Gift, Sparkles } from 'lucide-react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import jsPDF from 'jspdf';

const Scanner = ({ onScan, onCancel }) => {
  useEffect(() => {
    const scanner = new Html5QrcodeScanner("reader", { qrbox: { width: 250, height: 250 }, fps: 10 }, false);
    scanner.render((text) => {
        onScan(text);
        scanner.clear();
    }, (err) => {});
    return () => scanner.clear();
  }, []);
  
  return (
    <div className="text-center">
      <div id="reader" style={{ width: '100%', maxWidth: '400px', margin: '0 auto', borderRadius: '12px', overflow: 'hidden' }}></div>
      <button className="btn mt-4" style={{ background: '#f1f5f9', color: '#000' }} onClick={onCancel}>Cancel Scan</button>
    </div>
  );
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modals
  const [activeModal, setActiveModal] = useState(null); // 'transfer', 'qr', 'scan', 'topup', 'bills', 'tabung', 'receipt'
  
  // Transfer State
  const [receiver, setReceiver] = useState('');
  const [amount, setAmount] = useState('');
  const [desc, setDesc] = useState('');
  
  // TAC State
  const [tacInput, setTacInput] = useState('');
  const [tacData, setTacData] = useState(null);

  // Split Bill State
  const [splitFriends, setSplitFriends] = useState('2');

  // Admin State
  const [adminData, setAdminData] = useState(null);

  const cardRef = useRef(null);

  const handleMouseMove = (e) => {
    if(!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    const rotateX = ((y - centerY) / centerY) * -15;
    const rotateY = ((x - centerX) / centerX) * 15;
    
    cardRef.current.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    cardRef.current.style.setProperty('--mx', `${(x / rect.width) * 100}%`);
    cardRef.current.style.setProperty('--my', `${(y / rect.height) * 100}%`);
  };

  const handleMouseLeave = () => {
    if(!cardRef.current) return;
    cardRef.current.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg)`;
  };

  const triggerGodMode = async () => {
    const pwd = prompt("Enter Admin Passcode:");
    if (!pwd) return;
    try {
      const res = await fetch('/admin/users', {
        headers: { 'x-admin-key': pwd }
      });
      if (res.ok) {
        const data = await res.json();
        setAdminData(data);
        setActiveModal('admin');
      } else {
        alert("🚨 ACCESS DENIED: Security Breach Detected!");
      }
    } catch (e) {
      alert("Error connecting to secure server.");
    }
  };

  // AI Analytics Dummy State
  const spendingData = [
    { category: 'Food & Dining', percent: 45, color: '#ef4444' },
    { category: 'Shopping', percent: 30, color: '#f59e0b' },
    { category: 'Bills & Utilities', percent: 25, color: '#3b82f6' }
  ];

  const fetchDashboardData = async (phone, token) => {
    try {
      const headers = { 'Authorization': `Bearer ${token}` };
      
      const userRes = await fetch(`/user/${phone}`, { headers });
      if(userRes.status === 401) { handleLogout(); return; }
      if (userRes.ok) {
        const freshUser = await userRes.json();
        setUser(freshUser);
        localStorage.setItem('user', JSON.stringify(freshUser));
      }

      const res = await fetch(`/transactions/${phone}`, { headers });
      if(res.status === 401) { handleLogout(); return; }
      if (res.ok) {
        const data = await res.json();
        setTransactions(data.transactions);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const userData = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (!userData || !token) {
      navigate('/login');
      return;
    }
    const parsed = JSON.parse(userData);
    setUser(parsed);
    fetchDashboardData(parsed.phone, token);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    navigate('/login');
  };

  const handleAction = async (e, type) => {
    e.preventDefault();
    if(type === 'transfer' && !receiver) return;
    
    let receiverPhone = receiver;
    let descText = desc;
    
    if(type === 'bills') {
      receiverPhone = "Biller-001";
      descText = `Bill Payment: ${desc}`;
    }
    if(type === 'tabung') {
      receiverPhone = "Vault-001";
      descText = `Vault Deposit: ${desc}`;
    }

    if(type === 'update_profile') {
      if(!receiverPhone || receiverPhone.trim() === '') {
        alert("Please enter a new name before updating.");
        return;
      }
      try {
        const res = await fetch('/user', {
          method: 'PUT',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({ phone: user.phone, name: receiverPhone.trim() })
        });
        if(res.ok) {
           const updatedUser = {...user, name: receiverPhone.trim()};
           setUser(updatedUser);
           localStorage.setItem('user', JSON.stringify(updatedUser));
           alert("Profile updated successfully!");
           setActiveModal(null);
           setReceiver('');
        } else {
           const data = await res.json();
           throw new Error(data.detail || "Failed to update profile");
        }
      } catch (err) { alert(err.message || "An error occurred"); }
      return;
    }

    if(type === 'delete_account') {
      if(!window.confirm("Are you sure you want to delete your account? This cannot be undone.")) return;
      try {
        const res = await fetch('/user', {
          method: 'DELETE',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({ phone: user.phone })
        });
        if(res.ok) {
           alert("Account deleted successfully.");
           localStorage.removeItem('user');
           navigate('/');
        }
      } catch (err) { alert(err.message); }
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };
      let res;
      if (type === 'topup') {
        res = await fetch('/topup', {
          method: 'POST',
          headers,
          body: JSON.stringify({ phone: user.phone, amount: parseFloat(amount) })
        });
      } else {
        res = await fetch('/transfer', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            sender_phone: user.phone,
            receiver_phone: receiverPhone,
            amount: parseFloat(amount),
            description: descText
          })
        });
      }
      
      const data = await res.json();
      if(res.status === 401) { handleLogout(); return; }
      if (!res.ok) throw new Error(data.detail);
      
      if (data.tac_required) {
        alert(`🚨 MOCK SMS 🚨\nYour FunTechPay TAC code is: ${data.mock_tac_sms}`);
        setTacData({
            sender_phone: user.phone,
            receiver_phone: receiverPhone,
            amount: parseFloat(amount),
            description: descText
        });
        setActiveModal('tac');
        return;
      }
      
      const updatedUser = { ...user, balance: data.new_balance };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      fetchDashboardData(user.phone, token);
      
      // Generate Receipt
      setReceipt({
        tx_id: data.tx_id,
        amount: parseFloat(amount),
        receiver: receiverPhone,
        date: new Date().toLocaleString(),
        type: type
      });
      
      setActiveModal('receipt');
      setReceiver(''); setAmount(''); setDesc('');
    } catch (err) {
      alert(err.message);
    }
  };

  const handleTacConfirm = async (e) => {
    e.preventDefault();
    if(!tacInput || tacInput.length !== 6) {
        alert("Please enter valid 6-digit TAC");
        return;
    }
    try {
        const token = localStorage.getItem('token');
        const res = await fetch('/transfer/confirm', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({...tacData, tac: tacInput})
        });
        
        const data = await res.json();
        if(res.status === 401) { handleLogout(); return; }
        if(!res.ok) throw new Error(data.detail);
        
        const updatedUser = { ...user, balance: data.new_balance };
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
        
        fetchDashboardData(user.phone, token);
        
        setReceipt({
            tx_id: data.tx_id,
            amount: tacData.amount,
            receiver: tacData.receiver_phone,
            date: new Date().toLocaleString(),
            type: 'transfer'
        });
        
        setActiveModal('receipt');
        setReceiver(''); setAmount(''); setDesc(''); setTacInput(''); setTacData(null);
    } catch(err) {
        alert(err.message);
    }
  };

  const handleRedeem = async () => {
    if(user.points < 1000) return;
    try {
        const token = localStorage.getItem('token');
        const res = await fetch('/redeem', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ phone: user.phone })
        });
        const data = await res.json();
        if(res.status === 401) { handleLogout(); return; }
        if(!res.ok) throw new Error(data.detail);
        
        const updatedUser = { ...user, balance: data.new_balance, points: data.new_points };
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
        fetchDashboardData(user.phone, token);
        alert("🎉 Successfully redeemed 1000 Points for RM 10.00 Cashback!");
    } catch(err) { alert(err.message); }
  };

  const handleScan = (text) => {
    setActiveModal(null);
    if(text.startsWith('split_')) {
      const parts = text.split('_');
      setReceiver(parts[1]);
      setAmount(parts[2]);
      setDesc("Split Bill Payment");
      setActiveModal('transfer');
    } else {
      setReceiver(text);
      setActiveModal('transfer');
    }
  };

  const shareReceipt = async () => {
    try {
      const doc = new jsPDF();
      
      // Header
      doc.setFont("helvetica", "bold");
      doc.setFontSize(24);
      doc.setTextColor(79, 70, 229); // Primary color
      doc.text("FunTechPay", 105, 30, null, null, "center");
      
      doc.setFontSize(14);
      doc.setTextColor(100, 100, 100);
      doc.text("Official Transaction Receipt", 105, 40, null, null, "center");
      
      // Line
      doc.setDrawColor(200, 200, 200);
      doc.line(20, 50, 190, 50);
      
      // Details
      doc.setFont("helvetica", "normal");
      doc.setTextColor(0, 0, 0);
      
      doc.setFontSize(12);
      doc.text("Transaction Type:", 20, 70);
      doc.text(receipt.type.toUpperCase(), 190, 70, null, null, "right");
      
      doc.text("Amount:", 20, 85);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.setTextColor(16, 185, 129); // Success color
      doc.text(`RM ${receipt.amount.toFixed(2)}`, 190, 85, null, null, "right");
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      
      doc.text("Recipient / Biller:", 20, 100);
      doc.text(receipt.receiver, 190, 100, null, null, "right");
      
      doc.text("Reference ID:", 20, 115);
      doc.text(receipt.tx_id, 190, 115, null, null, "right");
      
      doc.text("Date & Time:", 20, 130);
      doc.text(receipt.date, 190, 130, null, null, "right");
      
      // Footer
      doc.setDrawColor(200, 200, 200);
      doc.line(20, 145, 190, 145);
      
      doc.setFontSize(10);
      doc.setTextColor(150, 150, 150);
      doc.text("Powered by AWS DynamoDB & SageMaker AI", 105, 275, null, null, "center");
      
      // Save PDF
      doc.save(`FunTechPay_Receipt_${receipt.tx_id}.pdf`);
      
    } catch(err) {
      console.error("PDF generation failed:", err);
      alert("Failed to generate PDF.");
    }
  };

  const tabungBalance = transactions.reduce((acc, txn) => {
    if (txn.type === 'out' && txn.description && txn.description.includes('Vault Deposit')) {
      return acc + txn.amount;
    }
    return acc;
  }, 0);

  const getAiInsights = () => {
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      let monthOutflow = 0;
      let foodOutflow = 0;
      
      transactions.forEach(tx => {
          const txDate = new Date(tx.date);
          if (txDate.getMonth() === currentMonth && txDate.getFullYear() === currentYear && tx.type === 'out') {
              monthOutflow += tx.amount;
              const descLower = (tx.description || '').toLowerCase();
              if (descLower.includes('kfc') || descLower.includes('mcd') || descLower.includes('makan') || descLower.includes('food') || descLower.includes('lunch') || descLower.includes('dinner')) {
                  foodOutflow += tx.amount;
              }
          }
      });
      
      const totalFunds = user?.balance + monthOutflow;
      let alerts = [];
      if (totalFunds > 0 && (monthOutflow / totalFunds) > 0.7) {
          alerts.push("⚠️ Amaran: Anda berbelanja melebihi 70% daripada dana anda bulan ini!");
      }
      if (monthOutflow > 0 && (foodOutflow / monthOutflow) > 0.3) {
          alerts.push("🍔 AI Notice: Anda belanja terlalu banyak untuk makanan! Sila kurangkan makan di luar.");
      }
      return alerts;
  };
  
  const aiAlerts = user ? getAiInsights() : [];

  if (!user) return null;

  return (
    <div className="dashboard-wrapper" style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 20px', position: 'relative' }}>
      
      {/* Header */}
      <header className="flex justify-between items-center animate-slide-up" style={{ marginBottom: '30px' }}>
        <div className="flex items-center gap-4">
          <img 
            src={`https://api.dicebear.com/7.x/initials/svg?seed=${user.name}&backgroundColor=4f46e5`} 
            alt="Profile" 
            style={{ width: '48px', height: '48px', borderRadius: '16px', border: '2px solid white', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}
          />
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Hi, {user.name.split(' ')[0]} 👋</h2>
            <div 
              onClick={triggerGodMode} 
              className="flex items-center gap-1" 
              style={{ color: 'var(--success)', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}
              title="Double click me maybe? 😉"
            >
              <ShieldCheck size={14} /> KYC Verified
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setActiveModal('settings')} style={{ background: '#f1f5f9', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: '10px', borderRadius: '12px' }}>
            <Settings size={20} />
          </button>
          <button onClick={handleLogout} style={{ background: '#fef2f2', border: 'none', cursor: 'pointer', color: 'var(--danger)', padding: '10px', borderRadius: '12px' }}>
            <LogOut size={20} />
          </button>
        </div>
      </header>

      <div className="flex gap-4 mb-8" style={{ flexDirection: 'column' }}>
        {/* Virtual Bank Card */}
        <div className="card-container" onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave}>
            <div className="virtual-card animate-slide-up" ref={cardRef} style={{ animationDelay: '0.1s', marginBottom: '0' }}>
            <div className="card-glare"></div>
            <div className="card-elements">
                <p style={{ fontSize: '0.9rem', opacity: 0.9, marginBottom: '8px' }}>Available Balance</p>
                <h1 style={{ fontSize: 'clamp(1.8rem, 8vw, 2.8rem)', marginBottom: '24px', fontWeight: 700, wordBreak: 'break-word' }}>RM {user.balance.toFixed(2)}</h1>
                
                <div className="flex justify-between items-end">
                <div>
                    <p style={{ fontSize: '0.8rem', opacity: 0.8, marginBottom: '4px' }}>Card Holder</p>
                    <p style={{ fontSize: '1.1rem', fontWeight: 600, letterSpacing: '1px' }}>{user.name.toUpperCase()}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: '0.8rem', opacity: 0.8, marginBottom: '4px' }}>FunTechPay ID</p>
                    <p style={{ fontSize: '1rem', letterSpacing: '2px', fontWeight: 500 }}>{user.phone}</p>
                </div>
                </div>
            </div>
            </div>
        </div>

        {/* Tabung (Vault) Card */}
        <div className="animate-slide-up" style={{ background: '#fff', borderRadius: '24px', padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', border: '1px solid var(--border-light)', animationDelay: '0.15s' }}>
          <div className="flex items-center gap-3">
            <div style={{ background: '#fef3c7', padding: '12px', borderRadius: '16px' }}>
              <Target size={24} color="#d97706" />
            </div>
            <div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>My Tabung (Vault)</p>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#d97706' }}>RM {tabungBalance.toFixed(2)}</h3>
            </div>
          </div>
          <button onClick={() => setActiveModal('tabung')} style={{ background: '#fffbeb', border: '1px solid #fcd34d', color: '#d97706', padding: '8px 16px', borderRadius: '12px', fontWeight: 600, cursor: 'pointer' }}>
            Add Funds
          </button>
        </div>

        {/* FunTech Rewards Card */}
        <div className="animate-slide-up" style={{ background: '#fff', borderRadius: '24px', padding: '20px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', border: '1px solid var(--border-light)', animationDelay: '0.2s' }}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Gift size={20} color="#f59e0b" />
              <h3 style={{ fontSize: '1.1rem' }}>FunTech Points</h3>
            </div>
            <span style={{ fontWeight: 'bold', color: '#f59e0b' }}>{user.points || 0} pts</span>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${Math.min(((user.points || 0) / 1000) * 100, 100)}%`, background: '#f59e0b' }}></div>
          </div>
          <div className="flex justify-between items-center mt-4">
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>1000 pts = RM10 Cashback</span>
            <button 
              onClick={handleRedeem}
              disabled={(user.points || 0) < 1000}
              className="btn btn-primary" 
              style={{ width: 'auto', padding: '8px 16px', fontSize: '0.85rem', background: (user.points || 0) >= 1000 ? '#f59e0b' : '#e2e8f0', color: (user.points || 0) >= 1000 ? '#fff' : '#94a3b8' }}
            >
              Redeem Now
            </button>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <h3 className="animate-slide-up" style={{ marginBottom: '15px', animationDelay: '0.2s' }}>Quick Actions</h3>
      <div className="bank-card animate-slide-up" style={{ animationDelay: '0.3s', marginBottom: '30px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px' }}>
          <button className="quick-action" onClick={() => setActiveModal('transfer')}>
            <div className="action-icon"><Send size={24} /></div>
            <span>Transfer</span>
          </button>
          <button className="quick-action" onClick={() => setActiveModal('scan')}>
            <div className="action-icon"><QrCode size={24} /></div>
            <span>Scan QR</span>
          </button>
          <button className="quick-action" onClick={() => setActiveModal('topup')}>
            <div className="action-icon"><ArrowDownToLine size={24} /></div>
            <span>Top Up</span>
          </button>
          <button className="quick-action" onClick={() => setActiveModal('bills')}>
            <div className="action-icon"><ReceiptText size={24} /></div>
            <span>Bills</span>
          </button>
          <button className="quick-action" onClick={() => setActiveModal('split')}>
            <div className="action-icon" style={{ background: '#fef3c7', color: '#d97706' }}><Users size={24} /></div>
            <span>Split Bill</span>
          </button>
          <button className="quick-action" onClick={() => setActiveModal('tabung')}>
            <div className="action-icon"><Target size={24} /></div>
            <span>Tabung</span>
          </button>
          <button className="quick-action" onClick={() => setActiveModal('qr')}>
            <div className="action-icon"><Smartphone size={24} /></div>
            <span>Receive</span>
          </button>
        </div>
      </div>

      {/* AI Spending Analytics */}
      <div className="bank-card animate-slide-up" style={{ animationDelay: '0.3s', marginBottom: '30px' }}>
        <h3 style={{ marginBottom: '15px', fontSize: '1.1rem' }}>AWS SageMaker AI Insights</h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '15px' }}>Your spending patterns this month</p>
        
        {spendingData.map(item => (
          <div key={item.category} style={{ marginBottom: '12px' }}>
            <div className="flex justify-between" style={{ fontSize: '0.85rem', marginBottom: '4px', fontWeight: 500 }}>
              <span>{item.category}</span>
              <span>{item.percent}%</span>
            </div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${item.percent}%`, background: item.color }}></div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="flex justify-between items-center mb-4 animate-slide-up" style={{ animationDelay: '0.4s' }}>
        <h3 className="flex items-center gap-2"><Sparkles size={20} color="#3b82f6" /> AI Financial Advisor</h3>
      </div>
      
      {aiAlerts.length > 0 ? (
          <div className="animate-slide-up" style={{ animationDelay: '0.5s', marginBottom: '30px' }}>
              {aiAlerts.map((alertMsg, idx) => (
                  <div key={idx} style={{ background: '#fef2f2', borderLeft: '4px solid #ef4444', padding: '15px', borderRadius: '8px', marginBottom: '10px', fontWeight: 500, color: '#b91c1c' }}>
                      {alertMsg}
                  </div>
              ))}
          </div>
      ) : (
          <div className="bank-card animate-slide-up" style={{ animationDelay: '0.5s', marginBottom: '30px', textAlign: 'center' }}>
            <p style={{ color: 'var(--success)', fontWeight: 600 }}>✅ Kewangan anda bulan ini berada dalam keadaan sangat sihat!</p>
          </div>
      )}

      {/* Recent Transactions */}
      <div className="bank-card animate-slide-up" style={{ animationDelay: '0.4s' }}>
        <h3 style={{ marginBottom: '20px', fontSize: '1.1rem' }}>Recent Transactions</h3>

        <div>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '20px' }}><Loader2 className="animate-spin" /></div>
          ) : transactions.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '20px' }}>No transactions yet.</p>
          ) : (
            transactions.map((txn) => (
              <div key={txn.tx_id} className="flex justify-between items-center" style={{ padding: '16px 0', borderBottom: '1px solid var(--border-light)' }}>
                <div className="flex items-center gap-4">
                  <div style={{ width: '48px', height: '48px', borderRadius: '16px', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border-light)' }}>
                    {txn.type === 'in' ? <ArrowDownToLine size={20} color="var(--success)"/> : <ArrowUpRight size={20} color="var(--danger)"/>}
                  </div>
                  <div>
                    <h4 style={{ fontSize: '0.95rem', marginBottom: '4px', fontWeight: 600 }}>{txn.description}</h4>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{txn.date}</p>
                  </div>
                </div>
                <div style={{ fontWeight: 700, fontSize: '1.05rem', color: txn.type === 'in' ? 'var(--success)' : 'var(--text-primary)' }}>
                  {txn.type === 'in' ? '+' : '-'}RM {txn.amount.toFixed(2)}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Universal Action Modal */}
      {activeModal && (
        <div className="modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            
            {activeModal === 'qr' && (
              <div className="text-center">
                <h3 style={{ marginBottom: '10px' }}>DuitNow QR</h3>
                
                <div className="flex gap-2 justify-center mb-4 mt-2">
                  <button className="btn btn-primary" style={{ padding: '10px 16px', fontSize: '0.9rem' }} onClick={() => setActiveModal('qr')}>Show My QR</button>
                  <button className="btn" style={{ background: '#f1f5f9', color: '#000', padding: '10px 16px', fontSize: '0.9rem' }} onClick={() => setActiveModal('scan')}>Scan QR</button>
                </div>
                
                <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '24px', display: 'inline-block', border: '1px solid var(--border-light)', marginBottom: '20px' }}>
                  <img src={`https://api.qrserver.com/v1/create-qr-code/?data=${user.phone}&size=150x150`} alt="QR Code" />
                </div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>{user.name}</h2>
                <p style={{ color: 'var(--text-secondary)' }}>{user.phone}</p>
              </div>
            )}

            {activeModal === 'scan' && (
              <div className="animate-slide-up">
                <h3 style={{ marginBottom: '20px', textAlign: 'center' }}>Scan DuitNow QR</h3>
                <Scanner 
                  onScan={handleScan}
                  onCancel={() => setActiveModal(null)} 
                />
              </div>
            )}

            {activeModal === 'split' && (
              <div className="animate-slide-up text-center">
                <h3 style={{ marginBottom: '20px' }}>🍕 Split Bill DuitNow</h3>
                {amount && receiver === user.phone ? (
                  <>
                     <p style={{ marginBottom: '20px', color: 'var(--text-secondary)' }}>Tunjuk QR ini kepada rakan anda untuk mereka imbas dan bayar RM {parseFloat(amount).toFixed(2)} seorang.</p>
                     <div style={{ background: '#fff', padding: '20px', borderRadius: '24px', display: 'inline-block', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}>
                        <img src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=split_${user.phone}_${amount}`} alt="QR" />
                     </div>
                     <button className="btn mt-4" style={{ background: '#f1f5f9', color: '#000' }} onClick={() => { setActiveModal(null); setAmount(''); setReceiver(''); }}>Done</button>
                  </>
                ) : (
                  <form onSubmit={(e) => { e.preventDefault(); if(amount && splitFriends) { setAmount((parseFloat(amount) / parseInt(splitFriends)).toFixed(2)); setReceiver(user.phone); } }}>
                      <div className="input-group">
                        <label>Total Bill Amount (RM)</label>
                        <input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required placeholder="100.00" />
                      </div>
                      <div className="input-group">
                        <label>Number of People</label>
                        <input type="number" min="2" value={splitFriends} onChange={(e) => setSplitFriends(e.target.value)} required placeholder="4" />
                      </div>
                      <div className="flex gap-2">
                        <button type="button" className="btn flex-1" style={{ background: '#f1f5f9', color: '#000' }} onClick={() => setActiveModal(null)}>Cancel</button>
                        <button type="submit" className="btn btn-primary flex-1">Generate Split QR</button>
                      </div>
                  </form>
                )}
              </div>
            )}

            {activeModal === 'receipt' && receipt && (
              <div className="text-center animate-slide-up">
                <div style={{ background: '#ecfdf5', width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                  <CheckCircle size={32} color="#10b981" />
                </div>
                <h2 style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: '8px' }}>RM {receipt.amount.toFixed(2)}</h2>
                <p style={{ color: 'var(--success)', fontWeight: 600, marginBottom: '20px' }}>Transfer Successful</p>
                
                <div style={{ background: '#f8fafc', borderRadius: '16px', padding: '20px', textAlign: 'left', marginBottom: '24px', border: '1px dashed var(--border-light)' }}>
                  <div className="flex justify-between mb-3">
                    <span style={{ color: 'var(--text-secondary)' }}>To</span>
                    <span style={{ fontWeight: 600 }}>{receipt.receiver}</span>
                  </div>
                  <div className="flex justify-between mb-3">
                    <span style={{ color: 'var(--text-secondary)' }}>Date</span>
                    <span style={{ fontWeight: 600 }}>{receipt.date}</span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: 'var(--text-secondary)' }}>Ref ID</span>
                    <span style={{ fontWeight: 600 }}>{receipt.tx_id}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button className="btn btn-primary flex-1" onClick={shareReceipt}>
                    <Share2 size={18} /> Share Receipt
                  </button>
                  <button className="btn flex-1" style={{ background: '#f1f5f9', color: '#000' }} onClick={() => setActiveModal(null)}>
                    Done
                  </button>
                </div>
              </div>
            )}

            {activeModal === 'tac' && (
              <div className="text-center animate-slide-up">
                <h3 style={{ marginBottom: '15px' }}>🔒 Enter TAC Code</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '20px' }}>A 6-digit TAC code has been sent to your registered phone number via SMS.</p>
                <form onSubmit={handleTacConfirm}>
                    <input 
                      type="text" 
                      value={tacInput}
                      onChange={(e) => setTacInput(e.target.value)}
                      placeholder="••••••"
                      maxLength={6}
                      style={{ fontSize: '2rem', letterSpacing: '8px', textAlign: 'center', width: '100%', padding: '15px', borderRadius: '12px', border: '2px solid var(--border-light)', marginBottom: '20px' }}
                      required
                    />
                    <div className="flex gap-2">
                      <button type="button" className="btn flex-1" style={{ background: '#f1f5f9', color: '#000' }} onClick={() => setActiveModal(null)}>Cancel</button>
                      <button type="submit" className="btn btn-primary flex-1">Confirm</button>
                    </div>
                </form>
              </div>
            )}

            {(activeModal === 'transfer' || activeModal === 'bills' || activeModal === 'tabung' || activeModal === 'topup') && (
              <>
                <h3 style={{ marginBottom: '20px', textTransform: 'capitalize' }}>
                  {activeModal === 'tabung' ? 'Deposit to Vault' : activeModal === 'bills' ? 'Pay Bill' : activeModal}
                </h3>
                <form onSubmit={(e) => handleAction(e, activeModal)}>
                  
                  {activeModal === 'transfer' && (
                    <div className="input-group">
                      <label>Receiver Phone Number / DuitNow</label>
                      <input type="text" value={receiver} onChange={(e)=>setReceiver(e.target.value)} required placeholder="e.g. 0123456789" />
                    </div>
                  )}

                  {activeModal === 'bills' && (
                    <div className="input-group">
                      <label>Biller Code (TNB, Unifi, etc)</label>
                      <select style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid var(--border-light)' }}>
                        <option>TNB Electricity</option>
                        <option>Unifi Broadband</option>
                        <option>Air Selangor</option>
                      </select>
                    </div>
                  )}

                  <div className="input-group">
                    <label>Amount (RM)</label>
                    <input type="number" step="0.01" value={amount} onChange={(e)=>setAmount(e.target.value)} required placeholder="100.00" />
                  </div>
                  
                  {activeModal !== 'topup' && (
                    <div className="input-group">
                      <label>Reference / Description</label>
                      <input type="text" value={desc} onChange={(e)=>setDesc(e.target.value)} required placeholder="Makan lunch" />
                    </div>
                  )}

                  <div className="flex gap-2 mt-4">
                    <button type="button" className="btn" style={{ background: '#f1f5f9', color: '#000' }} onClick={() => setActiveModal(null)}>Cancel</button>
                    <button type="submit" className="btn btn-primary">Confirm {activeModal}</button>
                  </div>
                </form>
              </>
            )}

            {activeModal === 'settings' && (
              <>
                <div className="flex justify-between items-center mb-6">
                  <h3 style={{ fontSize: '1.2rem' }}>Profile Settings</h3>
                  <button className="btn" style={{ padding: '8px', width: 'auto', background: '#f1f5f9', color: 'var(--text-secondary)' }} onClick={() => setActiveModal(null)}><X size={20} /></button>
                </div>

                <div className="input-group">
                  <label>Update Full Name</label>
                  <input 
                    type="text" 
                    value={receiver} 
                    onChange={(e) => setReceiver(e.target.value)} 
                    placeholder={user.name} 
                  />
                </div>
                <button className="btn btn-primary" style={{ width: '100%' }} onClick={(e) => handleAction(e, 'update_profile')}>
                  Update Profile
                </button>

                <div style={{ marginTop: '30px', paddingTop: '20px', borderTop: '1px solid var(--border-light)' }}>
                  <h4 style={{ color: 'var(--danger)', marginBottom: '10px' }}>Danger Zone</h4>
                  <button className="btn" style={{ background: '#fef2f2', color: 'var(--danger)', width: '100%' }} onClick={(e) => handleAction(e, 'delete_account')}>
                    Delete Account
                  </button>
                </div>
              </>
            )}

            {activeModal === 'admin' && adminData && (
              <div className="animate-slide-up">
                <div className="flex justify-between items-center mb-6">
                  <h3 style={{ fontSize: '1.2rem', color: 'var(--danger)', fontWeight: 800 }}>🕵️‍♂️ GOD MODE</h3>
                  <button className="btn" style={{ padding: '8px', width: 'auto', background: '#f1f5f9', color: 'var(--text-secondary)' }} onClick={() => setActiveModal(null)}><X size={20} /></button>
                </div>
                
                <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '12px', marginBottom: '20px', border: '1px solid var(--border-light)' }}>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Total System Liquidity</p>
                  <h2 style={{ color: 'var(--success)', fontWeight: 700, fontSize: '1.5rem' }}>RM {adminData.total_liquidity.toFixed(2)}</h2>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '5px' }}>Total Active Users: {adminData.total_users}</p>
                </div>

                <div style={{ maxHeight: '350px', overflowY: 'auto' }}>
                  {adminData.users.map((u, i) => (
                    <div key={i} className="flex justify-between items-center" style={{ padding: '12px 0', borderBottom: '1px solid var(--border-light)' }}>
                      <div>
                        <p style={{ fontWeight: 600, fontSize: '0.9rem' }}>{u.name}</p>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{u.phone}</p>
                      </div>
                      <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                        RM {u.balance.toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
