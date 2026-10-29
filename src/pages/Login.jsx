import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  X, 
  KeyRound, 
  Loader2, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { LoadingScreen } from '../components/ui/LoadingScreen';

export const Login = () => {
  const navigate = useNavigate();
  const { login, requestPasswordReset, isAuthenticated, isLoadingAuth } = useAuth();
  const { toast } = useToast();

  // Sign In Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Forgot Password Modal State
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const [resetMessage, setResetMessage] = useState('');
  const [resetError, setResetError] = useState('');

  // If already authenticated, redirect to admin dashboard
  useEffect(() => {
    if (!isLoadingAuth && isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, isLoadingAuth, navigate]);

  if (isLoadingAuth) {
    return <LoadingScreen fullScreen={true} message="Verifying administrator session..." />;
  }

  // Sign In Submit Handler
  const handleSignInSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!email.trim()) {
      setFormError('Please enter your administrator email address.');
      return;
    }
    if (!password) {
      setFormError('Please enter your password.');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await login(email.trim(), password, rememberMe);
      if (result.success) {
        toast.success('Authenticated successfully. Welcome to Highlander Admin.');
        navigate('/', { replace: true });
      } else {
        setFormError(result.error || 'Invalid administrator credentials. Please check and try again.');
      }
    } catch (err) {
      console.error('Sign in error:', err);
      setFormError('An unexpected authentication error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Password Reset Submit Handler
  const handlePasswordResetSubmit = async (e) => {
    e.preventDefault();
    setResetError('');
    setResetMessage('');

    if (!resetEmail.trim()) {
      setResetError('Please enter your email address.');
      return;
    }

    setIsResetting(true);
    try {
      const result = await requestPasswordReset(resetEmail.trim());
      if (result.success) {
        setResetMessage('Password reset instructions have been sent to your email.');
      } else {
        setResetError(result.error || 'Failed to send reset instructions. Please verify your email.');
      }
    } catch (err) {
      console.error('Reset password error:', err);
      setResetError('An unexpected error occurred. Please try again later.');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-[#F4F9FD] flex items-center justify-center font-sans">
      {/* ========================================================================= */}
      {/* 1. CINEMATIC BACKGROUND: Pure Highlander Mountains & Precious Metals Vault */}
      {/* ========================================================================= */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-no-repeat bg-[position:80%_center] sm:bg-center"
        style={{
          backgroundImage: "url('/assets/brand/highlander_auth_cinematic_bg.jpg')",
        }}
      >
        {/* Soft, luminous ambient blend across the left side for pristine form contrast */}
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'linear-gradient(90deg, rgba(244,249,253,0.75) 0%, rgba(244,249,253,0.45) 35%, rgba(244,249,253,0.1) 55%, transparent 100%)'
          }}
        />
      </div>

      {/* ========================================================================= */}
      {/* 2. AUTHENTICATION CONTAINER: Left-Aligned Card with Permanent Blue Glow    */}
      {/* ========================================================================= */}
      <div className="relative z-10 w-full min-h-screen flex items-center justify-start px-4 sm:px-10 lg:px-16 xl:px-24 py-8">
        <div className="w-full max-w-[420px] flex flex-col items-center mx-auto lg:mx-0">
          
          {/* Exact Brand Logo: Horizontally centered directly above the card */}
          <div className="w-full flex justify-center mb-6 px-2">
            <img
              src="/assets/brand/highlander_logo_original.png"
              alt="Highlander Gold & Silver"
              className="h-16 sm:h-20 w-auto max-w-[260px] object-contain drop-shadow-[0_2px_8px_rgba(11,45,82,0.08)]"
              onError={(e) => {
                e.currentTarget.src = "/highlander_original_logo.png";
              }}
            />
          </div>
          {/* Authentication Card with Permanent Subtle Blue Glow & Thin Blue Border */}
          <div className="w-full bg-white/95 backdrop-blur-xl rounded-[22px] border border-[#1685D4]/30 shadow-[0_22px_60px_-10px_rgba(21,90,150,0.18),0_0_36px_rgba(22,133,212,0.16),0_2px_8px_rgba(11,45,82,0.04)] overflow-hidden">
            
            {/* Card Body */}
            <div className="p-7 sm:p-9">
              {/* Form Error Banner */}
              {formError && (
                <div className="mb-5 p-3 rounded-xl bg-rose-50/90 border border-rose-200/90 flex items-start gap-2.5 text-rose-700 text-xs animate-in fade-in duration-150">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
                  <span className="font-medium leading-relaxed">{formError}</span>
                </div>
              )}

              {/* Heading & Subtitle */}
              <div className="mb-6">
                <h1 className="font-serif text-[26px] sm:text-[28px] font-bold text-[#0B2D52] tracking-tight leading-snug">
                  Welcome Back
                </h1>
                <p className="text-xs sm:text-[13px] text-[#64748B] mt-1">
                  Sign in to access your admin dashboard.
                </p>
              </div>

              {/* Sign In Form */}
              <form onSubmit={handleSignInSubmit} className="space-y-4">
                {/* Email Address */}
                <div>
                  <label className="block text-[13px] font-semibold text-[#0B2D52] mb-1.5">
                    Email Address
                  </label>
                  <div 
                    className={`group relative rounded-xl border bg-white transition-all duration-200 ease-in-out ${
                      email.trim()
                        ? 'border-[#C8DEF0] shadow-[0_1px_3px_rgba(21,90,150,0.04)]'
                        : 'border-[#DDE7F0] shadow-[0_1px_2px_rgba(11,45,82,0.02)]'
                    } hover:border-[#B8D5ED] focus-within:!border-[#1685D4] focus-within:ring-3 focus-within:ring-[#1685D4]/15 focus-within:shadow-[0_0_14px_rgba(22,133,212,0.18)]`}
                  >
                    <Mail className="w-4 h-4 text-[#8EA2B4] group-focus-within:text-[#155A96] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none transition-colors duration-150" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@company.com"
                      autoComplete="email"
                      required
                      className="w-full pl-10 pr-4 py-2.5 sm:py-3 text-sm text-[#0B2D52] placeholder-[#A0B3C6] bg-transparent outline-none"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-[13px] font-semibold text-[#0B2D52] mb-1.5">
                    Password
                  </label>
                  <div 
                    className={`group relative rounded-xl border bg-white transition-all duration-200 ease-in-out ${
                      password
                        ? 'border-[#C8DEF0] shadow-[0_1px_3px_rgba(21,90,150,0.04)]'
                        : 'border-[#DDE7F0] shadow-[0_1px_2px_rgba(11,45,82,0.02)]'
                    } hover:border-[#B8D5ED] focus-within:!border-[#1685D4] focus-within:ring-3 focus-within:ring-[#1685D4]/15 focus-within:shadow-[0_0_14px_rgba(22,133,212,0.18)]`}
                  >
                    <Lock className="w-4 h-4 text-[#8EA2B4] group-focus-within:text-[#155A96] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none transition-colors duration-150" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      autoComplete="current-password"
                      required
                      className="w-full pl-10 pr-10 py-2.5 sm:py-3 text-sm text-[#0B2D52] placeholder-[#A0B3C6] bg-transparent outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#8EA2B4] hover:text-[#0B2D52] p-0.5 transition-colors cursor-pointer"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Remember Me & Forgot Password Row */}
                <div className="flex items-center justify-between text-xs sm:text-[13px] pt-1">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded border-[#C5D9EC] text-[#155A96] focus:ring-2 focus:ring-[#1685D4]/30 accent-[#155A96] cursor-pointer transition-all duration-150"
                    />
                    <span className="text-[#0B2D52] font-medium">Remember me</span>
                  </label>

                  <button
                    type="button"
                    onClick={() => {
                      setResetEmail(email || '');
                      setResetError('');
                      setResetMessage('');
                      setIsForgotModalOpen(true);
                    }}
                    className="font-medium text-[#155A96] hover:text-[#1685D4] transition-colors cursor-pointer"
                  >
                    Forgot password?
                  </button>
                </div>

                {/* Full-Width Blue Gradient Sign In Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full mt-3 py-3 sm:py-3.5 px-6 rounded-xl bg-gradient-to-r from-[#0B3B6D] via-[#104B84] to-[#155A96] hover:from-[#092F57] hover:to-[#124B7D] text-white font-semibold text-xs tracking-wider uppercase transition-all duration-200 shadow-[0_8px_20px_-4px_rgba(21,90,150,0.35)] hover:shadow-[0_12px_24px_-4px_rgba(21,90,150,0.45)] active:scale-[0.99] flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>SIGNING IN...</span>
                    </>
                  ) : (
                    <>
                      <span>SIGN IN</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. FORGOT PASSWORD MODAL (Permanent Subtle Blue Glow Theme)                */}
      {/* ========================================================================= */}
      {isForgotModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B2D52]/30 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-sm bg-white/95 backdrop-blur-xl border border-[#1685D4]/30 rounded-[22px] p-6 sm:p-7 shadow-[0_24px_60px_rgba(11,45,82,0.2),0_0_36px_rgba(22,133,212,0.16)] transition-all duration-300 relative">
            <button
              onClick={() => setIsForgotModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-[#8EA2B4] hover:text-[#0B2D52] hover:bg-[#F4F9FD] transition-colors cursor-pointer"
              aria-label="Close modal"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-11 h-11 rounded-xl bg-[#D8EBFA]/50 border border-[#D8EBFA] flex items-center justify-center text-[#155A96] mb-3.5 shadow-xs">
              <KeyRound className="w-5 h-5" />
            </div>

            <h3 className="font-serif font-bold text-xl text-[#0B2D52]">
              Reset Password
            </h3>
            <p className="text-xs text-[#64748B] mt-1">
              Enter your work email address to receive password reset instructions.
            </p>

            {resetError && (
              <div className="mt-3 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                {resetError}
              </div>
            )}

            {resetMessage ? (
              <div className="mt-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
                <span className="font-medium leading-relaxed">{resetMessage}</span>
              </div>
            ) : (
              <form onSubmit={handlePasswordResetSubmit} className="mt-4 space-y-3.5">
                <div>
                  <label className="block text-[12px] font-semibold text-[#0B2D52] mb-1.5">
                    Email Address
                  </label>
                  <div 
                    className={`group relative rounded-xl border bg-white transition-all duration-200 ease-in-out ${
                      resetEmail.trim()
                        ? 'border-[#C8DEF0] shadow-[0_1px_3px_rgba(21,90,150,0.04)]'
                        : 'border-[#DDE7F0] shadow-[0_1px_2px_rgba(11,45,82,0.02)]'
                    } hover:border-[#B8D5ED] focus-within:!border-[#1685D4] focus-within:ring-3 focus-within:ring-[#1685D4]/15 focus-within:shadow-[0_0_14px_rgba(22,133,212,0.18)]`}
                  >
                    <Mail className="w-4 h-4 text-[#8EA2B4] group-focus-within:text-[#155A96] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none transition-colors duration-150" />
                    <input
                      type="email"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      required
                      placeholder="you@company.com"
                      className="w-full pl-10 pr-3.5 py-2.5 text-xs text-[#0B2D52] placeholder-[#A0B3C6] bg-transparent outline-none"
                    />
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setIsForgotModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-[#64748B] hover:text-[#0B2D52] transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isResetting}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#0B3B6D] to-[#155A96] hover:from-[#092F57] hover:to-[#124B7D] text-white font-semibold text-xs tracking-wider uppercase transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                  >
                    {isResetting && <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />}
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

export default Login;
