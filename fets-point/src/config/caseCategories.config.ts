import {
  Users,
  Calendar,
  Building,
  Monitor,
  Wifi,
  ClipboardCheck,
  Package,
  Wrench,
  UserCog,
  LucideIcon
} from 'lucide-react'

export interface FollowUpQuestion {
  id: string
  label: string
  type: 'text' | 'textarea' | 'select' | 'date' | 'time'
  options?: string[]
  required?: boolean
  placeholder?: string
}

export interface CategoryConfig {
  id: string
  label: string
  icon: LucideIcon
  color: string
  bgColor: string
  followUpQuestions: FollowUpQuestion[]
  showVendorFields?: boolean
}

export const CASE_CATEGORIES: CategoryConfig[] = [
  {
    id: 'roster',
    label: 'Roster',
    icon: Users,
    color: '#3b82f6',
    bgColor: '#eff6ff',
    followUpQuestions: [
      {
        id: 'affected_staff',
        label: 'Affected Staff Member(s)',
        type: 'text',
        required: true,
        placeholder: 'Enter staff name(s)'
      },
      {
        id: 'shift_date',
        label: 'Shift Date',
        type: 'date',
        required: true
      },
      {
        id: 'issue_type',
        label: 'Issue Type',
        type: 'select',
        options: ['Absence', 'Late Arrival', 'Swap Request', 'Schedule Conflict', 'Other']
      }
    ]
  },
  {
    id: 'calendar',
    label: 'Calendar',
    icon: Calendar,
    color: '#8b5cf6',
    bgColor: '#f5f3ff',
    followUpQuestions: [
      {
        id: 'event_date',
        label: 'Event Date',
        type: 'date',
        required: true
      },
      {
        id: 'event_type',
        label: 'Event Type',
        type: 'select',
        options: ['Exam Session', 'Training', 'Meeting', 'Holiday', 'Special Event', 'Other']
      },
      {
        id: 'time_slot',
        label: 'Time Slot',
        type: 'time'
      }
    ]
  },
  {
    id: 'facility',
    label: 'Facility',
    icon: Building,
    color: '#10b981',
    bgColor: '#ecfdf5',
    showVendorFields: true,
    followUpQuestions: [
      {
        id: 'location',
        label: 'Location / Room',
        type: 'text',
        required: true,
        placeholder: 'e.g., Lab 2, Reception Area'
      },
      {
        id: 'issue_type',
        label: 'Issue Type',
        type: 'select',
        options: ['Maintenance', 'Cleaning', 'Safety Hazard', 'Equipment', 'Electrical', 'Plumbing', 'Other']
      }
    ]
  },
  {
    id: 'systems',
    label: 'Systems / Computers',
    icon: Monitor,
    color: '#ef4444',
    bgColor: '#fef2f2',
    showVendorFields: true,
    followUpQuestions: [
      {
        id: 'system_name',
        label: 'System Name / ID',
        type: 'text',
        required: true,
        placeholder: 'e.g., Workstation 5, Server-01'
      },
      {
        id: 'error_type',
        label: 'Error Type',
        type: 'select',
        options: ['Hardware Failure', 'Software Issue', 'Login Problem', 'Performance', 'Blue Screen', 'Other']
      }
    ]
  },
  {
    id: 'network',
    label: 'Network',
    icon: Wifi,
    color: '#f59e0b',
    bgColor: '#fffbeb',
    followUpQuestions: [
      {
        id: 'affected_area',
        label: 'Affected Area',
        type: 'text',
        required: true,
        placeholder: 'e.g., Lab 1, Entire Building'
      },
      {
        id: 'issue_type',
        label: 'Issue Type',
        type: 'select',
        options: ['No Connectivity', 'Slow Speed', 'Intermittent', 'WiFi Issue', 'Firewall/Access', 'Other']
      }
    ]
  },
  {
    id: 'exam',
    label: 'Exam Operations',
    icon: ClipboardCheck,
    color: '#ec4899',
    bgColor: '#fdf2f8',
    followUpQuestions: [
      {
        id: 'exam_session',
        label: 'Exam Session',
        type: 'text',
        required: true,
        placeholder: 'e.g., IELTS Morning, PTE Afternoon'
      },
      {
        id: 'exam_date',
        label: 'Exam Date',
        type: 'date',
        required: true
      },
      {
        id: 'issue_type',
        label: 'Issue Type',
        type: 'select',
        options: ['Candidate Issue', 'Material Problem', 'System Failure', 'Scheduling', 'ID Verification', 'Other']
      }
    ]
  },
  {
    id: 'assets',
    label: 'Assets',
    icon: Package,
    color: '#06b6d4',
    bgColor: '#ecfeff',
    showVendorFields: true,
    followUpQuestions: [
      {
        id: 'asset_name',
        label: 'Asset Name / ID',
        type: 'text',
        required: true,
        placeholder: 'e.g., Projector-01, Chair-Lab2-05'
      },
      {
        id: 'issue_type',
        label: 'Issue Type',
        type: 'select',
        options: ['Damaged', 'Missing', 'Requires Maintenance', 'Replacement Needed', 'Warranty Claim', 'Other']
      }
    ]
  },
  {
    id: 'vendor',
    label: 'Vendor / Repair',
    icon: Wrench,
    color: '#84cc16',
    bgColor: '#f7fee7',
    showVendorFields: true,
    followUpQuestions: [
      {
        id: 'item_description',
        label: 'Item to be Repaired',
        type: 'text',
        required: true,
        placeholder: 'e.g., AC Unit, Printer HP LaserJet'
      },
      {
        id: 'repair_type',
        label: 'Repair Type',
        type: 'select',
        options: ['Hardware Repair', 'Furniture', 'Electronics', 'Appliance', 'Vehicle', 'Other']
      }
    ]
  },
  {
    id: 'staff',
    label: 'Staff / Admin',
    icon: UserCog,
    color: '#6366f1',
    bgColor: '#eef2ff',
    followUpQuestions: [
      {
        id: 'staff_name',
        label: 'Staff Member Involved',
        type: 'text',
        placeholder: 'Optional - leave blank if general'
      },
      {
        id: 'issue_type',
        label: 'Issue Type',
        type: 'select',
        options: ['Attendance', 'Performance', 'HR Matter', 'Training Request', 'Policy Query', 'Other']
      }
    ]
  }
]

export const getCategoryById = (id: string): CategoryConfig | undefined => {
  return CASE_CATEGORIES.find(cat => cat.id === id)
}

export const getCategoryIcon = (id: string): LucideIcon => {
  const category = getCategoryById(id)
  return category?.icon || ClipboardCheck
}

export const getCategoryColor = (id: string): { color: string; bgColor: string } => {
  const category = getCategoryById(id)
  return {
    color: category?.color || '#64748b',
    bgColor: category?.bgColor || '#f1f5f9'
  }
}
