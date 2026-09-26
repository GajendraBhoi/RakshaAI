import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Eye, EyeOff, LockKeyhole, Mail, ShieldCheck, Sparkles, Wifi } from 'lucide-react';
import api from '../lib/api';
import { saveSession } from '../lib/auth';

const trustPoints = [
  'Evidence-led mine operations',
  'DGMS-ready governance records',
  'Edge-ready underground workflows',
];

export default function Login() {
  const [mode, setMode] = useState('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [requestName, setRequestName] = useState('');
  const [requestRole, setRequestRole] = useState('Mine Manager');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await api.post('/auth/login', { email, password });
      saveSession(response.data);
      if (response.data.role === 'r-corporate') navigate('/corporate');
      else if (response.data.role === 'r-manager' && response.data.mine_id) navigate(`/mine/${response.data.mine_id}`);
      else navigate('/inspect');
    } catch {
      setError('We could not verify those credentials. Check the email and password, then try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAccessRequest = (event) => {
    event.preventDefault();
    setError('');
    setNotice(`Access request noted for ${requestName || 'your team'}. A mine administrator will provision your RakshaAI account.`);
  };

  return (
    <main className="auth-page">
      <section className="auth-story-panel">
        <div className="auth-story-top"><a href="/" className="auth-brand"><span className="auth-brand-mark"><ShieldCheck size={18} /></span><span>RAKSHA<span>AI</span></span></a><span className="auth-secure-label"><LockKeyhole size={12} /> Secure workspace</span></div>
        <div className="auth-story-content"><div className="auth-story-kicker"><Sparkles size={13} /> Mine safety intelligence</div><h1>Make every shift<br /><em>defensible.</em></h1><p>One calm place for the signals, decisions, and evidence that keep people safe underground.</p><div className="auth-story-list">{trustPoints.map((point) => <span key={point}><CheckCircle2 size={14} /> {point}</span>)}</div></div>
        <div className="auth-story-footer"><span><Wifi size={13} /> Edge sync enabled</span><span>RakshaAI platform · 2026</span></div>
      </section>

      <section className="auth-form-panel"><div className="auth-form-wrap"><div className="auth-mobile-brand"><span className="auth-brand-mark"><ShieldCheck size={18} /></span><strong>RakshaAI</strong></div><div className="auth-form-heading"><span className="auth-overline">Command center access</span><h2>{mode === 'signin' ? 'Welcome back.' : 'Join the safety desk.'}</h2><p>{mode === 'signin' ? 'Sign in to continue to your mine workspace.' : 'Access is provisioned by your mine administrator.'}</p></div><div className="auth-mode-switch"><button type="button" className={mode === 'signin' ? 'active' : ''} onClick={() => { setMode('signin'); setNotice(''); setError(''); }}>Sign in</button><button type="button" className={mode === 'request' ? 'active' : ''} onClick={() => { setMode('request'); setNotice(''); setError(''); }}>Request access</button></div>{error && <div className="auth-message error"><span>!</span>{error}</div>}{notice && <div className="auth-message success"><CheckCircle2 size={15} />{notice}</div>}

+        {mode === 'signin' ? <form onSubmit={handleLogin} className="auth-form"><label className="auth-field"><span>Work email</span><div><Mail size={16} /><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@mine-operations.in" autoComplete="email" required /></div></label><label className="auth-field"><span>Password</span><div><LockKeyhole size={16} /><input type={showPassword ? 'text' : 'password'} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter your password" autoComplete="current-password" required /><button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button></div></label><div className="auth-form-options"><label><input type="checkbox" /> <span>Keep me signed in</span></label><button type="button" onClick={() => setNotice('Password recovery is handled by your mine administrator.')}>Forgot password?</button></div><button className="auth-submit" type="submit" disabled={loading}>{loading ? 'Verifying workspace...' : <>Enter command center <ArrowRight size={16} /></>}</button><p className="auth-demo-hint"><span>Demo access</span> inspector.c@demo.com · password demo123</p></form> : <form onSubmit={handleAccessRequest} className="auth-form"><label className="auth-field"><span>Your name</span><div><ShieldCheck size={16} /><input value={requestName} onChange={(event) => setRequestName(event.target.value)} placeholder="e.g. Priya Sharma" required /></div></label><label className="auth-field"><span>Work email</span><div><Mail size={16} /><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@mine-operations.in" required /></div></label><label className="auth-field"><span>Your role</span><div><select value={requestRole} onChange={(event) => setRequestRole(event.target.value)}><option>Mine Manager</option><option>Overman / Sirdar</option><option>Safety Officer</option><option>DGMS Inspector</option><option>Corporate Operations</option></select></div></label><button className="auth-submit" type="submit">Send access request <ArrowRight size={16} /></button><p className="auth-demo-hint">Your administrator will confirm mine scope and role permissions before activation.</p></form>}
        <p className="auth-legal">By continuing, you agree to RakshaAI's <button type="button">secure use policy</button> and operational audit terms.</p></div></section>
    </main>
  );
}
