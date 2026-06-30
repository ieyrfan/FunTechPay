import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const [isRegister, setIsRegister] = useState(false);
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [pin, setPin] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [faceScanActive, setFaceScanActive] = useState(false);
  const [error, setError] = useState('');

  const handleFaceScan = () => {
    if(!phone) {
      setError("Please enter your phone number first");
      return;
    }
    setFaceScanActive(true);
    setTimeout(() => {
      setFaceScanActive(false);
      handleSubmit(null, true); 
    }, 1500);
  };

  const handleSubmit = async (e, skipPin = false) => {
    if(e) e.preventDefault();
    if(!phone) return;

    setLoading(true);
    setError('');

    const endpoint = isRegister ? '/register' : '/login';
    const payload = isRegister ? { phone, pin, name } : { phone, pin: skipPin ? "face-id" : pin };

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.detail || 'Authentication failed');
      }
      
      if (isRegister) {
        alert(data.message);
        setIsRegister(false);
        setPin('');
      } else {
        // Save user and JWT to localstorage
        localStorage.setItem('user', JSON.stringify(data.user_data));
        localStorage.setItem('token', data.token);
        navigate('/dashboard');
      }
      
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrapper animate-slide-up" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '20px' }}>
      
      <div className="text-center mb-8">
        <div style={{ background: '#4f46e5', width: '64px', height: '64px', borderRadius: '16px', margin: '0 auto 20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <ShieldIcon />
        </div>
        <h1 style={{ fontSize: 'clamp(1.5rem, 6vw, 1.8rem)', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px' }}>FunTechPay</h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          {isRegister ? 'Create an enterprise account' : 'Welcome back'}
        </p>
      </div>

      <div style={{ background: '#fff', padding: '20px', borderRadius: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.05)', width: '100%', maxWidth: '400px', boxSizing: 'border-box' }}>
        
        {error && (
          <div className="animate-slide-up" style={{ background: '#fef2f2', color: '#ef4444', padding: '12px', borderRadius: '12px', fontSize: '0.9rem', marginBottom: '20px', textAlign: 'center', fontWeight: 500 }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label>Phone Number</label>
            <input 
              type="text" 
              value={phone} 
              onChange={(e) => setPhone(e.target.value)} 
              placeholder="0123456789" 
              style={{ fontSize: '1.1rem', letterSpacing: '1px' }}
            />
          </div>

          {isRegister && (
            <div className="input-group">
              <label>Full Name</label>
              <input 
                type="text" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                placeholder="e.g. Irfan Rizal"
              />
            </div>
          )}

          <div className="input-group">
            <label>6-Digit Secure PIN</label>
            <input 
              type="password" 
              value={pin} 
              onChange={(e) => setPin(e.target.value)} 
              placeholder="••••••"
              maxLength={6}
              style={{ fontSize: '1.5rem', letterSpacing: '4px' }}
            />
          </div>

          <button type="submit" className="btn btn-primary mt-4" disabled={loading}>
            {loading ? <Loader2 className="animate-spin" /> : isRegister ? 'Register Account' : 'Login'}
          </button>

          {!isRegister && (
            <div className="text-center mt-4">
              <button 
                type="button" 
                onClick={handleFaceScan}
                style={{ 
                  background: faceScanActive ? '#4f46e5' : '#f1f5f9', 
                  color: faceScanActive ? 'white' : '#4f46e5', 
                  border: 'none', 
                  padding: '12px 24px', 
                  borderRadius: '12px', 
                  fontWeight: 600, 
                  cursor: 'pointer',
                  width: '100%',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                {faceScanActive ? (
                  <>
                    <Loader2 className="animate-spin" size={18} /> Authenticating...
                  </>
                ) : (
                  <>
                    <FaceIdIcon /> Use AWS Face ID
                  </>
                )}
              </button>
            </div>
          )}
        </form>

        <div className="text-center mt-8">
          <button 
            style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontWeight: 500, cursor: 'pointer', fontSize: '0.9rem' }} 
            onClick={() => { setIsRegister(!isRegister); setPin(''); setError(''); }}
          >
            {isRegister ? 'Already have an account? Login' : "Don't have an account? Register"}
          </button>
        </div>

      </div>
    </div>
  );
}

function ShieldIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  );
}

function FaceIdIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 7V5a2 2 0 0 1 2-2h2"/>
      <path d="M17 3h2a2 2 0 0 1 2 2v2"/>
      <path d="M21 17v2a2 2 0 0 1-2 2h-2"/>
      <path d="M7 21H5a2 2 0 0 1-2-2v-2"/>
      <rect x="8" y="8" width="8" height="8" rx="2"/>
    </svg>
  );
}
