import React, { useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { AuthContext } from './AuthContextValue';
import { canEditRoster as checkRosterEditPermission } from '../utils/authUtils';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Load user profile function
  const loadUserProfile = async (userId: string) => {
    try {
      console.log('🔄 Loading user profile for:', userId);
      // CRITICAL FIX: Load from staff_profiles instead of profiles
      // This ensures profile.id matches the foreign key constraints in posts, comments, etc.
      const { data: profileData, error: profileError } = await supabase
        .from('staff_profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (profileError) {
        console.error('❌ Error loading profile:', profileError.message);
        setProfile(null);
      } else {
        console.log('✅ Profile loaded:', profileData ? 'Found' : 'Not found');
        setProfile(profileData);
      }
    } catch (error: any) {
      console.error('❌ Exception loading profile:', error.message);
      setProfile(null);
    }
  };

  // Load user on mount
  useEffect(() => {
    let mounted = true;

    async function loadUser() {
      try {
        console.log('🔄 Loading initial user session...');
        const { data: { user }, error } = await supabase.auth.getUser();

        if (!mounted) return;

        if (error) {
          console.error('❌ Error loading user:', error.message);
          setUser(null);
          setProfile(null);
          return;
        }

        console.log('✅ User loaded:', user ? 'Authenticated' : 'Not authenticated');
        setUser(user);

        if (user) {
          await loadUserProfile(user.id);
        }
      } catch (error: any) {
        console.error('❌ Exception loading user:', error.message);
        if (mounted) {
          setUser(null);
          setProfile(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadUser();

    // Set up auth listener - CRITICAL: No async operations in callback
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!mounted) return;

        console.log('🔄 Auth state changed:', event);

        // Update user state immediately
        const newUser = session?.user || null;
        setUser(newUser);

        // Handle profile loading separately
        if (newUser) {
          loadUserProfile(newUser.id);
        } else {
          setProfile(null);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  async function signIn(email: string, password: string) {
    try {
      console.log('🔄 Attempting sign in for:', email);
      const result = await supabase.auth.signInWithPassword({ email, password });

      if (result.error) {
        console.error('❌ Sign in error:', result.error.message);
      } else {
        console.log('✅ Sign in successful');
      }

      return result;
    } catch (error: any) {
      console.error('❌ Sign in exception:', error.message);
      return { error };
    }
  }

  async function signOut() {
    try {
      console.log('🔄 Signing out...');

      // Clear state immediately
      setUser(null);
      setProfile(null);
      setLoading(false);

      const result = await supabase.auth.signOut();

      if (result.error) {
        console.error('❌ Sign out error:', result.error.message);
      } else {
        console.log('✅ Sign out successful');
      }

      return result;
    } catch (error: any) {
      console.error('❌ Sign out exception:', error.message);
      return { error };
    }
  }

  const hasPermission = (permission: string): boolean => {
    if (!profile) return false;

    // Super admins have all permissions by default
    if (profile.role === 'super_admin') return true;

    // These specific permissions are still restricted and must be explicitly granted
    const restrictedPermissions = ['user_management_edit'];

    if (permission === 'can_edit_roster') {
      if (checkRosterEditPermission(profile.email, profile.role)) return true;
      const permissions = typeof profile.permissions === 'object' && profile.permissions !== null
        ? (profile.permissions as Record<string, boolean>)
        : {};
      return !!(permissions['can_edit_roster'] || permissions['roster_edit']);
    }

    if (restrictedPermissions.includes(permission)) {
      const permissions = typeof profile.permissions === 'object' && profile.permissions !== null
        ? (profile.permissions as Record<string, boolean>)
        : {};
      return !!permissions[permission];
    }

    // All other features (calendar, news, checklists, etc.) are now open to everyone
    // same as super_admin, as per user request.
    return true;
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut, profile, hasPermission }}>
      {children}
    </AuthContext.Provider>
  );
}