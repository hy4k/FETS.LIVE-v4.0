// Staff filtering utilities for roster management

interface StaffProfile {
  id: string
  user_id?: string
  full_name: string
  role: string
  email: string
  department?: string
}

/**
 * Filter staff profiles for roster display
 * Removes super admins (Mithun and Niyas) from roster grid
 * @param staff - Array of staff profiles
 * @returns Filtered array excluding super admins
 */
export const filterStaffForRoster = (staff: StaffProfile[]): StaffProfile[] => {
  return staff.filter(person => {
    // Remove super admins by role and specific names
    if (person.role === 'super_admin') {
      return false
    }
    
    // Additional filter for specific super admin names
    const superAdminNames = ['Mithun']
    if (superAdminNames.some(name => 
      person.full_name.toLowerCase().includes(name.toLowerCase())
    )) {
      return false
    }
    
    return true
  })
}

/**
 * Check if a staff member is a super admin
 * @param staff - Staff profile
 * @returns True if staff is super admin
 */
export const isSuperAdminUser = (staff: StaffProfile): boolean => {
  if (staff.role === 'super_admin') return true
  
  const superAdminNames = ['Mithun']
  return superAdminNames.some(name => 
    staff.full_name.toLowerCase().includes(name.toLowerCase())
  )
}

/**
 * Get display role for UI (shows super_admin as admin)
 * @param role - Actual role from database
 * @returns Display role for UI
 */
export const getDisplayRole = (role: string): string => {
  return role === 'super_admin' ? 'admin' : role
}