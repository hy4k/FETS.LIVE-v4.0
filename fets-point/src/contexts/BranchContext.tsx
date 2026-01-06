
import React, { useEffect, useState, ReactNode, useCallback } from 'react';

import { useAuth } from '../hooks/useAuth';

import { supabase } from '../lib/supabase';

import { BranchContext, BranchType, ViewMode } from './BranchContextValue';

import { canSwitchBranches } from '../utils/authUtils';

// Re-export types for convenience
export type { BranchType, ViewMode };



interface BranchProviderProps {

  children: ReactNode;

}



export function BranchProvider({ children }: BranchProviderProps) {

  const { profile, user } = useAuth();

  // Fixed: canAccessBranch initialization order

  const [activeBranch, setActiveBranchState] = useState<BranchType>(() => {
    // Try to get from local storage or default to calicut
    const saved = localStorage.getItem('fets_active_branch');
    return (saved as BranchType) || 'calicut';
  });

  const [viewMode, setViewMode] = useState<ViewMode>('single');

  const [branchStatus, setBranchStatus] = useState<{ [key: string]: any }>({});

  const [loading, setLoading] = useState(true);

  const [isSwitching, setIsSwitching] = useState(false);



  // User permissions from profile

  const userBranchAccess = profile?.branch_assigned || 'calicut';

  const userAccessLevel = profile?.role || 'staff';



  const canAccessBranch = useCallback((branch: BranchType): boolean => {
    if (!profile) return false;
    // Allow all users to access all branches
    return true;
  }, [profile]);



  const loadBranchStatus = useCallback(async () => {

    try {

      const { data, error } = await supabase

        .from('branch_status')

        .select('*')

        .order('branch_name');



      if (error) {

        console.error('❌ Error loading branch status:', error.message);

        return;

      }



      if (data) {

        const statusMap = data.reduce((acc, status) => {

          acc[status.branch_name] = status;

          return acc;

        }, {} as { [key: string]: any });



        setBranchStatus(statusMap);

      }

    } catch (error: any) {

      console.error('❌ Exception loading branch status:', error.message);

    } finally {

      setLoading(false);

    }

  }, []);



  const setActiveBranch = useCallback(async (branch: BranchType) => {

    // Only super admins can switch branches after login

    if (!canSwitchBranches(profile?.email, profile?.role)) {

      console.warn('⚠️ Branch switching is only available to super admins');

      return;

    }



    if (!canAccessBranch(branch) || branch === activeBranch) return;



    setIsSwitching(true);



    try {

      // Update the branch in the database for persistence

      if (user?.id) {

        const { error } = await supabase

          .from('staff_profiles')

          .update({ branch_assigned: branch })

          .eq('user_id', user.id);



        if (error) {

          console.error('❌ Error updating branch:', error.message);

          setIsSwitching(false);

          return;

        }

      }



      // Update state and persistence
      setActiveBranchState(branch);
      localStorage.setItem('fets_active_branch', branch);

    } finally {

      setTimeout(() => setIsSwitching(false), 300);

    }

  }, [canAccessBranch, activeBranch, viewMode, profile, user]);



  // Load initial branch from user's profile (set at login)
  useEffect(() => {
    if (profile) {
      const defaultBranch = profile.branch_assigned === 'both' ? 'calicut' : profile.branch_assigned;

      // If no manually saved branch, or current active branch is not in user's access list, set to default
      const savedBranch = localStorage.getItem('fets_active_branch');
      if (!savedBranch || (profile.branch_assigned !== 'both' && profile.branch_assigned !== 'global' && savedBranch !== profile.branch_assigned)) {
        setActiveBranchState(defaultBranch as BranchType);
        localStorage.setItem('fets_active_branch', defaultBranch);
      }

      console.log(`🏢 Synchronized branch from profile: ${activeBranch}`);
    }
  }, [profile]);



  // Load branch status data

  useEffect(() => {

    loadBranchStatus();

  }, [loadBranchStatus]);



  // Set up real-time subscriptions for branch status

  useEffect(() => {

    const subscription = supabase

      .channel('branch-status-changes')

      .on('postgres_changes',

        { event: '*', schema: 'public', table: 'branch_status' },

        () => {

          console.log('🔄 Branch status updated, reloading...');

          loadBranchStatus();

        }

      )

      .subscribe();



    return () => {

      subscription.unsubscribe();

    };

  }, [loadBranchStatus]);



  const canUseDualMode = (): boolean => {

    return userAccessLevel === 'super_admin' || userAccessLevel === 'admin';

  };



  const getBranchTheme = (branch: BranchType): string => {

    switch (branch) {

      case 'calicut':

        return 'branch-calicut';

      case 'cochin':

        return 'branch-cochin';

      case 'kannur':

        return 'branch-kannur';

      case 'global':

        return 'branch-global';

      default:

        return 'branch-calicut';

    }

  };



  const value = {

    activeBranch,

    setActiveBranch,

    viewMode,

    setViewMode,

    userBranchAccess,

    userAccessLevel,

    branchStatus,

    loading,

    isSwitching,

    canAccessBranch,

    canUseDualMode,

    getBranchTheme

  };



  return (

    <BranchContext.Provider value={value}>

      {children}

    </BranchContext.Provider>

  );

}



