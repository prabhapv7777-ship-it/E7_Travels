import React, { useState, useEffect } from 'react';
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  ShieldCheck,
  ShieldAlert,
  LogIn,
  HelpCircle,
  Sparkles,
} from 'lucide-react';

interface AdminLoginProps {
  onLoginSuccess: (email: string) => void;
}

export default function AdminLogin({ onLoginSuccess }: AdminLoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showHint, setShowHint] = useState(true);

  // Default credentials
  const DEFAULT_EMAIL = 'admin@e7travels.com';
  const DEFAULT_PASSWORD = 'admin';

  useEffect(() => {
    // Check if credentials are saved in localStorage
    const savedEmail = localStorage.getItem('e7_admin_remembered_email');
    if (savedEmail) {
      setEmail(savedEmail);
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError('Please enter your administrative email address.');
      return;
    }
    if (!password) {
      setError('Please enter your administrator password.');
      return;
    }

    setIsLoading(true);

    // Simulate database lookup / encryption check with a realistic micro-timeout
    setTimeout(() => {
      const trimmedEmail = email.trim().toLowerCase();
      
      // Check against standard preset admin credentials
      if (trimmedEmail === DEFAULT_EMAIL && password === DEFAULT_PASSWORD) {
        if (rememberMe) {
          localStorage.setItem('e7_admin_remembered_email', trimmedEmail);
        } else {
          localStorage.removeItem('e7_admin_remembered_email');
        }
        
        localStorage.setItem('e7_admin_session_active', 'true');
        onLoginSuccess(trimmedEmail);
      } else {
        setError('Invalid administrative credentials. Please verify your email and password.');
        setIsLoading(false);
      }
    }, 850);
  };

  const fillDefaultCredentials = () => {
    setEmail(DEFAULT_EMAIL);
    setPassword(DEFAULT_PASSWORD);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans antialiased selection:bg-blue-100">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        
        {/* Brand/Logo Identifier */}
        <div className="flex flex-col items-center">
          <div className="relative group mb-4">
            {/* Ambient Background Glow */}
            <div className="absolute -inset-1.5 bg-gradient-to-r from-blue-600 via-amber-500 to-indigo-600 rounded-3xl blur-md opacity-45 group-hover:opacity-75 transition duration-1000 group-hover:duration-200"></div>
            
            {/* Main Interactive Logo Container */}
            <div className="relative w-20 h-20 bg-gradient-to-br from-blue-950 via-slate-900 to-indigo-950 rounded-2xl flex items-center justify-center shadow-2xl border-2 border-white/10 transition-all duration-300 group-hover:scale-105 group-hover:border-blue-500">
              {/* Custom SVG Vector Corporate Travel Logo */}
              <svg className="w-14 h-14" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Dynamic Forward Chevron (Gold) */}
                <path d="M40 20L75 50L40 80" stroke="url(#goldGradient)" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
                {/* Deep Blue Transport Wing Lines (Silver/Blue) */}
                <path d="M25 35L55 50L25 65" stroke="url(#blueGradient)" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M10 42L35 50L10 58" stroke="url(#silverGradient)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" opacity="0.7" />
                
                {/* Central Elegant Monogram Text */}
                <text x="32" y="58" fill="white" fontSize="22" fontWeight="900" fontFamily="'Inter', sans-serif" letterSpacing="-1">E7</text>
                
                {/* Defs for gradients */}
                <defs>
                  <linearGradient id="goldGradient" x1="40" y1="20" x2="75" y2="80" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#F59E0B" />
                    <stop offset="50%" stopColor="#FBBF24" />
                    <stop offset="100%" stopColor="#D97706" />
                  </linearGradient>
                  <linearGradient id="blueGradient" x1="25" y1="35" x2="55" y2="65" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#3B82F6" />
                    <stop offset="100%" stopColor="#1E3A8A" />
                  </linearGradient>
                  <linearGradient id="silverGradient" x1="10" y1="42" x2="35" y2="58" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#E2E8F0" />
                    <stop offset="100%" stopColor="#94A3B8" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
          </div>
          
          <h2 className="text-center text-2xl font-extrabold text-slate-800 tracking-tight">
            E7 Travels Fleet ERP
          </h2>
          <p className="mt-1 text-center text-xs font-semibold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Chennai Corporate Logistics
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 sm:px-10 rounded-2xl border border-slate-200/80 shadow-md space-y-6">
          
          {/* Section Indicator */}
          <div className="border-b border-slate-100 pb-4 text-center">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-3xs font-extrabold uppercase tracking-wider border border-blue-100">
              <ShieldCheck className="h-3 w-3" /> Secure Gatekeeper Active
            </span>
          </div>

          {/* Validation Banner */}
          {error && (
            <div className="p-3.5 bg-rose-50 text-rose-700 text-xs border border-rose-200 rounded-xl flex items-start gap-2.5 animate-pulse">
              <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Authentication Refused</p>
                <p className="text-3xs text-rose-600 mt-0.5">{error}</p>
              </div>
            </div>
          )}

          {/* Main Credentials Form */}
          <form className="space-y-5" onSubmit={handleSubmit}>
            
            {/* Email Address */}
            <div>
              <label htmlFor="admin-email" className="block text-3xs font-extrabold text-slate-500 uppercase tracking-wider mb-1.5">
                Administrative Email *
              </label>
              <div className="relative rounded-xl shadow-3xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  id="admin-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="admin@e7travels.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 text-xs border border-slate-200 rounded-xl bg-slate-50/50 hover:bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all text-slate-800 font-medium"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="admin-password" className="block text-3xs font-extrabold text-slate-500 uppercase tracking-wider mb-1.5">
                Administrator Password *
              </label>
              <div className="relative rounded-xl shadow-3xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  id="admin-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-10 py-2.5 text-xs border border-slate-200 rounded-xl bg-slate-50/50 hover:bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all text-slate-800 font-mono tracking-widest"
                />
                <button
                  id="toggle-password-visibility"
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me Toggle */}
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded cursor-pointer"
                />
                <label htmlFor="remember-me" className="ml-2 block text-3xs font-extrabold text-slate-500 uppercase tracking-wider cursor-pointer">
                  Remember my workstation
                </label>
              </div>
            </div>

            {/* Submit Button */}
            <div>
              <button
                id="admin-login-submit"
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-xs text-xs font-bold text-white bg-blue-900 hover:bg-blue-950 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-900 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Verifying Access Keys...
                  </>
                ) : (
                  <>
                    <LogIn className="h-4 w-4" /> Authorise Access
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Preset Admin Credentials Tip */}
          {showHint && (
            <div className="mt-4 p-4 bg-amber-50/70 border border-amber-200 rounded-xl space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-amber-800">
                  <HelpCircle className="h-3.5 w-3.5" />
                  <span className="text-3xs font-extrabold uppercase tracking-wider">Default Admin Credentials</span>
                </div>
                <button
                  id="admin-credential-auto-fill"
                  onClick={fillDefaultCredentials}
                  className="text-4xs font-black text-amber-900 uppercase tracking-widest bg-amber-200/60 hover:bg-amber-200 px-2 py-0.5 rounded transition-all flex items-center gap-1"
                >
                  <Sparkles className="h-2.5 w-2.5 text-amber-800" /> Auto Fill
                </button>
              </div>
              <div className="text-[11px] text-amber-700/90 leading-normal font-medium space-y-1">
                <p>Use these credentials to gain full developer-level administrative clearance:</p>
                <div className="bg-white/80 border border-amber-200/50 rounded-lg p-2 font-mono text-[10px] space-y-1">
                  <div><span className="font-extrabold text-amber-900">Email:</span> admin@e7travels.com</div>
                  <div><span className="font-extrabold text-amber-900">Password:</span> admin</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
