import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  X, 
  Sparkles, 
  ShieldCheck, 
  AlertCircle, 
  User, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  LogIn, 
  UserPlus 
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { 
    loginWithGoogle, 
    loginWithIdentifier, 
    registerWithUsernameOrGmail 
  } = useApp();

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Signup fields
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleIdentifierLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!identifier.trim()) {
      setErrorMsg("Please enter your Username or Gmail address.");
      return;
    }
    if (!password) {
      setErrorMsg("Please enter your password.");
      return;
    }

    setLoading(true);
    try {
      await loginWithIdentifier(identifier.trim(), password);
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.message || "Invalid credentials. Please check your username/Gmail.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!username.trim() || username.trim().length < 3) {
      setErrorMsg("Username must be at least 3 characters long.");
      return;
    }
    if (!password || password.length < 6) {
      setErrorMsg("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    try {
      await registerWithUsernameOrGmail(
        username.trim(),
        email.trim(),
        password,
        displayName.trim() || username.trim()
      );
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setErrorMsg('');
      setGoogleLoading(true);
      await loginWithGoogle();
      onClose();
    } catch (err: any) {
      const isUserDismissal = err?.code === 'auth/popup-closed-by-user' || 
                              err?.code === 'auth/cancelled-popup-request' ||
                              err?.message?.includes('popup-closed-by-user');
      if (isUserDismissal) {
        setErrorMsg("Google Sign-In was closed. Try Username/Gmail login below.");
      } else if (err?.code === 'auth/popup-blocked') {
        setErrorMsg("Popup blocked. Please login with Username or Gmail below.");
      } else {
        setErrorMsg(err.message || 'Google Sign-In failed.');
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-3xl w-full max-w-sm p-5 relative shadow-2xl animate-in slide-in-from-bottom-6 sm:zoom-in-95 max-h-[92vh] overflow-y-auto">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-white bg-slate-800 transition-colors"
          title="Close"
        >
          <X size={16} />
        </button>

        <div className="text-center mb-3 pt-1">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#20d7a6] via-[#26deab] to-[#4eedc4] flex items-center justify-center text-slate-950 font-black text-xl mx-auto mb-2 shadow-lg shadow-emerald-500/30">
            ★
          </div>
          <h3 className="text-base font-black text-white">
            {mode === 'signin' ? 'Sign In to StarLive' : 'Join StarLive Community'}
          </h3>
          <p className="text-[11px] text-slate-400 mt-0.5 max-w-[260px] mx-auto">
            {mode === 'signin' ? 'Enter with your Username or Gmail address' : 'Create your account and claim 12,000 Free Coins 🪙'}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="bg-slate-950 p-1 rounded-xl border border-slate-800 flex gap-1 mb-3">
          <button
            type="button"
            onClick={() => { setMode('signin'); setErrorMsg(''); }}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              mode === 'signin' ? 'bg-emerald-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white'
            }`}
          >
            <LogIn size={13} />
            <span>Sign In</span>
          </button>
          <button
            type="button"
            onClick={() => { setMode('signup'); setErrorMsg(''); }}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              mode === 'signup' ? 'bg-emerald-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white'
            }`}
          >
            <UserPlus size={13} />
            <span>Sign Up</span>
          </button>
        </div>

        {errorMsg && (
          <div className="mb-3 p-2.5 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs flex items-start gap-2">
            <AlertCircle size={14} className="text-rose-400 shrink-0 mt-0.5" />
            <span className="leading-tight">{errorMsg}</span>
          </div>
        )}

        {/* Welcome coins callout */}
        <div className="p-2 bg-amber-500/15 border border-amber-500/30 rounded-xl mb-3 text-center">
          <p className="text-[11px] font-bold text-amber-300 flex items-center justify-center gap-1">
            <Sparkles size={13} className="text-amber-400" />
            <span>12,000 Coins awarded upon entry</span>
            <span>🪙</span>
          </p>
        </div>

        {/* SIGN IN FORM */}
        {mode === 'signin' && (
          <form onSubmit={handleIdentifierLogin} className="space-y-2.5">
            <div>
              <label className="text-[11px] font-bold text-slate-300 block mb-1">
                Username or Gmail
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  autoComplete="off"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="Enter Username or Gmail"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl py-2 px-3 pl-8 text-xs text-white focus:outline-none focus:border-emerald-400"
                />
                <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400">
                  {identifier.includes('@') ? <Mail size={13} /> : <User size={13} />}
                </div>
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-300 block mb-1">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl py-2 px-3 pl-8 pr-8 text-xs text-white focus:outline-none focus:border-emerald-400"
                />
                <Lock size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  {showPassword ? <EyeOff size={13} /> : <Eye size={13} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || googleLoading}
              className="w-full py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md disabled:opacity-60"
            >
              {loading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <LogIn size={14} />
                  <span>Sign In</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* SIGN UP FORM */}
        {mode === 'signup' && (
          <form onSubmit={handleSignup} className="space-y-2">
            <div>
              <label className="text-[11px] font-bold text-slate-300 block mb-0.5">Username *</label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Choose username (e.g. starlive_fan)"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl py-1.5 px-3 text-xs text-white focus:outline-none focus:border-emerald-400"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-300 block mb-0.5">Gmail / Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@gmail.com (Optional)"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl py-1.5 px-3 text-xs text-white focus:outline-none focus:border-emerald-400"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-300 block mb-0.5">Display Name</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your Public Name (Optional)"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl py-1.5 px-3 text-xs text-white focus:outline-none focus:border-emerald-400"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-300 block mb-0.5">Password *</label>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 6 characters"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl py-1.5 px-3 text-xs text-white focus:outline-none focus:border-emerald-400"
              />
            </div>

            <button
              type="submit"
              disabled={loading || googleLoading}
              className="w-full py-2.5 mt-1 bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md disabled:opacity-60"
            >
              {loading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  <span>Creating Account...</span>
                </>
              ) : (
                <>
                  <Sparkles size={14} />
                  <span>Create Account (12,000 Coins)</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* Divider */}
        <div className="flex items-center gap-2 my-2.5">
          <div className="flex-1 h-px bg-slate-800" />
          <span className="text-[10px] text-slate-400 uppercase font-bold">Or</span>
          <div className="flex-1 h-px bg-slate-800" />
        </div>

        {/* Google Continue Button */}
        <button
          id="modal-continue-google-btn"
          type="button"
          onClick={handleGoogleLogin}
          disabled={googleLoading || loading}
          className="w-full py-2.5 px-3 bg-white hover:bg-slate-100 text-slate-950 font-extrabold rounded-xl text-xs flex items-center justify-center gap-2 border border-slate-200 transition-all shadow-md cursor-pointer disabled:opacity-75"
        >
          {googleLoading ? (
            <div className="flex items-center gap-2">
              <div className="w-3.5 h-3.5 border-2 border-slate-400 border-t-slate-900 rounded-full animate-spin" />
              <span>Connecting Google...</span>
            </div>
          ) : (
            <>
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>Continue with Google</span>
            </>
          )}
        </button>

        <div className="mt-3 text-center">
          <p className="text-[10px] text-slate-400 flex items-center justify-center gap-1">
            <ShieldCheck size={12} className="text-emerald-400 shrink-0" />
            <span>Admin portal authorized exclusively for registered users only.</span>
          </p>
        </div>

      </div>
    </div>
  );
};
