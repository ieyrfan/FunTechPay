import { useNavigate } from 'react-router-dom';
import { ShieldAlert, Users, Search, Activity, Lock } from 'lucide-react';

export default function Admin() {
  const navigate = useNavigate();

  const flaggedTransactions = [
    { id: 'FTX-9021', user: 'Abu Bakar', amount: 'RM 15,000.00', reason: 'Unusual Login Location', risk: 'High' },
    { id: 'FTX-9022', user: 'Siti Nurhaliza', amount: 'RM 4,500.00', reason: 'Multiple Failed PIN', risk: 'Medium' },
    { id: 'FTX-9023', user: 'Jason Lee', amount: 'RM 25,000.00', reason: 'Exceeds Velocity Limit', risk: 'High' },
  ];

  return (
    <div style={{ padding: '40px 5%' }}>
      <header className="flex justify-between items-center" style={{ marginBottom: '40px' }}>
        <div className="flex items-center gap-2">
          <ShieldAlert size={32} color="var(--danger)" />
          <h2>FunTechPay <span style={{ color: 'var(--text-secondary)', fontWeight: 300 }}>| Bank Fraud Prevention Console</span></h2>
        </div>
        <button className="btn btn-outline" style={{ width: 'auto' }} onClick={() => navigate('/login')}>
          Logout Admin
        </button>
      </header>

      <div className="dashboard-grid">
        <div className="glass-panel animate-fade-in" style={{ borderColor: 'rgba(239,68,68,0.3)' }}>
          <h3 style={{ color: 'var(--text-secondary)' }}><Activity size={18} style={{ verticalAlign: 'middle', marginRight: '8px' }}/> AI Fraud Detection (SageMaker)</h3>
          <h1 style={{ fontSize: '2.5rem', color: 'var(--danger)', margin: '15px 0' }}>3 Flagged</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Suspicious transfers today</p>
        </div>

        <div className="glass-panel animate-fade-in">
          <h3 style={{ color: 'var(--text-secondary)' }}><Users size={18} style={{ verticalAlign: 'middle', marginRight: '8px' }}/> KYC Verifications Pending</h3>
          <h1 style={{ fontSize: '2.5rem', color: 'var(--warning)', margin: '15px 0' }}>142 Users</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Awaiting AWS Rekognition scan</p>
        </div>

        <div className="glass-panel animate-fade-in">
          <h3 style={{ color: 'var(--text-secondary)' }}><Lock size={18} style={{ verticalAlign: 'middle', marginRight: '8px' }}/> Vault Status</h3>
          <h1 style={{ fontSize: '2.5rem', color: 'var(--success)', margin: '15px 0' }}>Secured</h1>
          <p style={{ color: 'var(--success)', fontSize: '0.875rem' }}>DynamoDB Encryption Active</p>
        </div>
      </div>

      <div className="glass-panel animate-fade-in mt-8">
        <h3 style={{ marginBottom: '20px', color: 'var(--text-secondary)' }}>Flagged Transactions (Action Required)</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-light)', color: 'var(--text-secondary)' }}>
              <th style={{ padding: '12px' }}>Transaction ID</th>
              <th style={{ padding: '12px' }}>User</th>
              <th style={{ padding: '12px' }}>Amount</th>
              <th style={{ padding: '12px' }}>AI Reason</th>
              <th style={{ padding: '12px' }}>Risk Level</th>
              <th style={{ padding: '12px' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {flaggedTransactions.map((txn, i) => (
              <tr key={i} style={{ borderBottom: '1px solid var(--border-light)' }}>
                <td style={{ padding: '16px 12px', fontFamily: 'monospace' }}>{txn.id}</td>
                <td style={{ padding: '16px 12px', fontWeight: 'bold' }}>{txn.user}</td>
                <td style={{ padding: '16px 12px' }}>{txn.amount}</td>
                <td style={{ padding: '16px 12px', color: 'var(--text-secondary)' }}>{txn.reason}</td>
                <td style={{ padding: '16px 12px' }}>
                  <span className="status-badge" style={{ background: txn.risk === 'High' ? 'rgba(239,68,68,0.1)' : 'rgba(234,179,8,0.1)', color: txn.risk === 'High' ? 'var(--danger)' : 'var(--warning)', padding: '4px 8px', borderRadius: '4px' }}>
                    {txn.risk}
                  </span>
                </td>
                <td style={{ padding: '16px 12px' }}>
                  <button className="btn" style={{ background: 'var(--danger)', color: 'white', padding: '6px 12px', fontSize: '0.8rem', width: 'auto' }}>Freeze</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
