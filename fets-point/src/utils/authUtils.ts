/**
 * Authentication utility functions
 * Provides helper functions for role-based and email-based access control
 */

/**
 * Super admin email addresses
 */
const SUPER_ADMIN_EMAILS = ['mithun@fets.in', 'niyas@fets.in']

/**
 * Check if a user is a super admin based on email and role
 * @param email - User's email address
 * @param role - User's role from profile
 * @returns true if user is a super admin
 */
export function isSuperAdmin(email: string | null | undefined, role: string | null | undefined): boolean {
  if (!email || !role) return false
  return role === 'super_admin' && SUPER_ADMIN_EMAILS.includes(email.toLowerCase())
}

/**
 * Check if a user can access the Global branch
 * @param email - User's email address
 * @param role - User's role from profile
 * @returns true if user can access Global branch
 */
export function canAccessGlobalBranch(email: string | null | undefined, role: string | null | undefined): boolean {
  return isSuperAdmin(email, role)
}

/**
 * Check if a user can switch branches after login
 * Only super admins can switch branches during their session
 * @param email - User's email address
 * @param role - User's role from profile
 * @returns true if user can switch branches
 */
export function canSwitchBranches(email: string | null | undefined, role: string | null | undefined): boolean {
  return true; // Now open to all users
}

/**
 * Get available branches for a user at login
 * @param email - User's email address
 * @param role - User's role from profile
 * @returns Array of branch options
 */
export function getAvailableBranches(email: string | null | undefined, role: string | null | undefined): string[] {
  // Allow everyone to see all branches now, including global
  return ['calicut', 'cochin', 'kannur', 'global'];
}

/**
 * Check if a user has access to FETS Manager
 * @param profile - User profile
 * @returns true if user can access FETS Manager
 */
export function canAccessFetsManager(profile: any | null): boolean {
  if (!profile) return false
  return profile.role === 'super_admin'
}

/**
 * Format branch name for display
 * @param branch - Branch identifier
 * @returns Formatted branch name
 */
export function formatBranchName(branch: string): string {
  const branchNames: Record<string, string> = {
    calicut: 'Calicut',
    cochin: 'Cochin',
    kannur: 'Kannur',
    global: 'Global'
  }

  return branchNames[branch] || branch
}

/**
 * Get branch color for badges/indicators
 * @param branch - Branch identifier
 * @returns Tailwind color class
 */
export function getBranchColor(branch: string): string {
  const branchColors: Record<string, string> = {
    calicut: 'bg-blue-500',
    cochin: 'bg-green-500',
    kannur: 'bg-red-500',
    global: 'bg-purple-500'
  }

  return branchColors[branch] || 'bg-gray-500'
}
