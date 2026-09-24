import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Sparkles, 
  Radio, 
  Users, 
  Gift, 
  MessageSquare, 
  ShieldCheck, 
  AlertCircle, 
  CheckCircle,
  User, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  LogIn, 
  UserPlus 
} from 'lucide-react';

interface LoginScreenProps {
  onSuccess?: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onSuccess }) => {
  const { 
    loginWithGoogle, 
    loginWithIdentifier, 
    registerWithUsernameOrGmail, 
    loginAsGuestUser 
  } = useApp();

  // Mode: 'signin' | 'signup'
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');

  // Sign In inputs
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');

  // Sign Up inputs
  const [signupUsername, setSignupUsername] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupDisplayName, setSignupDisplayName] = useState('');
  const [signupPassword, setSignupPassword] = useState('');

  // UI States
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [guestLoading, setGuestLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleIdentifierLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

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
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setErrorMsg(err?.message || "Invalid credentials. Please check your username/Gmail and password.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!signupUsername.trim()) {
      setErrorMsg("Please enter a username.");
      return;
    }
    if (signupUsername.trim().length < 3) {
      setErrorMsg("Username must be at least 3 characters long.");
      return;
    }
    if (!signupPassword || signupPassword.length < 6) {
      setErrorMsg("Password must be at least 6 characters long.");
      return;
    }

    setLoading(true);
    try {
      await registerWithUsernameOrGmail(
        signupUsername.trim(),
        signupEmail.trim(),
        signupPassword,
        signupDisplayName.trim() || signupUsername.trim()
      );
      setSuccessMsg("Account created successfully! 12,000 Coins added to your wallet.");
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setErrorMsg(err?.message || "Could not complete registration. Please check your inputs.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setGoogleLoading(true);
    try {
      await loginWithGoogle();
      if (onSuccess) onSuccess();
    } catch (err: any) {
      const isUserDismissal = err?.code === 'auth/popup-closed-by-user' || 
                              err?.code === 'auth/cancelled-popup-request' ||
                              err?.message?.includes('popup-closed-by-user');
      if (isUserDismissal) {
        setErrorMsg("Google Sign-In was closed. Please try again or use Username/Gmail login below.");
      } else if (err?.code === 'auth/popup-blocked') {
        setErrorMsg("Browser blocked popup. Please sign in with Username or Gmail below.");
      } else {
        setErrorMsg(err?.message || "Google Authentication failed. Try Username or Gmail login.");
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleGuestSignIn = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setGuestLoading(true);
    try {
      await loginAsGuestUser();
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setErrorMsg("Could not enter guest mode. Please try again.");
    } finally {
      setGuestLoading(false);
    }
  };

  return (
    <div className="min-h-screen min-h-[100dvh] w-full bg-slate-950 flex flex-col items-center justify-center p-3 sm:p-4 text-white overflow-y-auto py-8">
      
      {/* Responsive Card Container */}
      <div className="w-full max-w-sm sm:max-w-md bg-gradient-to-b from-slate-900/95 via-slate-900/90 to-slate-950/95 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl relative flex flex-col my-auto">
        
        {/* Ambient Top Glow */}
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-48 sm:w-64 h-24 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Brand Header */}
        <div className="text-center relative z-10 pt-1 pb-3">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-3xl bg-gradient-to-tr from-[#20d7a6] via-[#26deab] to-[#4eedc4] flex items-center justify-center text-slate-950 font-black text-3xl mx-auto mb-2.5 shadow-xl shadow-emerald-500/30 border-2 border-white/30">
            ★
          </div>
          
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center justify-center gap-2">
            <span>StarLive</span>
            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
              COMMUNITY
            </span>
          </h1>

          <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto leading-relaxed">
            Live video broadcasting, voice party rooms, and community gifts
          </p>
        </div>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-2 gap-2 my-2.5 relative z-10">
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-2 flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <Radio size={14} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-200 truncate">Live Streams</p>
              <p className="text-[10px] text-slate-400 truncate">HD Broadcast</p>
            </div>
          </div>

          <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-2 flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0">
              <Users size={14} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-200 truncate">Voice Party</p>
              <p className="text-[10px] text-slate-400 truncate">8-Seat Mics</p>
            </div>
          </div>
        </div>

        {/* Welcome Bonus Callout */}
        <div className="bg-gradient-to-r from-amber-500/15 via-yellow-500/10 to-amber-500/15 border border-amber-500/30 rounded-2xl p-2.5 mb-3.5 text-center relative z-10">
          <div className="flex items-center justify-center gap-1.5 text-amber-300 font-extrabold text-xs">
            <Sparkles size={14} className="text-amber-400 shrink-0" />
            <span>Explorer Bonus: 12,000 Free Coins</span>
            <span>🪙</span>
          </div>
          <p className="text-[10px] text-amber-200/80 mt-0.5">
            Auto-credited immediately on Sign In or Account Creation
          </p>
        </div>

        {/* Auth Mode Tabs: Sign In vs Sign Up */}
        <div className="bg-slate-950/80 p-1 rounded-2xl border border-slate-800 flex gap-1 mb-3.5 relative z-10">
          <button
            id="tab-auth-signin"
            type="button"
            onClick={() => {
              setAuthMode('signin');
              setErrorMsg(null);
            }}
            className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              authMode === 'signin'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <LogIn size={14} />
            <span>Sign In</span>
          </button>

          <button
            id="tab-auth-signup"
            type="button"
            onClick={() => {
              setAuthMode('signup');
              setErrorMsg(null);
            }}
            className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              authMode === 'signup'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <UserPlus size={14} />
            <span>Create Account</span>
          </button>
        </div>

        {/* Error Notification */}
        {errorMsg && (
          <div className="mb-3 p-2.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-200 text-xs flex items-start gap-2 relative z-10 animate-in fade-in duration-200">
            <AlertCircle size={15} className="text-rose-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium leading-tight">{errorMsg}</p>
            </div>
          </div>
        )}

        {/* Success Notification */}
        {successMsg && (
          <div className="mb-3 p-2.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-200 text-xs flex items-start gap-2 relative z-10 animate-in fade-in duration-200">
            <CheckCircle size={15} className="text-emerald-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold leading-tight">{successMsg}</p>
            </div>
          </div>
        )}

        {/* SIGN IN FORM (Username or Gmail) */}
        {authMode === 'signin' && (
          <form onSubmit={handleIdentifierLogin} className="space-y-3 relative z-10">
            <div>
              <label className="text-[11px] font-bold text-slate-300 mb-1 flex items-center gap-1">
                <User size={12} className="text-emerald-400" />
                Username or Gmail
              </label>
              <div className="relative">
                <input
                  id="signin-identifier-input"
                  type="text"
                  required
                  autoComplete="off"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="Enter Username or Gmail"
                  className="w-full bg-slate-800/90 border border-slate-700/80 rounded-2xl py-2.5 px-3.5 pl-9 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/30 transition-all"
                />
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                  {identifier.includes('@') ? <Mail size={14} /> : <User size={14} />}
                </div>
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-300 mb-1 flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <Lock size={12} className="text-emerald-400" />
                  Password
                </span>
              </label>
              <div className="relative">
                <input
                  id="signin-password-input"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full bg-slate-800/90 border border-slate-700/80 rounded-2xl py-2.5 px-3.5 pl-9 pr-10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/30 transition-all"
                />
                <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1"
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            <button
              id="signin-submit-btn"
              type="submit"
              disabled={loading || googleLoading || guestLoading}
              className="w-full py-3 bg-gradient-to-r from-emerald-500 via-[#20d7a6] to-teal-500 hover:opacity-95 text-slate-950 font-black rounded-2xl text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/20 active:scale-[0.98] cursor-pointer disabled:opacity-60"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  <span>Signing In...</span>
                </>
              ) : (
                <>
                  <LogIn size={15} />
                  <span>Sign In with Username or Gmail</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* SIGN UP FORM */}
        {authMode === 'signup' && (
          <form onSubmit={handleSignup} className="space-y-2.5 relative z-10">
            <div>
              <label className="text-[11px] font-bold text-slate-300 mb-1 flex items-center gap-1">
                <User size={12} className="text-emerald-400" />
                Username <span className="text-rose-400">*</span>
              </label>
              <input
                id="signup-username-input"
                type="text"
                required
                value={signupUsername}
                onChange={(e) => setSignupUsername(e.target.value)}
                placeholder="Choose username (e.g. star_streamer)"
                className="w-full bg-slate-800/90 border border-slate-700/80 rounded-2xl py-2 px-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/30 transition-all"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-300 mb-1 flex items-center gap-1">
                <Mail size={12} className="text-emerald-400" />
                Gmail / Email <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <input
                id="signup-email-input"
                type="email"
                value={signupEmail}
                onChange={(e) => setSignupEmail(e.target.value)}
                placeholder="user@gmail.com (Optional for username account)"
                className="w-full bg-slate-800/90 border border-slate-700/80 rounded-2xl py-2 px-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/30 transition-all"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-300 mb-1 flex items-center gap-1">
                <Sparkles size={12} className="text-emerald-400" />
                Display Name <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <input
                id="signup-displayname-input"
                type="text"
                value={signupDisplayName}
                onChange={(e) => setSignupDisplayName(e.target.value)}
                placeholder="Your Public Profile Name"
                className="w-full bg-slate-800/90 border border-slate-700/80 rounded-2xl py-2 px-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/30 transition-all"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-300 mb-1 flex items-center gap-1">
                <Lock size={12} className="text-emerald-400" />
                Password <span className="text-rose-400">*</span> (min 6 chars)
              </label>
              <div className="relative">
                <input
                  id="signup-password-input"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={signupPassword}
                  onChange={(e) => setSignupPassword(e.target.value)}
                  placeholder="Create a strong password"
                  className="w-full bg-slate-800/90 border border-slate-700/80 rounded-2xl py-2 px-3 pr-9 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/30 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1"
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            <button
              id="signup-submit-btn"
              type="submit"
              disabled={loading || googleLoading || guestLoading}
              className="w-full py-3 mt-1 bg-gradient-to-r from-emerald-500 via-[#20d7a6] to-teal-500 hover:opacity-95 text-slate-950 font-black rounded-2xl text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/20 active:scale-[0.98] cursor-pointer disabled:opacity-60"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  <span>Creating Account...</span>
                </>
              ) : (
                <>
                  <Sparkles size={15} className="text-amber-900" />
                  <span>Create Account & Get 12,000 Coins 🪙</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* Divider */}
        <div className="flex items-center gap-3 my-3 relative z-10">
          <div className="flex-1 h-px bg-slate-800" />
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
            Or quick connect
          </span>
          <div className="flex-1 h-px bg-slate-800" />
        </div>

        {/* Google 1-Tap & Guest Buttons */}
        <div className="space-y-2 relative z-10">
          <button
            id="login-continue-google-btn"
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading || googleLoading || guestLoading}
            className="w-full py-2.5 px-3 bg-white hover:bg-slate-100 text-slate-900 font-bold rounded-2xl text-xs sm:text-sm flex items-center justify-center gap-2.5 transition-all duration-200 shadow-md active:scale-[0.98] border border-slate-200 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {googleLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-slate-400 border-t-slate-900 rounded-full animate-spin" />
                <span className="text-slate-800 font-bold">Connecting with Google...</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span className="tracking-tight text-slate-900 font-extrabold">
                  Continue with Google
                </span>
              </>
            )}
          </button>

          <button
            id="login-continue-guest-btn"
            type="button"
            onClick={handleGuestSignIn}
            disabled={loading || googleLoading || guestLoading}
            className="w-full text-xs text-slate-400 hover:text-emerald-400 font-semibold transition-colors py-1.5 px-3 rounded-xl hover:bg-slate-800/60 active:scale-95 cursor-pointer disabled:opacity-50 text-center block"
          >
            {guestLoading ? "Entering as Guest..." : "Or continue as Guest Explorer (12,000 Coins)"}
          </button>
        </div>

        {/* Security & Admin Notice Footnote */}
        <div className="mt-3.5 text-center relative z-10 pt-2.5 border-t border-slate-800/80">
          <p className="text-[10px] text-slate-400 flex items-center justify-center gap-1">
            <ShieldCheck size={13} className="text-emerald-400 shrink-0" />
            <span>Admin portal authorized exclusively for registered users only.</span>
          </p>
        </div>

      </div>
    </div>
  );
};
