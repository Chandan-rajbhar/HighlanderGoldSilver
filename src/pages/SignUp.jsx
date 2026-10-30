import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  User, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  Phone, 
  MapPin, 
  Sparkles, 
  ArrowRight, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  ShieldCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { LoadingScreen } from '../components/ui/LoadingScreen';

export const SignUp = () => {
  const navigate = useNavigate();
  const { signup, isAuthenticated, isLoadingAuth } = useAuth();
  const { toast } = useToast();

  // Form Fields State
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [interest, setInterest] = useState('Precious Metals & Rare Coins');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(true);

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [successInfo, setSuccessInfo] = useState(null);

  // If already authenticated and not waiting for email confirmation, redirect to dashboard
  useEffect(() => {
    if (!isLoadingAuth && isAuthenticated && !successInfo) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, isLoadingAuth, navigate, successInfo]);

  if (isLoadingAuth) {
    return <LoadingScreen fullScreen={true} message="Initializing secure console..." />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    // Field Validations
    if (!fullName.trim()) {
      setFormError('Please enter your full legal name.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setFormError('Please enter a valid email address.');
      return;
    }
    if (!password) {
      setFormError('Please create a password for your account.');
      return;
    }
    if (password.length < 6) {
      setFormError('Password must be at least 6 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setFormError('Passwords do not match. Please verify and try again.');
      return;
    }
    if (!acceptTerms) {
      setFormError('Please acknowledge the collector registration terms to continue.');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await signup({
        email: email.trim(),
        password: password,
        fullName: fullName.trim(),
        phone: phone.trim(),
        city: city.trim() ? city.trim() : null,
        state: state.trim() ? state.trim() : null,
        interest: interest
      });

      if (result.success) {
        if (result.requiresEmailConfirmation) {
          setSuccessInfo({
            email: email.trim(),
            message: result.message
          });
        } else {
          toast.success(result.message || 'Registration complete! Welcome to Highlander Gold & Silver.');
          navigate('/', { replace: true });
        }
      } else {
        setFormError(result.error || 'Failed to complete registration. Please try again.');
      }
    } catch (err) {
      console.error('Registration exception:', err);
      setFormError('An unexpected registration error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
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
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'linear-gradient(90deg, rgba(244,249,253,0.92) 0%, rgba(244,249,253,0.65) 45%, rgba(244,249,253,0.2) 65%, transparent 80%)'
          }}
        />
      </div>

      {/* ========================================================================= */}
      {/* 2. REGISTRATION CONTAINER: Responsive Floating Glass Card                  */}
      {/* ========================================================================= */}
      <div className="relative z-10 w-full min-h-screen flex items-center justify-start px-4 sm:px-8 md:px-12 lg:px-14 xl:px-20 2xl:px-28 min-[1920px]:px-32 py-6 sm:py-8 lg:py-10">
        <div className="w-full max-w-[460px] sm:max-w-[500px] md:max-w-[540px] lg:max-w-[580px] xl:max-w-[620px] flex flex-col items-center mx-auto lg:mx-0 transition-all duration-300">
          
          {/* Brand Logo Centered Above Card */}
          <div className="w-full flex justify-center mb-4 sm:mb-5 px-2">
            <Link to="/login" className="inline-block transition-transform hover:scale-[1.02]">
              <img
                src="/assets/brand/highlander_logo_original.png"
                alt="Highlander Gold & Silver"
                className="h-12 sm:h-14 md:h-16 lg:h-18 w-auto max-w-[220px] sm:max-w-[260px] object-contain drop-shadow-[0_2px_12px_rgba(11,45,82,0.1)]"
                onError={(e) => {
                  e.currentTarget.src = "/highlander_original_logo.png";
                }}
              />
            </Link>
          </div>

          {/* Registration Card */}
          <div className="w-full bg-white/95 backdrop-blur-xl rounded-[22px] sm:rounded-[26px] md:rounded-[28px] border border-[#1685D4]/30 shadow-[0_22px_60px_-10px_rgba(21,90,150,0.18),0_0_40px_rgba(22,133,212,0.18),0_4px_12px_rgba(11,45,82,0.05)] overflow-hidden transition-all duration-300">
            
            <div className="p-5 sm:p-7 md:p-8 xl:p-9">
              {/* SUCCESS STATE */}
              {successInfo ? (
                <div className="text-center py-4 space-y-4 animate-in fade-in duration-200">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 mx-auto shadow-sm">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>
                  <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#0B2D52]">
                    Registration Successful!
                  </h2>
                  <p className="text-xs sm:text-sm text-[#64748B] max-w-md mx-auto leading-relaxed">
                    {successInfo.message}
                  </p>
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-700">
                    Registered Email: <span className="font-bold text-[#155A96]">{successInfo.email}</span>
                  </div>
                  <div className="pt-2">
                    <Link
                      to="/login"
                      className="inline-flex items-center justify-center gap-2 w-full py-3 px-6 rounded-xl bg-gradient-to-r from-[#0B3B6D] via-[#104B84] to-[#155A96] text-white font-semibold text-xs sm:text-sm tracking-wider uppercase shadow-md hover:shadow-lg transition-all"
                    >
                      <span>Proceed to Sign In</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              ) : (
                /* REGISTRATION FORM */
                <>
                  {/* Form Error Banner */}
                  {formError && (
                    <div className="mb-4 p-3 rounded-xl bg-rose-50/90 border border-rose-200/90 flex items-start gap-2.5 text-rose-700 text-xs sm:text-sm animate-in fade-in duration-150">
                      <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
                      <span className="font-medium leading-relaxed">{formError}</span>
                    </div>
                  )}

                  {/* Heading & Subtitle */}
                  <div className="mb-4 sm:mb-5">
                    <h1 className="font-serif text-2xl sm:text-[26px] md:text-3xl font-bold text-[#0B2D52] tracking-tight leading-snug">
                      Create Your Account
                    </h1>
                    <p className="text-xs sm:text-sm text-[#64748B] mt-1">
                      Register as a Highlander Collector for exclusive bullion, numismatics &amp; dashboard access.
                    </p>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-3.5 sm:space-y-4">
                    {/* Full Name */}
                    <div>
                      <label className="block text-xs sm:text-sm font-semibold text-[#0B2D52] mb-1">
                        Full Legal Name *
                      </label>
                      <div className="group relative rounded-xl border border-[#DDE7F0] bg-white transition-all hover:border-[#B8D5ED] focus-within:!border-[#1685D4] focus-within:ring-3 focus-within:ring-[#1685D4]/15 shadow-[0_1px_2px_rgba(11,45,82,0.02)]">
                        <User className="w-4 h-4 text-[#8EA2B4] group-focus-within:text-[#155A96] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none transition-colors" />
                        <input
                          type="text"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder="e.g. William Sterling"
                          required
                          className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm text-[#0B2D52] placeholder-[#A0B3C6] bg-transparent outline-none"
                        />
                      </div>
                    </div>

                    {/* Email & Phone Row */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Email */}
                      <div>
                        <label className="block text-xs sm:text-sm font-semibold text-[#0B2D52] mb-1">
                          Email Address *
                        </label>
                        <div className="group relative rounded-xl border border-[#DDE7F0] bg-white transition-all hover:border-[#B8D5ED] focus-within:!border-[#1685D4] focus-within:ring-3 focus-within:ring-[#1685D4]/15 shadow-[0_1px_2px_rgba(11,45,82,0.02)]">
                          <Mail className="w-4 h-4 text-[#8EA2B4] group-focus-within:text-[#155A96] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none transition-colors" />
                          <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@example.com"
                            autoComplete="email"
                            required
                            className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm text-[#0B2D52] placeholder-[#A0B3C6] bg-transparent outline-none"
                          />
                        </div>
                      </div>

                      {/* Phone */}
                      <div>
                        <label className="block text-xs sm:text-sm font-semibold text-[#0B2D52] mb-1">
                          Phone Number
                        </label>
                        <div className="group relative rounded-xl border border-[#DDE7F0] bg-white transition-all hover:border-[#B8D5ED] focus-within:!border-[#1685D4] focus-within:ring-3 focus-within:ring-[#1685D4]/15 shadow-[0_1px_2px_rgba(11,45,82,0.02)]">
                          <Phone className="w-4 h-4 text-[#8EA2B4] group-focus-within:text-[#155A96] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none transition-colors" />
                          <input
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="(406) 555-0100"
                            className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm text-[#0B2D52] placeholder-[#A0B3C6] bg-transparent outline-none"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Location Row: City & State */}
                    <div className="grid grid-cols-3 gap-3">
                      <div className="col-span-2">
                        <label className="block text-xs sm:text-sm font-semibold text-[#0B2D52] mb-1">
                          City
                        </label>
                        <div className="group relative rounded-xl border border-[#DDE7F0] bg-white transition-all hover:border-[#B8D5ED] focus-within:!border-[#1685D4] focus-within:ring-3 focus-within:ring-[#1685D4]/15 shadow-[0_1px_2px_rgba(11,45,82,0.02)]">
                          <MapPin className="w-4 h-4 text-[#8EA2B4] group-focus-within:text-[#155A96] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none transition-colors" />
                          <input
                            type="text"
                            value={city}
                            onChange={(e) => setCity(e.target.value)}
                            placeholder="Bigfork"
                            className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm text-[#0B2D52] placeholder-[#A0B3C6] bg-transparent outline-none"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs sm:text-sm font-semibold text-[#0B2D52] mb-1">
                          State
                        </label>
                        <input
                          type="text"
                          value={state}
                          onChange={(e) => setState(e.target.value.toUpperCase())}
                          placeholder="MT"
                          maxLength={2}
                          className="w-full px-3 py-2.5 text-xs sm:text-sm text-[#0B2D52] placeholder-[#A0B3C6] bg-white border border-[#DDE7F0] rounded-xl outline-none focus:border-[#1685D4] focus:ring-3 focus:ring-[#1685D4]/15 font-mono text-center uppercase"
                        />
                      </div>
                    </div>

                    {/* Primary Numismatic Interest */}
                    <div>
                      <label className="block text-xs sm:text-sm font-semibold text-[#0B2D52] mb-1">
                        Primary Collector Interest
                      </label>
                      <div className="group relative rounded-xl border border-[#DDE7F0] bg-white transition-all hover:border-[#B8D5ED] focus-within:!border-[#1685D4] focus-within:ring-3 focus-within:ring-[#1685D4]/15 shadow-[0_1px_2px_rgba(11,45,82,0.02)]">
                        <Sparkles className="w-4 h-4 text-[#8EA2B4] group-focus-within:text-[#155A96] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none transition-colors" />
                        <select
                          value={interest}
                          onChange={(e) => setInterest(e.target.value)}
                          className="w-full pl-10 pr-8 py-2.5 text-xs sm:text-sm text-[#0B2D52] bg-transparent outline-none cursor-pointer"
                        >
                          <option value="Precious Metals & Rare Coins">Precious Metals &amp; Rare Coins</option>
                          <option value="Gold Bullion & Patterns">Gold Bullion &amp; Patterns</option>
                          <option value="Morgan Silver Dollars">Morgan Silver Dollars</option>
                          <option value="Historical US Commemoratives">Historical US Commemoratives</option>
                          <option value="Silver Bullion & Stackers">Silver Bullion &amp; Stackers</option>
                          <option value="Ancient Mediterranean Coinage">Ancient Mediterranean Coinage</option>
                          <option value="General Collector">General Numismatic Collector</option>
                        </select>
                      </div>
                    </div>

                    {/* Password & Confirm Password Row */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs sm:text-sm font-semibold text-[#0B2D52] mb-1">
                          Password *
                        </label>
                        <div className="group relative rounded-xl border border-[#DDE7F0] bg-white transition-all hover:border-[#B8D5ED] focus-within:!border-[#1685D4] focus-within:ring-3 focus-within:ring-[#1685D4]/15 shadow-[0_1px_2px_rgba(11,45,82,0.02)]">
                          <Lock className="w-4 h-4 text-[#8EA2B4] group-focus-within:text-[#155A96] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none transition-colors" />
                          <input
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="At least 6 characters"
                            autoComplete="new-password"
                            required
                            className="w-full pl-10 pr-9 py-2.5 text-xs sm:text-sm text-[#0B2D52] placeholder-[#A0B3C6] bg-transparent outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8EA2B4] hover:text-[#0B2D52] p-1 transition-colors cursor-pointer"
                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                          >
                            {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs sm:text-sm font-semibold text-[#0B2D52] mb-1">
                          Confirm Password *
                        </label>
                        <div className="group relative rounded-xl border border-[#DDE7F0] bg-white transition-all hover:border-[#B8D5ED] focus-within:!border-[#1685D4] focus-within:ring-3 focus-within:ring-[#1685D4]/15 shadow-[0_1px_2px_rgba(11,45,82,0.02)]">
                          <Lock className="w-4 h-4 text-[#8EA2B4] group-focus-within:text-[#155A96] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none transition-colors" />
                          <input
                            type={showConfirmPassword ? 'text' : 'password'}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Re-enter password"
                            autoComplete="new-password"
                            required
                            className="w-full pl-10 pr-9 py-2.5 text-xs sm:text-sm text-[#0B2D52] placeholder-[#A0B3C6] bg-transparent outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8EA2B4] hover:text-[#0B2D52] p-1 transition-colors cursor-pointer"
                            aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                          >
                            {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Terms Checkbox */}
                    <div className="pt-1">
                      <label className="flex items-start gap-2.5 cursor-pointer select-none text-xs text-[#64748B]">
                        <input
                          type="checkbox"
                          checked={acceptTerms}
                          onChange={(e) => setAcceptTerms(e.target.checked)}
                          className="w-4 h-4 mt-0.5 rounded border-[#C5D9EC] text-[#155A96] focus:ring-2 focus:ring-[#1685D4]/30 accent-[#155A96] cursor-pointer"
                        />
                        <span>
                          I agree to register with Highlander Gold &amp; Silver depository guidelines and terms of service.
                        </span>
                      </label>
                    </div>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full mt-2 py-3 sm:py-3.5 px-6 rounded-xl bg-gradient-to-r from-[#0B3B6D] via-[#104B84] to-[#155A96] hover:from-[#092F57] hover:to-[#124B7D] text-white font-semibold text-xs sm:text-sm tracking-wider uppercase transition-all duration-200 shadow-[0_8px_20px_-4px_rgba(21,90,150,0.35)] hover:shadow-[0_12px_28px_-4px_rgba(21,90,150,0.45)] active:scale-[0.99] flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-white" />
                          <span>CREATING ACCOUNT...</span>
                        </>
                      ) : (
                        <>
                          <span>REGISTER AS COLLECTOR</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>

                    {/* Sign In Link */}
                    <div className="pt-3 text-center border-t border-slate-100">
                      <p className="text-xs sm:text-sm text-[#64748B]">
                        Already have an account?{' '}
                        <Link
                          to="/login"
                          className="font-semibold text-[#155A96] hover:text-[#1685D4] hover:underline transition-colors"
                        >
                          Sign In
                        </Link>
                      </p>
                    </div>
                  </form>
                </>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default SignUp;
