import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

const AuthContext = createContext(null);

const STORAGE_KEY = 'hgs_admin_session';

export const AuthProvider = ({ children }) => {
  // Session and user state
  const [adminUser, setAdminUser] = useState(null);
  const [session, setSession] = useState(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  // Administrative Notifications
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      title: 'New Bank Wire Settlement Request',
      detail: 'Lot #1 (1876 George T. Morgan $100) — Col. Harrison Bradley',
      time: '12m ago',
      read: false
    },
    {
      id: 2,
      title: 'Low Stock Alert',
      detail: 'Scottsdale 10 oz Silver Stacker is currently marked Unavailable',
      time: '1h ago',
      read: false
    },
    {
      id: 3,
      title: 'New Collector Acquisition Inquiry',
      detail: 'David K. Campbell inquired regarding estate buyback appraisal',
      time: '3h ago',
      read: true
    }
  ]);

  const markAllNotificationsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  /**
   * Helper to build the user profile from Supabase Auth user + admin_users / customers table
   */
  const buildUserProfile = async (authUser) => {
    if (!authUser) return null;
    const email = (authUser.email || '').toLowerCase();
    let adminRecord = null;
    let customerRecord = null;

    if (isSupabaseConfigured() && supabase) {
      try {
        // 1. Check if user is staff/admin
        const { data: adminData } = await supabase
          .from('admin_users')
          .select('*')
          .or(`auth_user_id.eq.${authUser.id},email.ilike.${email}`)
          .limit(1);
        adminRecord = adminData?.[0];

        // 2. If not admin, check customer profile
        if (!adminRecord) {
          const { data: custData } = await supabase
            .from('customers')
            .select('*')
            .or(`auth_user_id.eq.${authUser.id},email.ilike.${email}`)
            .limit(1);
          customerRecord = custData?.[0];
        }
      } catch (err) {
        console.warn('Could not query user record from database:', err);
      }
    }

    if (adminRecord) {
      return {
        id: adminRecord.id || authUser.id,
        auth_user_id: authUser.id,
        email: authUser.email,
        name: adminRecord.name || authUser.user_metadata?.full_name || 'Staff Administrator',
        role: adminRecord.role || 'Super Admin',
        title: adminRecord.title || 'Senior Numismatist & Vault Director',
        location: adminRecord.location || 'Bigfork Storefront & Vault, MT',
        badge: adminRecord.role || 'Super Admin',
        is_admin: true,
        account_status: adminRecord.status || 'Active'
      };
    }

    // Customer / Registered Collector profile
    const meta = authUser.user_metadata || {};
    const custName = customerRecord?.full_name || meta.full_name || email.split('@')[0];
    const city = customerRecord?.city || meta.city || '';
    const state = customerRecord?.state || meta.state || '';
    const locationDisplay = city ? `${city}${state ? `, ${state}` : ''}` : '';

    return {
      id: customerRecord?.id || authUser.id,
      customer_id: customerRecord?.customer_id || null,
      auth_user_id: authUser.id,
      email: authUser.email,
      name: custName,
      role: 'Customer',
      title: 'Registered Collector',
      location: locationDisplay,
      phone: customerRecord?.phone || meta.phone || '',
      badge: 'Collector',
      interest: customerRecord?.interest || meta.interest || 'Precious Metals',
      is_admin: false,
      account_status: customerRecord?.account_status || 'Active'
    };
  };

  // Restore and maintain Supabase Auth session
  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      if (!isSupabaseConfigured() || !supabase) {
        if (isMounted) {
          setAdminUser(null);
          setSession(null);
          setIsLoadingAuth(false);
        }
        return;
      }

      try {
        const { data: { session: existingSession }, error } = await supabase.auth.getSession();
        if (error) throw error;

        if (existingSession?.user && isMounted) {
          const profile = await buildUserProfile(existingSession.user);
          if (isMounted) {
            setSession(existingSession);
            setAdminUser(profile);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
          }
        } else if (isMounted) {
          setAdminUser(null);
          setSession(null);
          localStorage.removeItem(STORAGE_KEY);
        }
      } catch (err) {
        console.warn('Error verifying Supabase auth session:', err);
        if (isMounted) {
          setAdminUser(null);
          setSession(null);
          localStorage.removeItem(STORAGE_KEY);
        }
      } finally {
        if (isMounted) {
          setIsLoadingAuth(false);
        }
      }
    };

    initializeAuth();

    // Listen to live auth changes (login, logout, token refresh)
    if (isSupabaseConfigured() && supabase) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
          if (newSession?.user && isMounted) {
            const profile = await buildUserProfile(newSession.user);
            if (isMounted) {
              setSession(newSession);
              setAdminUser(profile);
              localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
              setIsLoadingAuth(false);
            }
          }
        } else if (event === 'SIGNED_OUT') {
          if (isMounted) {
            setSession(null);
            setAdminUser(null);
            localStorage.removeItem(STORAGE_KEY);
            sessionStorage.removeItem(STORAGE_KEY);
            setIsLoadingAuth(false);
          }
        }
      });

      return () => {
        isMounted = false;
        subscription?.unsubscribe();
      };
    } else {
      return () => {
        isMounted = false;
      };
    }
  }, []);

  /**
   * Admin Login authentication handler
   * Supports both login(email, password) and login({ email, password, rememberMe })
   */
  const login = async (arg1, arg2, arg3) => {
    let email, password, rememberMe;
    if (typeof arg1 === 'object' && arg1 !== null) {
      email = arg1.email;
      password = arg1.password;
      rememberMe = arg1.rememberMe ?? true;
    } else {
      email = arg1;
      password = arg2;
      rememberMe = arg3 ?? true;
    }

    setIsLoadingAuth(true);
    try {
      const cleanEmail = (email || '').trim().toLowerCase();
      if (!cleanEmail) {
        return { success: false, error: 'Administrator email address is required.' };
      }
      if (!password) {
        return { success: false, error: 'Password is required.' };
      }

      if (!isSupabaseConfigured() || !supabase) {
        return { success: false, error: 'Supabase client is not configured.' };
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: password
      });

      if (error) {
        let errorMsg = error.message;
        if (error.message?.includes('Invalid login credentials')) {
          errorMsg = 'Invalid email or password. Please verify your administrator credentials.';
        } else if (error.message?.includes('Email not confirmed')) {
          errorMsg = 'Your admin email address has not been confirmed yet in Supabase.';
        }
        return { success: false, error: errorMsg };
      }

      if (!data?.user) {
        return { success: false, error: 'Authentication succeeded but no user session was returned.' };
      }

      const profile = await buildUserProfile(data.user);
      setSession(data.session);
      setAdminUser(profile);

      if (rememberMe) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
      } else {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
      }

      return { success: true, user: profile };
    } catch (err) {
      return { success: false, error: err.message || 'An unexpected authentication error occurred.' };
    } finally {
      setIsLoadingAuth(false);
    }
  };

  /**
   * Password Reset Flow via Supabase Auth
   */
  const requestPasswordReset = async (email) => {
    const cleanEmail = (email || '').trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      return { success: false, error: 'Please enter a valid administrator work email.' };
    }

    if (isSupabaseConfigured() && supabase) {
      try {
        const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
          redirectTo: window.location.origin + '/login'
        });
        if (error) throw error;
        return {
          success: true,
          message: `Password reset authorization link dispatched to ${cleanEmail}.`
        };
      } catch (err) {
        return {
          success: false,
          error: err.message || 'Failed to dispatch password reset request.'
        };
      }
    }

    return {
      success: false,
      error: 'Supabase client is not configured.'
    };
  };

  /**
   * Terminate current Supabase session and clear state
   */
  const logout = async () => {
    setIsLoadingAuth(true);
    try {
      if (isSupabaseConfigured() && supabase) {
        const { error } = await supabase.auth.signOut();
        if (error) console.warn('Supabase sign out error:', error.message);
      }
    } catch (err) {
      console.warn('Sign out exception:', err);
    } finally {
      setAdminUser(null);
      setSession(null);
      localStorage.removeItem(STORAGE_KEY);
      sessionStorage.removeItem(STORAGE_KEY);
      setIsLoadingAuth(false);
    }
  };

  /**
   * Dynamic customer/collector registration handler
   * Registers user with Supabase Auth and provisions customer profile in public.customers
   */
  const signup = async ({
    email,
    password,
    fullName,
    phone = '',
    city = '',
    state = '',
    interest = 'Precious Metals & Rare Coins'
  }) => {
    setIsLoadingAuth(true);
    try {
      const cleanEmail = (email || '').trim().toLowerCase();
      const cleanName = (fullName || '').trim();

      if (!cleanEmail) {
        return { success: false, error: 'Email address is required.' };
      }
      if (!password || password.length < 6) {
        return { success: false, error: 'Password must be at least 6 characters long.' };
      }
      if (!cleanName) {
        return { success: false, error: 'Full name is required.' };
      }

      if (!isSupabaseConfigured() || !supabase) {
        return { success: false, error: 'Supabase client is not configured.' };
      }

      // 1. Sign up with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: cleanEmail,
        password: password,
        options: {
          data: {
            full_name: cleanName,
            phone: phone.trim(),
            city: city.trim(),
            state: state.trim(),
            interest: interest
          }
        }
      });

      if (authError) {
        let msg = authError.message;
        if (msg.toLowerCase().includes('already registered')) {
          msg = 'An account with this email address already exists. Please sign in instead.';
        }
        return { success: false, error: msg };
      }

      const authUser = authData?.user;
      if (!authUser) {
        return { success: false, error: 'Registration failed. No user was returned.' };
      }

      // 2. Direct insertion/upsert into public.customers
      const generatedCustId = `CUST-${Math.floor(1000 + Math.random() * 9000)}`;
      const newCustRecord = {
        id: `cust-${Date.now().toString().slice(-6)}`,
        customer_id: generatedCustId,
        auth_user_id: authUser.id,
        full_name: cleanName,
        email: cleanEmail,
        phone: phone.trim(),
        city: city.trim() ? city.trim() : null,
        state: state.trim() ? state.trim() : null,
        interest: interest,
        total_spent: 0.00,
        orders_count: 0,
        account_status: 'Active',
        notes: 'Self-registered via Highlander online portal.',
        created_at: new Date().toISOString()
      };

      try {
        await supabase
          .from('customers')
          .upsert([newCustRecord], { onConflict: 'email' });
      } catch (insertErr) {
        console.warn('Customer table insert warning (will be handled by DB trigger if installed):', insertErr);
      }

      // Check if session was returned (email confirmation disabled in Supabase)
      const hasSession = Boolean(authData.session);
      let profile = null;

      if (hasSession && authUser) {
        profile = await buildUserProfile(authUser);
        setSession(authData.session);
        setAdminUser(profile);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
      }

      return {
        success: true,
        user: profile || { email: cleanEmail, name: cleanName },
        requiresEmailConfirmation: !hasSession,
        message: hasSession
          ? 'Registration successful! Welcome to Highlander Gold & Silver.'
          : 'Registration successful! Please check your inbox to confirm your email, then sign in.'
      };
    } catch (err) {
      console.error('Signup error:', err);
      return { success: false, error: err.message || 'An unexpected registration error occurred.' };
    } finally {
      setIsLoadingAuth(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        adminUser,
        session,
        setAdminUser,
        isAuthenticated: Boolean(adminUser),
        isLoadingAuth,
        login,
        signup,
        requestPasswordReset,
        logout,
        notifications,
        markAllNotificationsRead
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
