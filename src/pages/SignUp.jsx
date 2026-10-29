import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  ExternalLink, 
  Loader2, 
  AlertCircle, 
  MapPin,
  Star,
  UserPlus
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export const SignUp = () => {
  const navigate = useNavigate();
  const { signup, isAuthenticated } = useAuth();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    invitationKey: '',
    role: 'Super Admin',
    title: 'Administrator',
    password: '',
    confirmPassword: '',
    acceptedTerms: false
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // If already authenticated, redirect to dashboard
  React.useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const validate = () => {
    if (!formData.name.trim()) {
      setFormError('Please enter your full name.');
      return false;
    }
    if (!formData.email.trim() || !formData.email.includes('@')) {
      setFormError('Please enter a valid work email address.');
      return false;
    }
    if (!formData.invitationKey.trim()) {
      setFormError('Admin invitation key is required.');
      return false;
    }
    if (formData.password.length < 8) {
      setFormError('Password must be at least 8 characters long.');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setFormError('Password confirmation does not match.');
      return false;
    }
    if (!formData.acceptedTerms) {
      setFormError('Please accept the administrative terms and policy.');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await signup({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        invitationKey: formData.invitationKey,
        role: formData.role,
        title: formData.title
      });

      toast.success('Admin account created successfully.');
      navigate('/', { replace: true });
    } catch (err) {
      console.error('Sign-up error:', err);
      setFormError(err.message || 'Registration failed. Please verify your invitation key.');
      toast.error(err.message || 'Registration failed.');
    } finally {
      setIsSubmitting(false);
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

      {/* Subtle Frost Shimmer Wave */}
      <div className="absolute top-1/3 left-1/4 w-[600px] h-[600px] bg-white/40 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* ========================================================================= */}
      {/* TOP HEADER BAR                                                            */}
      {/* ========================================================================= */}
      <header className="relative z-10 w-full px-6 sm:px-10 lg:px-14 py-5 flex items-center justify-between">
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
      {/* MAIN CONTENT                                                              */}
      {/* ========================================================================= */}
      <main className="relative z-10 w-full max-w-7xl mx-auto px-6 sm:px-10 lg:px-14 py-4 sm:py-8 flex-1 flex flex-col lg:flex-row items-center justify-between gap-10 lg:gap-14">
        {/* Left Showcase */}
        <div className="w-full lg:w-1/2 flex flex-col justify-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/80 border border-slate-200/90 shadow-sm text-xs font-medium text-slate-700 w-fit mb-6 backdrop-blur-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="tracking-wide">ENTERPRISE VAULT PORTAL • SSL SECURED</span>
          </div>

          <h1 className="font-serif text-4xl sm:text-5xl lg:text-[54px] font-bold text-[#0F1E32] tracking-tight leading-[1.15]">
            Highlander Gold & Silver
            <span className="block font-serif italic text-4xl sm:text-5xl lg:text-[54px] font-normal text-[#D4AF37] mt-1">
              Admin Onboarding
            </span>
          </h1>

          <p className="text-slate-600 text-sm sm:text-base leading-relaxed mt-4 max-w-lg font-sans">
            Provision authorized administrator credentials for catalog curation, certified inventory tracking, and client order settlements.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8 max-w-md">
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

            <div className="bg-white/70 backdrop-blur-md rounded-2xl p-4 border border-white/90 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-md transition-shadow">
              <div className="flex items-center gap-1.5 text-[#D4AF37] text-[10px] font-bold uppercase tracking-wider mb-1.5">
                <Lock className="w-3.5 h-3.5" />
                <span className="text-slate-500 font-sans">VAULT ACCESS</span>
              </div>
              <div className="font-serif font-bold text-slate-900 text-lg">
                Key Clearance
              </div>
              <div className="text-slate-500 text-xs mt-0.5 font-sans">
                Authorized Personnel Only
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-8 font-sans">
            <MapPin className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" />
            <span>119 Jewel Basin Ct. B3, Bigfork, MT 59911</span>
          </div>
        </div>

        {/* Right Frosted Form Card */}
        <div className="w-full lg:w-1/2 flex items-center justify-center lg:justify-end">
          <div className="w-full max-w-[480px] bg-white/85 backdrop-blur-2xl rounded-[32px] p-7 sm:p-9 border border-white/80 shadow-[0_20px_50px_rgba(15,30,50,0.08),0_1px_3px_rgba(0,0,0,0.04)] relative overflow-hidden">
            <div className="absolute top-0 left-12 right-12 h-[2px] bg-gradient-to-r from-transparent via-[#F5B52E]/70 to-transparent" />

            <div className="w-14 h-14 rounded-full bg-[#FFF9ED] border border-[#FBE3B5] flex items-center justify-center mx-auto mb-3 text-[#D4AF37] shadow-sm">
              <UserPlus className="w-6 h-6 text-[#D4AF37]" />
            </div>

            <h2 className="font-serif text-2xl font-bold tracking-wider text-[#0F1E32] text-center uppercase">
              ADMIN SIGN UP
            </h2>
            <p className="text-xs text-slate-500 text-center mt-1 mb-6">
              Enter your details and invitation key to register.
            </p>

            {formError && (
              <div className="mb-4 p-3 rounded-2xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-rose-700 text-xs animate-in fade-in duration-150">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3">
              {/* Row: Name & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#0F1E32] uppercase tracking-wider mb-1.5">
                    FULL NAME *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Full Legal Name"
                    required
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-white border border-slate-300 text-slate-900 placeholder-slate-400 text-xs focus:outline-none focus:border-[#F5B52E] focus:ring-2 focus:ring-[#F5B52E]/20 transition-all shadow-xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#0F1E32] uppercase tracking-wider mb-1.5">
                    WORK EMAIL *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="admin@domain.com"
                    autoComplete="email"
                    required
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-white border border-slate-300 text-slate-900 placeholder-slate-400 text-xs focus:outline-none focus:border-[#F5B52E] focus:ring-2 focus:ring-[#F5B52E]/20 transition-all shadow-xs"
                  />
                </div>
              </div>

              {/* Row: Role & Title */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#0F1E32] uppercase tracking-wider mb-1.5">
                    ASSIGNED ROLE *
                  </label>
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-white border border-slate-300 text-slate-900 text-xs focus:outline-none focus:border-[#F5B52E] focus:ring-2 focus:ring-[#F5B52E]/20 transition-all shadow-xs cursor-pointer"
                  >
                    <option value="Super Admin">Super Admin</option>
                    <option value="Inventory Manager">Inventory Manager</option>
                    <option value="Order Specialist">Order Specialist</option>
                    <option value="Staff Numismatist">Staff Numismatist</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#0F1E32] uppercase tracking-wider mb-1.5">
                    OFFICIAL TITLE
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    placeholder="e.g. Vault Director"
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-white border border-slate-300 text-slate-900 placeholder-slate-400 text-xs focus:outline-none focus:border-[#F5B52E] focus:ring-2 focus:ring-[#F5B52E]/20 transition-all shadow-xs"
                  />
                </div>
              </div>

              {/* Invitation Key */}
              <div>
                <label className="block text-[11px] font-bold text-[#0F1E32] uppercase tracking-wider mb-1.5">
                  INVITATION KEY *
                </label>
                <input
                  type="text"
                  name="invitationKey"
                  value={formData.invitationKey}
                  onChange={handleChange}
                  placeholder="Enter authorized key"
                  required
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-white border border-slate-300 text-slate-900 font-mono text-xs tracking-wider uppercase focus:outline-none focus:border-[#F5B52E] focus:ring-2 focus:ring-[#F5B52E]/20 transition-all shadow-xs"
                />
              </div>

              {/* Password & Confirm Password */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#0F1E32] uppercase tracking-wider mb-1.5">
                    PASSWORD *
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Min 8 chars"
                      required
                      className="w-full pl-3.5 pr-9 py-2.5 rounded-2xl bg-white border border-slate-300 text-slate-900 placeholder-slate-400 text-xs focus:outline-none focus:border-[#F5B52E] focus:ring-2 focus:ring-[#F5B52E]/20 transition-all shadow-xs"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#0F1E32] uppercase tracking-wider mb-1.5">
                    CONFIRM PASSWORD *
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="Repeat password"
                      required
                      className="w-full pl-3.5 pr-9 py-2.5 rounded-2xl bg-white border border-slate-300 text-slate-900 placeholder-slate-400 text-xs focus:outline-none focus:border-[#F5B52E] focus:ring-2 focus:ring-[#F5B52E]/20 transition-all shadow-xs"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                    >
                      {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Terms Checkbox */}
              <div className="pt-1">
                <label className="flex items-start gap-2.5 text-[11px] text-slate-600 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    name="acceptedTerms"
                    checked={formData.acceptedTerms}
                    onChange={handleChange}
                    className="mt-0.5 w-4 h-4 rounded text-[#F5B52E] border-slate-300 focus:ring-[#F5B52E] accent-[#F5B52E] cursor-pointer"
                  />
                  <span className="leading-snug">
                    I agree to the administrative terms of use and data handling policies.
                  </span>
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-2 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-[#F5B52E] via-[#F4B428] to-[#EAA61E] hover:from-[#F7C042] hover:to-[#E09C15] text-[#0F1E32] font-serif font-bold text-xs sm:text-sm tracking-widest uppercase transition-all shadow-[0_10px_25px_-5px_rgba(245,181,46,0.45)] hover:shadow-[0_12px_28px_-5px_rgba(245,181,46,0.6)] active:scale-[0.99] flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-[#0F1E32]" />
                    <span>REGISTERING...</span>
                  </>
                ) : (
                  <span>REGISTER ADMIN ACCOUNT</span>
                )}
              </button>
            </form>

            <div className="relative my-5 flex items-center justify-center">
              <div className="w-full border-t border-slate-200" />
              <span className="absolute bg-white/95 px-3 py-0.5 rounded-full border border-slate-100 text-[10px] font-mono tracking-widest uppercase text-slate-400 shadow-xs">
                SECURE PERSONNEL GATEWAY
              </span>
            </div>

            <div className="text-center text-xs text-slate-500">
              Already have an account?{' '}
              <Link
                to="/login"
                className="text-[#D4AF37] hover:text-[#B58D27] font-semibold hover:underline ml-0.5 inline-flex items-center gap-1"
              >
                <span>Sign In</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full py-4 px-6 text-center text-xs text-slate-400 font-sans border-t border-slate-200/50 bg-white/20 backdrop-blur-xs">
        <p>Highlander Gold & Silver • Bigfork, MT 59911 • All Rights Reserved</p>
      </footer>
    </div>
  );
};
