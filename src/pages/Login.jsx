import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  ExternalLink, 
  Loader2, 
  AlertCircle, 
  CheckCircle2,
  KeyRound,
  X,
  MapPin,
  Star,
  User
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export const Login = () => {
  const navigate = useNavigate();
  const { login, requestPasswordReset, isAuthenticated } = useAuth();
  const { toast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Forgot password modal state
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const [resetMessage, setResetMessage] = useState('');
  const [resetError, setResetError] = useState('');

  // If already authenticated, redirect to dashboard
  React.useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!email.trim()) {
      setFormError('Please enter your work email.');
      return;
    }
    if (!password) {
      setFormError('Please enter your password.');
      return;
    }

    setIsSubmitting(true);
    try {
      await login({ email, password, rememberMe });
      toast.success('Signed in successfully.');
      navigate('/', { replace: true });
    } catch (err) {
      console.error('Login error:', err);
      setFormError(err.message || 'Authentication failed. Please check your credentials.');
      toast.error(err.message || 'Authentication failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePasswordResetSubmit = async (e) => {
    e.preventDefault();
    setResetError('');
    setResetMessage('');

    if (!resetEmail.trim() || !resetEmail.includes('@')) {
      setResetError('Please enter a valid email address.');
      return;
    }

    setIsResetting(true);
    try {
      const res = await requestPasswordReset(resetEmail);
      setResetMessage(res.message || 'Password reset instructions have been sent to your email.');
      toast.success('Password reset link sent!');
    } catch (err) {
      setResetError(err.message || 'Failed to send reset instructions.');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col justify-between relative overflow-hidden font-sans selection:bg-[#F5B52E]/30 selection:text-[#0F1E32]">
      {/* ========================================================================= */}
      {/* BACKGROUND: Luminous Sky-Blue to Warm Ivory Gradient Mesh                  */}
      {/* ========================================================================= */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#E2F0FD] via-[#F4F8FD] to-[#EAEFF7] -z-20" />
      
      {/* Soft Multi-Stop Radial Lighting Overlays */}
      <div 
        className="absolute inset-0 -z-10 pointer-events-none opacity-90"
        style={{
          backgroundImage: `
            radial-gradient(circle at 12% 18%, rgba(175, 222, 255, 0.55) 0%, transparent 45%),
            radial-gradient(circle at 88% 75%, rgba(254, 240, 199, 0.6) 0%, transparent 45%),
            radial-gradient(circle at 50% 40%, rgba(255, 255, 255, 0.7) 0%, transparent 60%),
            radial-gradient(circle at 18% 85%, rgba(220, 238, 254, 0.45) 0%, transparent 40%)
          `
        }}
      />

      {/* Subtle Frost Shimmer Wave at the Center */}
      <div className="absolute top-1/3 left-1/4 w-[600px] h-[600px] bg-white/40 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* ========================================================================= */}
      {/* TOP HEADER BAR                                                            */}
      {/* ========================================================================= */}
      <header className="relative z-10 w-full px-6 sm:px-10 lg:px-14 py-5 flex items-center justify-between">
        {/* Brand Logo & Title */}
        <Link to="/" className="inline-flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-[#0F1E32] border border-slate-700/40 p-2 shadow-sm flex items-center justify-center group-hover:scale-105 transition-transform">
            <img
              src="/assets/brand/highlander_crest_favicon.png"
              alt="Highlander Gold & Silver"
              className="w-full h-full object-contain filter drop-shadow"
              onError={(e) => {
                e.currentTarget.src = "/assets/brand/highlander_crest_favicon.png";
              }}
            />
          </div>
          <div className="flex flex-col">
            <span className="font-serif font-bold text-sm tracking-[0.2em] text-[#0F1E32] group-hover:text-[#F5B52E] transition-colors uppercase leading-none">
              HIGHLANDER
            </span>
            <span className="font-serif text-[#C9A23A] font-semibold text-[10px] tracking-[0.22em] uppercase leading-none mt-1">
              GOLD & SILVER
            </span>
          </div>
        </Link>

        {/* Public Storefront Pill Button */}
        <a
          href="https://highlander-gold-silver.vercel.app/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/70 hover:bg-white text-[#0F1E32] border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.04)] text-xs font-semibold tracking-wider uppercase transition-all backdrop-blur-md hover:shadow-md"
        >
          <span>Public Storefront</span>
          <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
        </a>
      </header>

      {/* ========================================================================= */}
      {/* MAIN CONTENT: 2-Column Responsive Split                                   */}
      {/* ========================================================================= */}
      <main className="relative z-10 w-full max-w-7xl mx-auto px-6 sm:px-10 lg:px-14 py-4 sm:py-8 flex-1 flex flex-col lg:flex-row items-center justify-between gap-10 lg:gap-14">
        {/* ======================================================================= */}
        {/* LEFT COLUMN: Hero Brand Narrative & Glass Info Cards                    */}
        {/* ======================================================================= */}
        <div className="w-full lg:w-1/2 flex flex-col justify-center">
          {/* Status Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/80 border border-slate-200/90 shadow-sm text-xs font-medium text-slate-700 w-fit mb-6 backdrop-blur-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="tracking-wide">ENTERPRISE VAULT PORTAL • SSL SECURED</span>
          </div>

          {/* Large Hero Title */}
          <h1 className="font-serif text-4xl sm:text-5xl lg:text-[54px] font-bold text-[#0F1E32] tracking-tight leading-[1.15]">
            Highlander Gold & Silver
            <span className="block font-serif italic text-4xl sm:text-5xl lg:text-[54px] font-normal text-[#D4AF37] mt-1">
              Admin Console
            </span>
          </h1>

          {/* Description */}
          <p className="text-slate-600 text-sm sm:text-base leading-relaxed mt-4 max-w-lg font-sans">
            Administrative portal for managing numismatic treasures, certified bullion inventory, verified orders, and real-time dealer vault operations.
          </p>

          {/* Glass Status Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8 max-w-md">
            {/* Card 1: Inventory Status */}
            <div className="bg-white/70 backdrop-blur-md rounded-2xl p-4 border border-white/90 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-md transition-shadow">
              <div className="flex items-center gap-1.5 text-[#D4AF37] text-[10px] font-bold uppercase tracking-wider mb-1.5">
                <Star className="w-3.5 h-3.5 fill-[#D4AF37]" />
                <span className="text-slate-500 font-sans">INVENTORY STATUS</span>
              </div>
              <div className="font-serif font-bold text-slate-900 text-lg">
                NGC / PCGS
              </div>
              <div className="text-slate-500 text-xs mt-0.5 font-sans">
                Tier-1 Registered Bullion
              </div>
            </div>

            {/* Card 2: Vault Node */}
            <div className="bg-white/70 backdrop-blur-md rounded-2xl p-4 border border-white/90 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-md transition-shadow">
              <div className="flex items-center gap-1.5 text-[#D4AF37] text-[10px] font-bold uppercase tracking-wider mb-1.5">
                <Lock className="w-3.5 h-3.5" />
                <span className="text-slate-500 font-sans">VAULT NODE</span>
              </div>
              <div className="font-serif font-bold text-slate-900 text-lg">
                Active
              </div>
              <div className="text-slate-500 text-xs mt-0.5 font-sans">
                Hardware 2FA Guarded
              </div>
            </div>
          </div>

          {/* Location Pin */}
          <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-8 font-sans">
            <MapPin className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" />
            <span>119 Jewel Basin Ct. B3, Bigfork, MT 59911</span>
          </div>
        </div>

        {/* ======================================================================= */}
        {/* RIGHT COLUMN: Frosted Glass Form Card                                    */}
        {/* ======================================================================= */}
        <div className="w-full lg:w-1/2 flex items-center justify-center lg:justify-end">
          <div className="w-full max-w-[440px] bg-white/85 backdrop-blur-2xl rounded-[32px] p-8 sm:p-10 border border-white/80 shadow-[0_20px_50px_rgba(15,30,50,0.08),0_1px_3px_rgba(0,0,0,0.04)] relative overflow-hidden">
            {/* Top Subtle Amber/Gold Shimmer Accent */}
            <div className="absolute top-0 left-12 right-12 h-[2px] bg-gradient-to-r from-transparent via-[#F5B52E]/70 to-transparent" />

            {/* Avatar Circle with User Icon */}
            <div className="w-14 h-14 rounded-full bg-[#FFF9ED] border border-[#FBE3B5] flex items-center justify-center mx-auto mb-4 text-[#D4AF37] shadow-sm">
              <User className="w-6 h-6 text-[#D4AF37]" />
            </div>

            {/* Title & Subtitle */}
            <h2 className="font-serif text-2xl font-bold tracking-wider text-[#0F1E32] text-center uppercase">
              ADMIN SIGN IN
            </h2>
            <p className="text-xs text-slate-500 text-center mt-1.5 mb-7">
              Enter your credentials to access the admin dashboard.
            </p>

            {/* Form Error Banner */}
            {formError && (
              <div className="mb-5 p-3 rounded-2xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-rose-700 text-xs animate-in fade-in duration-150">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
                <span>{formError}</span>
              </div>
            )}

            {/* Main Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Work Email Address */}
              <div>
                <label className="block text-[11px] font-bold text-[#0F1E32] uppercase tracking-wider mb-2">
                  EMAIL ADDRESS
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@highlandergoldsilver.com"
                    autoComplete="email"
                    required
                    className="w-full px-4 py-3 rounded-2xl bg-white border border-slate-300 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:border-[#F5B52E] focus:ring-2 focus:ring-[#F5B52E]/20 transition-all shadow-xs"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-[11px] font-bold text-[#0F1E32] uppercase tracking-wider mb-2">
                  PASSWORD
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••••••••••"
                    autoComplete="current-password"
                    required
                    className="w-full pl-4 pr-11 py-3 rounded-2xl bg-white border border-slate-300 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:border-[#F5B52E] focus:ring-2 focus:ring-[#F5B52E]/20 transition-all shadow-xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 transition-colors cursor-pointer"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between text-xs pt-0.5">
                <label className="flex items-center gap-2 cursor-pointer select-none text-slate-600 hover:text-slate-900 font-medium">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded text-[#F5B52E] border-slate-300 focus:ring-[#F5B52E] accent-[#F5B52E] cursor-pointer"
                  />
                  <span>Remember this device</span>
                </label>

                <button
                  type="button"
                  onClick={() => {
                    setResetEmail(email || '');
                    setResetError('');
                    setResetMessage('');
                    setIsForgotModalOpen(true);
                  }}
                  className="text-xs font-semibold text-[#D4AF37] hover:text-[#B58D27] hover:underline cursor-pointer"
                >
                  Forgot password?
                </button>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-2 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-[#F5B52E] via-[#F4B428] to-[#EAA61E] hover:from-[#F7C042] hover:to-[#E09C15] text-[#0F1E32] font-serif font-bold text-sm tracking-widest uppercase transition-all shadow-[0_10px_25px_-5px_rgba(245,181,46,0.45)] hover:shadow-[0_12px_28px_-5px_rgba(245,181,46,0.6)] active:scale-[0.99] flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-[#0F1E32]" />
                    <span>SIGNING IN...</span>
                  </>
                ) : (
                  <span>SIGN IN</span>
                )}
              </button>
            </form>

            {/* Secure Personnel Gateway Divider */}
            <div className="relative my-7 flex items-center justify-center">
              <div className="w-full border-t border-slate-200" />
              <span className="absolute bg-white/95 px-3 py-0.5 rounded-full border border-slate-100 text-[10px] font-mono tracking-widest uppercase text-slate-400 shadow-xs">
                SECURE PERSONNEL GATEWAY
              </span>
            </div>

            {/* Switcher to Sign Up */}
            <div className="text-center text-xs text-slate-500">
              Need an admin account?{' '}
              <Link
                to="/signup"
                className="text-[#D4AF37] hover:text-[#B58D27] font-semibold hover:underline ml-0.5 inline-flex items-center gap-1"
              >
                <span>Create Admin Account</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* ========================================================================= */}
      {/* PAGE BOTTOM FOOTER                                                        */}
      {/* ========================================================================= */}
      <footer className="relative z-10 w-full py-4 px-6 text-center text-xs text-slate-400 font-sans border-t border-slate-200/50 bg-white/20 backdrop-blur-xs">
        <p>Highlander Gold & Silver • Bigfork, MT 59911 • All Rights Reserved</p>
      </footer>

      {/* ========================================================================= */}
      {/* FORGOT PASSWORD MODAL (Frosted Glass Theme)                               */}
      {/* ========================================================================= */}
      {isForgotModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/30 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-sm bg-white/95 backdrop-blur-xl border border-white/90 rounded-[28px] p-6 shadow-2xl relative">
            <button
              onClick={() => setIsForgotModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-[#FFF9ED] border border-[#FBE3B5] flex items-center justify-center text-[#D4AF37] mb-3 shadow-xs">
              <KeyRound className="w-5 h-5" />
            </div>

            <h3 className="font-serif font-bold text-lg text-[#0F1E32]">
              Reset Password
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Enter your work email address to receive password reset instructions.
            </p>

            {resetError && (
              <div className="mt-3 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                {resetError}
              </div>
            )}

            {resetMessage ? (
              <div className="mt-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
                <span>{resetMessage}</span>
              </div>
            ) : (
              <form onSubmit={handlePasswordResetSubmit} className="mt-4 space-y-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#0F1E32] uppercase tracking-wider mb-1">
                    Work Email Address
                  </label>
                  <input
                    type="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 text-xs focus:outline-none focus:border-[#F5B52E] focus:ring-1 focus:ring-[#F5B52E]"
                    placeholder="admin@highlandergoldsilver.com"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsForgotModalOpen(false)}
                    className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-800 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isResetting}
                    className="px-4 py-2 rounded-xl bg-[#F5B52E] hover:bg-[#EAA61E] text-[#0F1E32] font-serif font-bold text-xs uppercase tracking-wider transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    {isResetting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>Send Reset Link</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
