import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { useToast } from './ToastContext';
import { notificationService, getBroadcastChannel } from '../services/notificationService';
import { getCachedAvatar, saveCachedAvatar, extractAvatarUrl } from '../utils/avatarStorage';

const AuthContext = createContext(null);

const STORAGE_KEY = 'hgs_admin_session';

export const AuthProvider = ({ children }) => {
  // Session and user state (instantly restore from localStorage with cached avatar to eliminate refresh wipeout)
  const [adminUser, setAdminUser] = useState(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
      if (stored) {
        const cached = getCachedAvatar(stored.id, stored.email);
        return {
          ...stored,
          avatar_url: stored.avatar_url || cached || ''
        };
      }
    } catch (_) {}
    return null;
  });
  const [session, setSession] = useState(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  const { toast } = useToast();

  // Administrative Notifications loaded from service
  const [notifications, setNotifications] = useState(() => notificationService.getNotifications());

  const markAllNotificationsRead = async () => {
    const updated = await notificationService.markAllAsRead();
    setNotifications(updated);
  };

  const markNotificationRead = async (id) => {
    const updated = await notificationService.markAsRead(id);
    setNotifications(updated);
  };

  const deleteNotification = async (id) => {
    const updated = await notificationService.deleteNotification(id);
    setNotifications(updated);
  };

  // Real-time synchronization & live toast notification subscription
  useEffect(() => {
    // 1. Initial live fetch from Supabase
    notificationService.fetchNotifications()
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setNotifications(data);
        }
      })
      .catch(() => {});

    // Common notification handler for all incoming sources
    const handleIncomingNotification = (newNotif) => {
      if (!newNotif || !newNotif.id) return;
      setNotifications(prev => {
        if (prev.some(n => n.id === newNotif.id)) return prev;
        return [newNotif, ...prev];
      });
      // Live popup notification in Admin Dashboard!
      if (toast?.info) {
        toast.info(`🔔 ${newNotif.title}: ${newNotif.detail}`);
      }
    };

    // 2. Cross-tab BroadcastChannel listener (Instant 0ms across Storefront and Admin tabs)
    const bc = getBroadcastChannel();
    const handleBroadcastMessage = (event) => {
      if (event?.data?.type === 'NEW_NOTIFICATION' && event.data.payload) {
        handleIncomingNotification(event.data.payload);
      } else if (event?.data?.type === 'NOTIFICATIONS_UPDATED' && Array.isArray(event.data.payload)) {
        setNotifications(event.data.payload);
      }
    };
    if (bc) {
      bc.addEventListener('message', handleBroadcastMessage);
    }

    // 3. Instant local event listener (for same-tab actions)
    const handleLocalNotif = (e) => {
      const newNotif = e.detail;
      if (newNotif) {
        handleIncomingNotification(newNotif);
      }
    };
    window.addEventListener('hgs:new-notification', handleLocalNotif);

    // 4. Cross-tab storage fallback listener
    const handleStorageEvent = (e) => {
      if (e.key === 'hgs_admin_notifications' && e.newValue) {
        try {
          const list = JSON.parse(e.newValue);
          if (Array.isArray(list) && list.length > 0) {
            const newest = list[0];
            handleIncomingNotification(newest);
          }
        } catch (err) {}
      }
    };
    window.addEventListener('storage', handleStorageEvent);

    // 5. Supabase Realtime listeners (for notifications and customer inquiries)
    let notifChannel = null;
    let inqChannel = null;
    if (isSupabaseConfigured() && supabase) {
      try {
        // Listen to notifications table
        notifChannel = supabase
          .channel('realtime:admin_notifications')
          .on(
            'postgres_changes',
            { event: 'INSERT', schema: 'public', table: 'notifications' },
            (payload) => {
              if (payload?.new) {
                handleIncomingNotification(payload.new);
              }
            }
          )
          .subscribe();

        // Listen directly to customer inquiries table (cross-device inquiry push)
        inqChannel = supabase
          .channel('realtime:admin_inquiries_listener')
          .on(
            'postgres_changes',
            { event: 'INSERT', schema: 'public', table: 'inquiries' },
            (payload) => {
              const inq = payload?.new;
              if (inq) {
                const syntheticNotif = {
                  id: `notif-inq-${inq.id || Date.now()}`,
                  title: 'New Collector Acquisition Inquiry',
                  detail: `${inq.inquirer_name || 'Collector'} inquired regarding ${inq.lot_title || inq.inquiry_type || 'General'}`,
                  category: 'inquiry',
                  read: false,
                  created_at: inq.created_at || new Date().toISOString()
                };
                handleIncomingNotification(syntheticNotif);
              }
            }
          )
          .subscribe();
      } catch (err) {
        console.warn('Supabase Realtime notifications subscription note:', err);
      }
    }

    // 6. Polling fallback (runs every 4s to catch any external submissions)
    const pollTimer = setInterval(() => {
      notificationService.fetchNotifications()
        .then(latestList => {
          if (Array.isArray(latestList) && latestList.length > 0) {
            setNotifications(prev => {
              const prevIds = new Set(prev.map(p => p.id));
              const freshNotifs = latestList.filter(n => !prevIds.has(n.id) && !n.read);
              if (freshNotifs.length > 0) {
                freshNotifs.forEach(n => {
                  if (toast?.info) toast.info(`🔔 ${n.title}: ${n.detail}`);
                });
              }
              return latestList;
            });
          }
        })
        .catch(() => {});
    }, 4000);

    return () => {
      if (bc) {
        bc.removeEventListener('message', handleBroadcastMessage);
      }
      window.removeEventListener('hgs:new-notification', handleLocalNotif);
      window.removeEventListener('storage', handleStorageEvent);
      clearInterval(pollTimer);
      if (notifChannel && supabase) {
        supabase.removeChannel(notifChannel);
      }
      if (inqChannel && supabase) {
        supabase.removeChannel(inqChannel);
      }
    };
  }, [toast]);

  // Cross-tab avatar synchronization listener
  useEffect(() => {
    let bc;
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        bc = new BroadcastChannel('hgs_avatar_sync');
        bc.onmessage = (event) => {
          const { type, id, email, avatar_url } = event.data || {};
          if (type === 'AVATAR_UPDATED' && avatar_url) {
            setAdminUser(prev => {
              if (!prev) return prev;
              const match = (id && prev.id === id) || (email && prev.email?.toLowerCase() === email?.toLowerCase());
              if (match) {
                const updated = { ...prev, avatar_url };
                localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
                return updated;
              }
              return prev;
            });
          } else if (type === 'AVATAR_REMOVED') {
            setAdminUser(prev => {
              if (!prev) return prev;
              const match = (id && prev.id === id) || (email && prev.email?.toLowerCase() === email?.toLowerCase());
              if (match) {
                const updated = { ...prev, avatar_url: '' };
                localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
                return updated;
              }
              return prev;
            });
          }
        };
      }
    } catch (_) {}

    return () => {
      try { bc?.close(); } catch (_) {}
    };
  }, []);

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
      const cached = getCachedAvatar(adminRecord.id || authUser.id, authUser.email);
      let sessionAvatar = '';
      try {
        sessionAvatar = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}').avatar_url || '';
      } catch (_) {}

      const avatar = extractAvatarUrl(adminRecord) || authUser.user_metadata?.avatar_url || cached || sessionAvatar || '';
      if (avatar) {
        saveCachedAvatar(adminRecord.id || authUser.id, avatar, authUser.email);
      }

      return {
        id: adminRecord.id || authUser.id,
        auth_user_id: authUser.id,
        email: authUser.email,
        name: adminRecord.name || authUser.user_metadata?.full_name || 'Staff Administrator',
        role: adminRecord.role || 'Super Admin',
        title: adminRecord.title || 'Senior Numismatist & Vault Director',
        location: adminRecord.location || 'Bigfork Storefront & Vault, MT',
        badge: adminRecord.role || 'Super Admin',
        avatar_url: avatar,
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

    const cachedCust = getCachedAvatar(customerRecord?.id || authUser.id, authUser.email);
    const custAvatar = extractAvatarUrl(customerRecord) || meta.avatar_url || cachedCust || '';
    if (custAvatar) {
      saveCachedAvatar(customerRecord?.id || authUser.id, custAvatar, authUser.email);
    }

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
      avatar_url: custAvatar,
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
        markAllNotificationsRead,
        markNotificationRead,
        deleteNotification
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
