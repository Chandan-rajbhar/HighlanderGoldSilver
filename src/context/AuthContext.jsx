import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { adminUserService } from '../services/adminUserService';
import { localDB } from '../services/storageService';

const AuthContext = createContext(null);

const STORAGE_KEY = 'hgs_admin_session';
const VALID_INVITATION_KEYS = ['HGS-VAULT-2026', 'BIGFORK-STAFF-2026', 'ADMIN2026', 'HIGHLANDER-VIP'];

export const AuthProvider = ({ children }) => {
  // Initialize admin user from persistent session or default demo session
  const [adminUser, setAdminUser] = useState(() => {
    try {
      const localSession = localStorage.getItem(STORAGE_KEY);
      if (localSession) return JSON.parse(localSession);

      const sessionStore = sessionStorage.getItem(STORAGE_KEY);
      if (sessionStore) return JSON.parse(sessionStore);

      // Default authorized session for immediate preview / dev mode
      return {
        id: 'adm-001',
        name: 'Alexander MacLeod',
        role: 'Super Admin',
        title: 'Senior Numismatist & Vault Director',
        email: 'Stratford1955@icloud.com',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        location: 'Bigfork Storefront & Vault, MT',
        badge: 'Super Admin'
      };
    } catch (e) {
      console.warn('Error reading stored auth session:', e);
      return null;
    }
  });

  const [isLoadingAuth, setIsLoadingAuth] = useState(false);

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

  // Sync Supabase Auth listener if live Supabase is configured
  useEffect(() => {
    if (isSupabaseConfigured() && supabase) {
      const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          try {
            const admins = await adminUserService.getAdminUsers({ search: session.user.email });
            const matching = admins.find(a => a.email.toLowerCase() === session.user.email.toLowerCase());
            const userProfile = {
              id: session.user.id,
              email: session.user.email,
              name: matching?.name || session.user.user_metadata?.full_name || 'Staff Administrator',
              role: matching?.role || session.user.user_metadata?.role || 'Administrator',
              title: matching?.title || 'Vault Specialist',
              location: matching?.location || 'Bigfork Storefront & Vault, MT',
              badge: matching?.role || 'Staff'
            };
            setAdminUser(userProfile);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(userProfile));
          } catch (err) {
            console.error('Error fetching admin profile on auth change:', err);
          }
        } else if (event === 'SIGNED_OUT') {
          setAdminUser(null);
          localStorage.removeItem(STORAGE_KEY);
          sessionStorage.removeItem(STORAGE_KEY);
        }
      });

      return () => {
        authListener?.subscription?.unsubscribe();
      };
    }
  }, []);

  const markAllNotificationsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  /**
   * Admin Login authentication handler
   */
  const login = async ({ email, password, rememberMe = true }) => {
    setIsLoadingAuth(true);
    try {
      const cleanEmail = email.trim().toLowerCase();

      if (!cleanEmail) throw new Error('Work email address is required.');
      if (!password || password.length < 6) throw new Error('Password must be at least 6 characters.');

      if (isSupabaseConfigured() && supabase) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password
        });
        if (error) throw error;

        const admins = await adminUserService.getAdminUsers({ search: cleanEmail });
        const matching = admins.find(a => a.email.toLowerCase() === cleanEmail);

        const profile = {
          id: data.user.id,
          email: data.user.email,
          name: matching?.name || data.user.user_metadata?.full_name || 'Staff Administrator',
          role: matching?.role || data.user.user_metadata?.role || 'Super Admin',
          title: matching?.title || 'Senior Numismatist',
          location: matching?.location || 'Bigfork Storefront & Vault, MT',
          badge: matching?.role || 'Staff'
        };

        setAdminUser(profile);
        if (rememberMe) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
        } else {
          sessionStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
        }
        return { success: true, user: profile };
      }

      // Local / Offline storage authentication verification
      const existingAdmins = localDB.getAdminUsers();
      const matchedUser = existingAdmins.find(u => u.email.toLowerCase() === cleanEmail);

      // Verify known admin accounts or provisioned local accounts
      if (!matchedUser && cleanEmail !== 'admin@highlandergoldsilver.com' && cleanEmail !== 'stratford1955@icloud.com') {
        throw new Error('No administrator account associated with this email. Please request staff invitation.');
      }

      const profile = matchedUser ? {
        id: matchedUser.id,
        name: matchedUser.name,
        role: matchedUser.role || 'Super Admin',
        title: matchedUser.title || 'Senior Numismatist & Vault Director',
        email: matchedUser.email,
        location: matchedUser.location || 'Bigfork Storefront & Vault, MT',
        badge: matchedUser.role || 'Super Admin',
        last_login: new Date().toISOString()
      } : {
        id: 'adm-001',
        name: 'Alexander MacLeod',
        role: 'Super Admin',
        title: 'Senior Numismatist & Vault Director',
        email: cleanEmail,
        location: 'Bigfork Storefront & Vault, MT',
        badge: 'Super Admin',
        last_login: new Date().toISOString()
      };

      setAdminUser(profile);
      if (rememberMe) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
      } else {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
      }

      return { success: true, user: profile };
    } finally {
      setIsLoadingAuth(false);
    }
  };

  /**
   * Admin Sign-Up / Staff Member Provisioning
   */
  const signup = async ({ name, email, password, invitationKey, role = 'Super Admin', title = 'Staff Numismatist' }) => {
    setIsLoadingAuth(true);
    try {
      const cleanEmail = email.trim().toLowerCase();
      const cleanKey = (invitationKey || '').trim().toUpperCase();

      if (!name || name.trim().length < 2) throw new Error('Full legal/staff name is required.');
      if (!cleanEmail || !cleanEmail.includes('@')) throw new Error('Valid work email address is required.');
      if (!password || password.length < 8) throw new Error('Password must be at least 8 characters with a mix of numbers & letters.');

      // Security check: Invitation authorization token verification
      if (!VALID_INVITATION_KEYS.includes(cleanKey)) {
        throw new Error('Invalid Admin Invitation Key. Staff authorization token required from Vault Director.');
      }

      if (isSupabaseConfigured() && supabase) {
        const { data, error } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: {
            data: { full_name: name.trim(), role, title }
          }
        });
        if (error) throw error;

        // Provision administrative record in database
        await adminUserService.createAdminUser({
          id: data.user?.id,
          name: name.trim(),
          email: cleanEmail,
          role,
          title,
          status: 'Active',
          location: 'Bigfork Storefront & Vault, MT'
        });

        const profile = {
          id: data.user?.id,
          name: name.trim(),
          email: cleanEmail,
          role,
          title,
          location: 'Bigfork Storefront & Vault, MT',
          badge: role
        };

        setAdminUser(profile);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
        return { success: true, user: profile };
      }

      // Local mock DB creation
      const createdAdmin = await adminUserService.createAdminUser({
        name: name.trim(),
        email: cleanEmail,
        role,
        title,
        status: 'Active',
        location: 'Bigfork Storefront & Vault, MT'
      });

      const profile = {
        id: createdAdmin.id,
        name: createdAdmin.name,
        email: createdAdmin.email,
        role: createdAdmin.role,
        title: createdAdmin.title,
        location: 'Bigfork Storefront & Vault, MT',
        badge: createdAdmin.role
      };

      setAdminUser(profile);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
      return { success: true, user: profile };
    } finally {
      setIsLoadingAuth(false);
    }
  };

  /**
   * Password Reset Flow
   */
  const requestPasswordReset = async (email) => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) throw new Error('Please enter a valid work email.');

    if (isSupabaseConfigured() && supabase) {
      const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
        redirectTo: window.location.origin + '/login'
      });
      if (error) throw error;
    }

    return {
      success: true,
      message: `Password reset authorization link dispatched to ${cleanEmail}.`
    };
  };

  /**
   * Terminate current session
   */
  const logout = async () => {
    try {
      if (isSupabaseConfigured() && supabase) {
        await supabase.auth.signOut();
      }
    } catch (e) {
      console.warn('Signout warning:', e);
    } finally {
      setAdminUser(null);
      localStorage.removeItem(STORAGE_KEY);
      sessionStorage.removeItem(STORAGE_KEY);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        adminUser,
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
