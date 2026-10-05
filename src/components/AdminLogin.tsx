/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

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
  CheckCircle2,
  Clock,
  Car,
  Building2,
  Navigation,
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

  // Default admin credentials
  const DEFAULT_EMAIL = 'admin@e7travels.com';
  const DEFAULT_PASSWORD = 'admin';

  const [forgotMsg, setForgotMsg] = useState(false);

  useEffect(() => {
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

    setTimeout(() => {
      const trimmedEmail = email.trim().toLowerCase();
      if (trimmedEmail === DEFAULT_EMAIL && password === DEFAULT_PASSWORD) {
        if (rememberMe) {
          localStorage.setItem('e7_admin_remembered_email', trimmedEmail);
        } else {
          localStorage.removeItem('e7_admin_remembered_email');
        }
        localStorage.setItem('e7_admin_session_active', 'true');
        onLoginSuccess(trimmedEmail);
      } else {
        setError('Invalid administrative credentials. Please check your email and password.');
        setIsLoading(false);
      }
    }, 600);
  };

  const fillDefaultCredentials = () => {
    setEmail(DEFAULT_EMAIL);
    setPassword(DEFAULT_PASSWORD);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col lg:flex-row font-sans antialiased text-[#172033]">
      {/* LEFT SPLIT SCREEN: Dark Emerald Green Branding & Visual */}
      <div className="lg:w-1/2 bg-gradient-to-br from-[#00382E] via-[#004D40] to-[#006B57] text-white p-8 lg:p-14 flex flex-col justify-between relative overflow-hidden">
        {/* Subtle Background Pattern & Circles */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-96 h-96 rounded-full bg-[#D4A72C]/10 blur-3xl pointer-events-none"></div>

        {/* Top Logo and Tagline */}
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#006B57] to-[#00382E] border-2 border-[#D4A72C] flex items-center justify-center shadow-xl">
              <span className="text-xl font-black text-white tracking-tighter">
                E<span className="text-[#D4A72C]">7</span>
              </span>
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-1.5">
                E7 <span className="text-[#D4A72C]">TRAVELS</span>
              </h1>
              <p className="text-[11px] font-semibold text-emerald-200 uppercase tracking-widest">
                Fleet & Transport Management
              </p>
            </div>
          </div>
        </div>

        {/* Center: Chennai City & Corporate Fleet Visual */}
        <div className="my-10 relative z-10">
          <div className="bg-[#002D24]/70 backdrop-blur-md border border-emerald-500/20 rounded-2xl p-6 lg:p-8 shadow-2xl relative">
            <div className="flex items-center justify-between mb-4 border-b border-emerald-500/20 pb-3">
              <div className="flex items-center gap-2">
                <Navigation className="h-5 w-5 text-[#D4A72C]" />
                <span className="text-xs font-bold text-emerald-100 uppercase tracking-wider">
                  Chennai Operations Command Hub
                </span>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                Live ERP
              </span>
            </div>

            <p className="text-sm text-emerald-100/90 leading-relaxed mb-6 font-medium">
              Enterprise Fleet Operations, Corporate Commute Logistics, Employee Transport Services, and Automated Multi-Tier Financial Settlements for Chennai’s Premier IT Parks & Industrial Corridors.
            </p>

            {/* Feature Indicators */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="flex items-center gap-2.5 bg-[#004D40]/60 border border-emerald-400/20 rounded-xl p-3">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-300">
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">Safe</p>
                  <p className="text-[10px] text-emerald-200">100% Verified Fleet</p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 bg-[#004D40]/60 border border-emerald-400/20 rounded-xl p-3">
                <div className="w-7 h-7 rounded-lg bg-[#D4A72C]/20 flex items-center justify-center text-[#D4A72C]">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">Reliable</p>
                  <p className="text-[10px] text-emerald-200">99.8% Uptime SLA</p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 bg-[#004D40]/60 border border-emerald-400/20 rounded-xl p-3">
                <div className="w-7 h-7 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-300">
                  <Building2 className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">Corporate</p>
                  <p className="text-[10px] text-emerald-200">Fortune 500 Clients</p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 bg-[#004D40]/60 border border-emerald-400/20 rounded-xl p-3">
                <div className="w-7 h-7 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-300">
                  <Clock className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">On-Time</p>
                  <p className="text-[10px] text-emerald-200">Real-Time Dispatch</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Left Footer */}
        <div className="text-xs text-emerald-200/80 flex items-center justify-between border-t border-emerald-500/20 pt-4 relative z-10">
          <span>&copy; {new Date().getFullYear()} E7 Travels Chennai</span>
          <span className="flex items-center gap-1.5 text-[11px] font-semibold text-[#D4A72C]">
            <Car className="h-3.5 w-3.5" /> Fleet & Financial ERP v3.8
          </span>
        </div>
      </div>

      {/* RIGHT SPLIT SCREEN: Corporate Login Form */}
      <div className="lg:w-1/2 flex items-center justify-center p-6 sm:p-12 lg:p-16 bg-[#F8FAFC]">
        <div className="w-full max-w-md bg-white rounded-2xl border border-[#E2E8F0] shadow-sm p-8 sm:p-10">
          {/* Header */}
          <div className="mb-6">
            <h2 className="text-2xl font-black text-[#172033] tracking-tight">
              Welcome to E7 Travels
            </h2>
            <p className="text-xs font-medium text-[#64748B] mt-1">
              Login to your account to manage corporate fleet & financial operations
            </p>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="mb-5 p-3.5 bg-rose-50 text-rose-700 text-xs border border-rose-200 rounded-xl flex items-start gap-2.5">
              <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Authentication Refused</p>
                <p className="text-[11px] text-rose-600 mt-0.5">{error}</p>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="admin-email" className="block text-[11px] font-bold text-[#64748B] uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  id="admin-email"
                  type="email"
                  required
                  placeholder="admin@e7travels.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 text-xs border border-[#E2E8F0] rounded-xl bg-white hover:bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#006B57]/30 focus:border-[#006B57] transition-all text-[#172033] font-medium"
                />
              </div>
            </div>

            <div>
              <label htmlFor="admin-password" className="block text-[11px] font-bold text-[#64748B] uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  id="admin-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-10 py-2.5 text-xs border border-[#E2E8F0] rounded-xl bg-white hover:bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#006B57]/30 focus:border-[#006B57] transition-all text-[#172033] font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 text-[#006B57] focus:ring-[#006B57] border-slate-300 rounded cursor-pointer"
                />
                <span className="ml-2 text-xs font-semibold text-[#64748B]">
                  Remember me
                </span>
              </label>

              <button
                type="button"
                onClick={() => setForgotMsg(!forgotMsg)}
                className="text-xs font-bold text-[#006B57] hover:text-[#004D40] cursor-pointer"
              >
                Forgot password?
              </button>
            </div>

            {forgotMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800">
                Please contact E7 Travels Admin Operations (support@e7travels.com) or use the demo credentials below to sign in.
              </div>
            )}

            {/* Gold Login Button */}
            <button
              id="login-btn-gold"
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3 px-4 rounded-xl shadow-xs text-xs font-bold text-[#172033] bg-[#D4A72C] hover:bg-[#C09420] active:bg-[#AA8118] transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-[#172033] border-t-transparent rounded-full animate-spin"></div>
                  <span>Signing In...</span>
                </>
              ) : (
                <>
                  <LogIn className="h-4 w-4" />
                  <span>Login</span>
                </>
              )}
            </button>
          </form>

          {/* Quick Auto-Fill Helper */}
          {showHint && (
            <div className="mt-6 p-3.5 bg-amber-50/80 border border-amber-200/80 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-amber-900">
                  <HelpCircle className="h-3.5 w-3.5 text-[#D4A72C]" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Demo Credentials</span>
                </div>
                <button
                  type="button"
                  onClick={fillDefaultCredentials}
                  className="text-[10px] font-black text-[#172033] bg-[#D4A72C] hover:bg-[#C09420] px-2.5 py-1 rounded-md transition-all flex items-center gap-1 cursor-pointer"
                >
                  <Sparkles className="h-3 w-3" /> Auto Fill
                </button>
              </div>
              <div className="text-[11px] text-amber-900/90 font-mono bg-white/80 p-2 rounded-lg border border-amber-200/60">
                <div>admin@e7travels.com / admin</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
