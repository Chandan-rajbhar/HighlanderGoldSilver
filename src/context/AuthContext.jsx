import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
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
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || sessionStorage.getItem(STORAGE_KEY) || 'null');
      if (stored && stored.is_admin && (stored.account_status === 'Active' || stored.status === 'Active')) {
        const cached = getCachedAvatar(stored.id, stored.email);
        return {
          ...stored,
          avatar_url: stored.avatar_url || cached || ''
        };
      }
    } catch (_) {}
    try {
      localStorage.removeItem(STORAGE_KEY);
      sessionStorage.removeItem(STORAGE_KEY);
    } catch (_) {}
    return null;
  });
  const [session, setSession] = useState(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  const { toast } = useToast();

  // Administrative Notifications loaded from service
  const [notifications, setNotifications] = useState(() => notificationService.getNotifications());

  const markAllNotificationsRead = useCallback(async () => {
    const updated = await notificationService.markAllAsRead();
    setNotifications(updated);
  }, []);

  const markNotificationRead = useCallback(async (id) => {
    const updated = await notificationService.markAsRead(id);
    setNotifications(updated);
  }, []);

  const deleteNotification = useCallback(async (id) => {
    const updated = await notificationService.deleteNotification(id);
    setNotifications(updated);
  }, []);

  // Real-time synchronization & live toast notification subscription
  useEffect(() => {
    let isMounted = true;

    const areNotificationsEqual = (prev, next) => {
      if (prev === next) return true;
      if (!Array.isArray(prev) || !Array.isArray(next) || prev.length !== next.length) return false;
      for (let i = 0; i < prev.length; i++) {
        if (prev[i].id !== next[i].id || Boolean(prev[i].read) !== Boolean(next[i].read)) {
          return false;
        }
      }
      return true;
    };

    // 1. Initial live fetch from Supabase
    notificationService.fetchNotifications()
      .then(data => {
        if (isMounted && Array.isArray(data) && data.length > 0) {
          setNotifications(prev => (areNotificationsEqual(prev, data) ? prev : data));
        }
      })
      .catch(() => {});

    // Common notification handler for all incoming sources
    const handleIncomingNotification = (newNotif) => {
      if (!isMounted || !newNotif || !newNotif.id) return;
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
        setNotifications(prev => (areNotificationsEqual(prev, event.data.payload) ? prev : event.data.payload));
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

    // 6. Lightweight polling fallback (runs every 30s; skips state update when unchanged)
    const pollTimer = setInterval(() => {
      notificationService.fetchNotifications()
        .then(latestList => {
          if (isMounted && Array.isArray(latestList) && latestList.length > 0) {
            setNotifications(prev => {
              if (areNotificationsEqual(prev, latestList)) return prev;
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
    }, 30000);

    return () => {
      isMounted = false;
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
    let adminQueryError = false;

    if (isSupabaseConfigured() && supabase) {
      try {
        // 1. Check if user is staff/admin
        const { data: adminData, error: adminErr } = await supabase
          .from('admin_users')
          .select('*')
          .or(`auth_user_id.eq.${authUser.id},email.ilike.${email}`)
          .limit(1);

        if (adminErr) {
          adminQueryError = true;
          console.warn('Admin check query error:', adminErr);
        } else {
          adminRecord = adminData?.[0];
        }

        // Ensure auth_user_id is linked to admin record if it was unlinked
        if (adminRecord && (!adminRecord.auth_user_id || adminRecord.auth_user_id !== authUser.id)) {
          try {
            await supabase
              .from('admin_users')
              .update({ auth_user_id: authUser.id })
              .eq('id', adminRecord.id);
            adminRecord.auth_user_id = authUser.id;
          } catch (_) {}
        }

        // 2. If not admin (and query succeeded), check customer profile
        if (!adminRecord && !adminQueryError) {
          const { data: custData } = await supabase
            .from('customers')
            .select('*')
            .or(`auth_user_id.eq.${authUser.id},email.ilike.${email}`)
            .limit(1);
          customerRecord = custData?.[0];
        }
      } catch (err) {
        adminQueryError = true;
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
        phone: adminRecord.phone !== undefined && adminRecord.phone !== null
          ? adminRecord.phone
          : (authUser.user_metadata?.phone ?? ''),
        city: adminRecord.city !== undefined && adminRecord.city !== null
          ? adminRecord.city
          : (authUser.user_metadata?.city ?? ''),
        state: adminRecord.state !== undefined && adminRecord.state !== null
          ? adminRecord.state
          : (authUser.user_metadata?.state ?? ''),
        role: adminRecord.role || 'Super Admin',
        title: adminRecord.title || 'Senior Numismatist & Vault Director',
        location: adminRecord.location || authUser.user_metadata?.location || 'Bigfork Storefront & Vault, MT',
        badge: adminRecord.role || 'Super Admin',
        avatar_url: avatar,
        is_admin: true,
        account_status: adminRecord.status || 'Active',
        status: adminRecord.status || 'Active'
      };
    }

    if (adminQueryError) {
      return {
        id: authUser.id,
        auth_user_id: authUser.id,
        email: authUser.email,
        is_admin: false,
        __transientError: true
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
      account_status: customerRecord?.account_status || 'Active',
      status: customerRecord?.account_status || 'Active'
    };
  };

  // Restore and maintain Supabase Auth session
  useEffect(() => {
    let isMounted = true;

    const verifyAndApplySession = async (targetSession) => {
      if (!targetSession?.user || !isMounted) return;
      const profile = await buildUserProfile(targetSession.user);
      if (!isMounted || !profile) return;

      if (profile.__transientError) {
        // Keep existing verified admin session if present during transient network blips
        setSession(targetSession);
        return;
      }

      if (profile.is_admin && (profile.account_status === 'Active' || profile.status === 'Active')) {
        setSession(targetSession);
        setAdminUser(prev => {
          if (
            prev &&
            prev.auth_user_id === profile.auth_user_id &&
            prev.role === profile.role &&
            prev.name === profile.name &&
            prev.phone === profile.phone &&
            prev.city === profile.city &&
            prev.state === profile.state &&
            prev.location === profile.location &&
            prev.account_status === profile.account_status &&
            prev.avatar_url === profile.avatar_url
          ) {
            return prev;
          }
          localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
          return profile;
        });
      } else {
        // Unauthorized user (customer or inactive admin): clear admin session
        await supabase.auth.signOut().catch(() => {});
        setSession(null);
        setAdminUser(null);
        localStorage.removeItem(STORAGE_KEY);
        sessionStorage.removeItem(STORAGE_KEY);
      }
    };

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
          await verifyAndApplySession(existingSession);
        } else if (isMounted) {
          setAdminUser(null);
          setSession(null);
          localStorage.removeItem(STORAGE_KEY);
          sessionStorage.removeItem(STORAGE_KEY);
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

    // Listen to live auth changes without awaiting Supabase inside GoTrue lock callback
    if (isSupabaseConfigured() && supabase) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
        if (!isMounted) return;

        if (event === 'SIGNED_OUT') {
          setSession(null);
          setAdminUser(null);
          localStorage.removeItem(STORAGE_KEY);
          sessionStorage.removeItem(STORAGE_KEY);
          setIsLoadingAuth(false);
          return;
        }

        if (event === 'TOKEN_REFRESHED' && newSession?.user) {
          setSession(newSession);
          // Avoid deadlocking GoTrue _acquireLock or triggering extra re-renders if user is unchanged
          setTimeout(() => {
            if (isMounted) verifyAndApplySession(newSession).catch(() => {});
          }, 0);
          return;
        }

        if ((event === 'SIGNED_IN' || event === 'USER_UPDATED') && newSession?.user) {
          // Defer async DB queries out of onAuthStateChange so GoTrue _acquireLock releases immediately
          setTimeout(() => {
            if (isMounted) {
              verifyAndApplySession(newSession)
                .catch(() => {})
                .finally(() => {
                  if (isMounted) setIsLoadingAuth(false);
                });
            }
          }, 0);
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

      if (profile?.__transientError) {
        return {
          success: false,
          error: 'Unable to verify administrator role due to a network error. Please try again.'
        };
      }

      // Strict Role-Based Access Control (RBAC):
      // Only authorized administrators from `admin_users` table can access the admin dashboard.
      if (!profile || !profile.is_admin) {
        await supabase.auth.signOut().catch(() => {});
        setSession(null);
        setAdminUser(null);
        localStorage.removeItem(STORAGE_KEY);
        sessionStorage.removeItem(STORAGE_KEY);
        return {
          success: false,
          error: 'Access denied. Administrative privileges are required to access the dashboard. Customer accounts cannot log in to the admin panel.'
        };
      }

      // Check account status
      const accountStatus = (profile.account_status || profile.status || 'Active').toLowerCase();
      if (accountStatus !== 'active') {
        await supabase.auth.signOut().catch(() => {});
        setSession(null);
        setAdminUser(null);
        localStorage.removeItem(STORAGE_KEY);
        sessionStorage.removeItem(STORAGE_KEY);
        return {
          success: false,
          error: `Administrator account is currently ${profile.account_status || 'inactive'}. Please contact system administration.`
        };
      }

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
        if (profile && profile.is_admin) {
          setSession(authData.session);
          setAdminUser(profile);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
        }
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

  const isAuthActiveAdmin = Boolean(
    adminUser &&
    adminUser.is_admin &&
    (adminUser.account_status === 'Active' || adminUser.status === 'Active')
  );

  const authContextValue = useMemo(() => ({
    adminUser,
    session,
    setAdminUser,
    isAuthenticated: isAuthActiveAdmin,
    isAdmin: isAuthActiveAdmin,
    isLoadingAuth,
    login,
    signup,
    requestPasswordReset,
    logout,
    notifications,
    markAllNotificationsRead,
    markNotificationRead,
    deleteNotification
  }), [
    adminUser,
    session,
    isAuthActiveAdmin,
    isLoadingAuth,
    notifications,
    markAllNotificationsRead,
    markNotificationRead,
    deleteNotification
  ]);

  return (
    <AuthContext.Provider value={authContextValue}>
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
