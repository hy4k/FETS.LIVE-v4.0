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
 * Automated Roster Handler Logic
 * Only one authorized staff member can edit the roster at a time, rotating every two months.
 */
export function getActiveRosterHandlerEmail(): string {
  const now = new Date();
  const month = now.getMonth(); // 0-11 (Jan is 0)

  // Schedule:
  // Jan-Feb: jay@fets.in (Jayakanth Jayadevan)
  // Mar-Apr: nilufer@fets.in
  // May-Jun: raziya@fets.in
  // Jul-Aug: aysha@fets.in

  if (month < 2) return 'jay@fets.in';      // Jan - Feb
  if (month < 4) return 'nilufer@fets.in';  // Mar - Apr
  if (month < 6) return 'raziya@fets.in';   // May - Jun
  if (month < 8) return 'aysha@fets.in';    // Jul - Aug

  return 'mithun@fets.in'; // Default to super admin for rest of year or until specified
}

/**
 * Check if a user can edit the roster.
 * Restricted to super admins and the current active roster handler.
 */
export function canEditRoster(email: string | null | undefined, role: string | null | undefined): boolean {
  if (!email) return false;
  if (isSuperAdmin(email, role)) return true;
  return email.toLowerCase() === getActiveRosterHandlerEmail().toLowerCase();
}

/**
 * Check if a user can switch branches after login
 * @param email - User's email address
 * @param role - User's role from profile
 * @returns true if user can switch branches
 */
export function canSwitchBranches(email: string | null | undefined, role: string | null | undefined): boolean {
  return true; // Open to all users as per general permissions "All Staff: Full access"
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
  // Open to all staff as per "Full access to view, edit, and create all features"
  // But strictly excluded: Roster Editing (handled separately) and User Management
  return true;
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
