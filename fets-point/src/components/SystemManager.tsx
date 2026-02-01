import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Server, Monitor, Shield, Plus, X,
    Activity, AlertTriangle,
    Search, RefreshCw,
    CheckCircle2, Settings, Network,
    Terminal,
    Edit2, Trash2, ChevronDown, ChevronUp,
    List, ArrowRightLeft,
    Check, Printer, Headphones, Keyboard, MousePointer2, CalendarRange, Clock, Package,
    Smartphone, Camera, Mic, HardDrive, Cpu, Layout, ListTodo, PlusCircle, Maximize2, Minimize2
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { useBranch } from '../hooks/useBranch'
import { toast } from 'react-hot-toast'
import { format } from 'date-fns'

/*
  COLOR PALETTE (Dynamic based on Branch):
  Calicut: Teal/Mint/Coral
  Cochin: Blue/Sky/Violet
  Kannur: Emerald/Lime/Amber
*/

const branchThemes: Record<string, any> = {
    calicut: {
        primary: '#61C0BF',
        secondary: '#BBDED6',
        accent: '#FFB6B9',
        bg: '#FAE3D9',
        dark: '#2D5A59'
    },
    cochin: {
        primary: '#3B82F6',
        secondary: '#BFDBFE',
        accent: '#8B5CF6',
        bg: '#F0F9FF',
        dark: '#1e3a8a'
    },
    kannur: {
        primary: '#10B981',
        secondary: '#A7F3D0',
        accent: '#F59E0B',
        bg: '#FFFBEB',
        dark: '#064e3b'
    },
    default: {
        primary: '#61C0BF',
        secondary: '#BBDED6',
        accent: '#FFB6B9',
        bg: '#FAE3D9',
        dark: '#2D5A59'
    }
}

// --- Interfaces ---

interface Software {
    id?: string
    name: string
    install_date: string
    client: string
}

interface System {
    id: string
    branch_location: string
    system_type: 'admin' | 'server' | 'workstation' | 'peripheral' | 'rented'
    category_name: string
    name: string
    ip_address: string
    status: 'operational' | 'maintenance' | 'fault'
    specs: {
        cpu: string
        ram: string
        os: string
        serial_number: string
    }
    last_os_update?: string
    installed_software: Software[]
    supported_clients: string[]
    last_checked: string
    created_at?: string
    it_item_type?: string
    is_rented?: boolean
    rent_start_date?: string
    rent_end_date?: string
}

interface SystemLog {
    id: string
    system_id: string
    log_type: string
    description: string
    user_id: string
    created_at: string
}

// --- Sub-Components ---

const SystemIcon = ({ type, itemType, color = '#2D3748' }: { type: string, itemType?: string, color?: string }) => {
    if (type === 'peripheral') {
        switch (itemType?.toLowerCase()) {
            case 'printer': return <Printer style={{ color: color }} size={24} />
            case 'webcam': return <Monitor style={{ color: color }} size={24} />
            case 'headphones': return <Headphones style={{ color: color }} size={24} />
            case 'e sign pad': return <Keyboard style={{ color: color }} size={24} />
            default: return <Package style={{ color: color }} size={24} />
        }
    }
    if (type === 'rented') return <Clock style={{ color: color }} size={24} />
    switch (type) {
        case 'server': return <Server style={{ color: color }} size={24} strokeWidth={2.5} />
        case 'admin': return <Shield style={{ color }} size={24} strokeWidth={2.5} />
        default: return <Monitor style={{ color: color }} size={24} strokeWidth={2.5} />
    }
}

const StatusBadge = ({ status, theme }: { status: string, theme: any }) => {
    const configs = {
        operational: {
            style: { color: theme.dark, backgroundColor: `${theme.primary}40`, borderColor: `${theme.primary}40` },
            dotStyle: { backgroundColor: theme.primary },
            icon: CheckCircle2
        },
        maintenance: {
            style: { color: '#7D5A50', backgroundColor: `${theme.bg}`, borderColor: `${theme.accent}40` },
            dotStyle: { backgroundColor: theme.accent },
            icon: Settings
        },
        fault: {
            style: { color: '#874345', backgroundColor: `${theme.accent}20`, borderColor: `${theme.accent}40` },
            dotStyle: { backgroundColor: theme.accent },
            icon: AlertTriangle
        }
    }
    const config = configs[status as keyof typeof configs] || configs.operational
    return (
        <div style={config.style} className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border backdrop-blur-sm shadow-sm transition-all duration-300`}>
            <div style={config.dotStyle} className={`w-1.5 h-1.5 rounded-full ${status === 'fault' ? 'animate-pulse' : ''}`} />
            <span className="text-[10px] font-black uppercase tracking-widest">{status}</span>
        </div>
    )
}

const GlassCard = ({ children, className = '', glow = false, style }: { children: React.ReactNode, className?: string, glow?: boolean, style?: React.CSSProperties }) => (
    <div className={`relative group ${className}`} style={style}>
        {glow && (
            <div className="absolute -inset-1 bg-gradient-to-r from-[#61C0BF]/20 to-[#BBDED6]/20 rounded-[2.5rem] blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200" />
        )}
        <div className="relative bg-white/40 backdrop-blur-xl border border-white/40 rounded-[2.5rem] shadow-xl overflow-hidden">
            {children}
        </div>
    </div>
)

const GlassInset = ({ children, className = '' }: { children: React.ReactNode, className?: string }) => (
    <div className={`bg-white/20 backdrop-blur-md border border-white/20 rounded-2xl shadow-inner ${className}`}>
        {children}
    </div>
)

interface SystemGridCardProps {
    sys: System;
    activeBranch: string;
    expandedCards: Record<string, boolean>;
    toggleCard: (id: string) => void;
    copyToClipboard: (text: string) => void;
    handleEditSystemOpen: (sys: System) => void;
    setShowManageModal: (sys: System | null) => void;
    setShowTransferModal: (sys: System | null) => void;
    setTargetBranch: (branch: string) => void;
    handleDeleteSystem: (id: string, name: string) => void;
    variant?: 'server' | 'admin' | 'workstation' | 'default';
}

const SystemGridCard: React.FC<SystemGridCardProps> = ({
    sys,
    activeBranch,
    expandedCards,
    toggleCard,
    copyToClipboard,
    handleEditSystemOpen,
    setShowManageModal,
    setShowTransferModal,
    setTargetBranch,
    handleDeleteSystem,
    variant = 'default'
}) => {
    const isTransferredOut = sys.branch_location !== activeBranch;
    const isExpanded = expandedCards[sys.id];
    const isRental = sys.system_type === 'rented';
    const isPeripheral = sys.system_type === 'peripheral';

    const theme = branchThemes[activeBranch.toLowerCase()] || branchThemes['default'];

    // Visual Hierarchy Config
    const scaleClasses = {
        server: 'md:scale-110 z-20',
        admin: 'md:scale-100 z-10',
        workstation: 'md:scale-90 z-0',
        default: 'scale-100'
    }
    const sizeClasses = {
        server: 'w-[280px] min-h-[160px]',
        admin: 'w-[240px] min-h-[140px]',
        workstation: 'w-full min-h-[120px]',
        default: 'w-full min-h-[140px]'
    }

    const cardStyle = isExpanded
        ? { backgroundColor: '#fff', borderColor: theme.primary, boxShadow: `0 0 0 8px ${theme.primary}10` }
        : isTransferredOut
            ? {} // handled by className for simplicity or could be inline
            : isRental
                ? { backgroundColor: theme.bg, borderColor: theme.accent }
                : isPeripheral
                    ? { backgroundColor: '#fff', borderColor: theme.secondary }
                    : { backgroundColor: variant === 'server' ? '#fff' : theme.bg, borderColor: variant === 'server' ? theme.primary : '#fff' };

    return (
        <div key={sys.id} className={`relative transition-all duration-500 h-full ${variant !== 'default' ? scaleClasses[variant] : ''} ${isExpanded ? 'z-[100]' : ''}`}>
            <motion.div
                whileHover={isTransferredOut ? { scale: 1.02 } : { y: -5, scale: variant === 'server' ? 1.05 : 1.02 }}
                style={!isTransferredOut ? cardStyle : undefined}
                className={`p-6 rounded-[2rem] border-4 cursor-pointer shadow-xl flex flex-col items-center text-center gap-3 transition-all h-full ${sizeClasses[variant]} ${isTransferredOut
                    ? 'bg-slate-100/40 border-slate-200 grayscale opacity-40 hover:opacity-80'
                    : 'hover:shadow-2xl'
                    }`}
                onClick={() => toggleCard(sys.id)}
            >
                <div style={!isTransferredOut && sys.status === 'operational' ? { backgroundColor: theme.primary } : { backgroundColor: theme.accent }} className={`w-3.5 h-3.5 rounded-full shadow-lg transition-colors duration-500`} />
                <div className="flex flex-col overflow-hidden w-full">
                    <span className={`font-black text-black uppercase tracking-wider truncate px-1 transition-all ${variant === 'server' ? 'text-sm' : 'text-xs'}`}>
                        {isPeripheral ? (sys.it_item_type || sys.name) : sys.name}
                    </span>
                    <span className="text-[8px] font-black text-slate-900 uppercase tracking-tighter opacity-60">
                        {isTransferredOut
                            ? `AT ${sys.branch_location.toUpperCase()}`
                            : isPeripheral
                                ? 'IT EQUIPMENT'
                                : (sys.ip_address || 'ONLINE')
                        }
                    </span>
                </div>
                {isTransferredOut && (
                    <div className="mt-1 px-2 py-0.5 bg-slate-200 rounded-full text-[7px] font-black text-slate-900 uppercase">TRANSFERRED</div>
                )}
                {isRental && (
                    <div className="mt-1 px-2 py-0.5 bg-[#FFB6B9] rounded-full text-[7px] font-black text-black uppercase">RENTAL</div>
                )}
            </motion.div>

            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.9, x: '-50%' }}
                        animate={{ opacity: 1, y: 20, scale: 1, x: '-50%' }}
                        exit={{ opacity: 0, y: 10, scale: 0.9, x: '-50%' }}
                        style={{ borderColor: `${theme.primary}20` }}
                        className="absolute top-full left-1/2 z-[50] w-[340px] bg-white rounded-[2.5rem] p-8 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.2)] border-2 backdrop-blur-xl"
                    >
                        <div className="flex flex-col gap-6">
                            <div style={{ borderColor: theme.bg }} className="flex justify-between items-center pb-5 border-b-2">
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-black text-black uppercase tracking-widest leading-tight">
                                        {isTransferredOut
                                            ? `LOCATED AT ${sys.branch_location.toUpperCase()}`
                                            : (isPeripheral ? (sys.it_item_type || 'IT ITEM') : sys.ip_address || 'OPERATIONAL SYSTEM')
                                        }
                                    </span>
                                    <span className="text-[8px] font-bold text-slate-900 uppercase mt-0.5">
                                        {isTransferredOut ? 'REMOTE LINK ACTIVE' : `Sync: ${format(new Date(sys.last_checked || Date.now()), 'HH:mm | dd MMM')}`}
                                    </span>
                                </div>
                                <StatusBadge status={sys.status} theme={theme} />
                            </div>

                            {isRental && (
                                <div className="flex items-center gap-3 p-4 bg-[#FFB6B9]/10 border-2 border-[#FFB6B9]/20 rounded-2xl">
                                    <CalendarRange size={20} className="text-[#FFB6B9]" />
                                    <div className="flex flex-col">
                                        <span className="text-[8px] font-black text-black uppercase">Active Rental Period</span>
                                        <span className="text-[10px] font-bold text-black">
                                            {sys.rent_start_date ? format(new Date(sys.rent_start_date), 'dd MMM yy') : 'Start'} - {sys.rent_end_date ? format(new Date(sys.rent_end_date), 'dd MMM yy') : 'End'}
                                        </span>
                                    </div>
                                </div>
                            )}

                            {isPeripheral ? (
                                <div className="p-4 bg-white rounded-3xl border-2 border-[#BBDED6] shadow-md flex justify-between items-center">
                                    <div className="flex flex-col">
                                        <span className="block text-[8px] font-black text-black uppercase mb-1">Equipment Category</span>
                                        <span className="text-[10px] font-bold text-black uppercase">{sys.it_item_type || 'IT ITEM'}</span>
                                    </div>
                                    <div style={{ backgroundColor: `${theme.secondary}20` }} className="p-2 rounded-xl">
                                        <SystemIcon type="peripheral" itemType={sys.it_item_type} color={theme.dark} />
                                    </div>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 gap-3">
                                    <div style={{ backgroundColor: `${theme.bg}40` }} className="p-3 rounded-2xl border border-white">
                                        <span className="block text-[8px] font-black text-black uppercase mb-1">Processor</span>
                                        <span className="text-[10px] font-bold text-black truncate block">{sys.specs.cpu || 'N/A'}</span>
                                    </div>
                                    <div style={{ backgroundColor: `${theme.bg}40` }} className="p-3 rounded-2xl border border-white">
                                        <span className="block text-[8px] font-black text-black uppercase mb-1">Memory</span>
                                        <span className="text-[10px] font-bold text-black">{sys.specs.ram || 'N/A'}</span>
                                    </div>
                                    <div style={{ backgroundColor: `${theme.bg}40` }} className="p-3 rounded-2xl border border-white">
                                        <span className="block text-[8px] font-black text-black uppercase mb-1">OS Environment</span>
                                        <span className="text-[10px] font-bold text-black truncate block">{sys.specs.os || 'Windows 11'}</span>
                                    </div>
                                    <div style={{ backgroundColor: `${theme.bg}40` }} className="p-3 rounded-2xl border border-white">
                                        <span className="block text-[8px] font-black text-black uppercase mb-1">Last Update</span>
                                        <span className="text-[10px] font-bold text-black">{sys.last_os_update ? format(new Date(sys.last_os_update), 'dd MMM yy') : 'STABLE'}</span>
                                    </div>
                                </div>
                            )}

                            <div style={{ backgroundColor: `${theme.bg}40` }} className="p-3 rounded-2xl border border-white">
                                <span className="block text-[8px] font-black text-black uppercase mb-1">System Serial</span>
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-mono text-black font-bold tracking-wider">{sys.specs.serial_number || 'NO_SERIAL_LOGGED'}</span>
                                    <button onClick={(e) => { e.stopPropagation(); copyToClipboard(sys.specs.serial_number) }} style={{ color: theme.primary }} className="hover:scale-125 transition-transform"><List size={12} /></button>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <div style={{ backgroundColor: theme.primary }} className="h-1.5 w-1.5 rounded-full" />
                                    <span className="text-[9px] font-black text-black uppercase tracking-widest">Support Links</span>
                                </div>
                                <div className="flex flex-wrap gap-1.5">
                                    {(sys.supported_clients || []).length > 0 ? (
                                        sys.supported_clients.map((c: string) => (
                                            <span key={c} style={{ backgroundColor: `${theme.secondary}20`, borderColor: theme.secondary }} className="px-2 py-1 border rounded-lg text-[8px] font-black text-black uppercase tracking-tighter">{c}</span>
                                        ))
                                    ) : (
                                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">No Clients Connected</span>
                                    )}
                                </div>
                            </div>

                            <div style={{ borderColor: theme.bg }} className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t">
                                <button onClick={(e) => { e.stopPropagation(); handleEditSystemOpen(sys); }} style={{ backgroundColor: theme.bg }} className="p-3 text-black rounded-xl hover:text-white transition-all flex items-center justify-center gap-2 group/btn border border-white/50 shadow-sm hover:scale-105" onMouseEnter={(e) => e.currentTarget.style.backgroundColor = theme.primary} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = theme.bg}>
                                    <Edit2 size={14} strokeWidth={3} className="group-hover/btn:rotate-12 transition-transform" />
                                    <span className="text-[9px] font-black uppercase">Edit</span>
                                </button>
                                <button onClick={(e) => { e.stopPropagation(); setShowManageModal(sys); }} style={{ backgroundColor: theme.bg }} className="p-3 text-black rounded-xl hover:text-white transition-all flex items-center justify-center gap-2 group/btn border border-white/50 shadow-sm hover:scale-105" onMouseEnter={(e) => e.currentTarget.style.backgroundColor = theme.primary} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = theme.bg}>
                                    <Settings size={14} strokeWidth={3} className="group-hover/btn:rotate-90 transition-transform duration-500" />
                                    <span className="text-[9px] font-black uppercase">Manage</span>
                                </button>
                                <button onClick={(e) => { e.stopPropagation(); setShowTransferModal(sys); setTargetBranch(sys.branch_location); }} style={{ backgroundColor: theme.secondary }} className="p-3 text-black rounded-xl hover:text-white transition-all flex items-center justify-center gap-2 col-span-2 shadow-sm border border-white/50 hover:scale-105" onMouseEnter={(e) => e.currentTarget.style.backgroundColor = theme.primary} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = theme.secondary}>
                                    <ArrowRightLeft size={14} strokeWidth={3} />
                                    <span className="text-[9px] font-black uppercase">Transfer Branch</span>
                                </button>
                            </div>
                            <button onClick={() => handleDeleteSystem(sys.id, sys.name)} className="w-full py-2 hover:bg-[#FFB6B9]/10 text-red-600 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all">
                                Delete System From Registry
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div >
    );
}

// --- Main Page Component ---

const SystemManager = () => {
    const { profile } = useAuth()
    const { activeBranch } = useBranch()
    const theme = branchThemes[activeBranch.toLowerCase()] || branchThemes['default'];

    const [systems, setSystems] = useState<System[]>([])
    const [clients, setClients] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [showAddModal, setShowAddModal] = useState(false)
    const [showManageModal, setShowManageModal] = useState<System | null>(null)
    const [showTransferModal, setShowTransferModal] = useState<System | null>(null)
    const [targetBranch, setTargetBranch] = useState<string>('')
    const [activeCategory, setActiveCategory] = useState('Systems')
    const [categories, setCategories] = useState<{ name: string, icon: string }[]>([])
    const [isFlowchartMode, setIsFlowchartMode] = useState(true)

    // System States
    const [newSystem, setNewSystem] = useState({
        id: undefined,
        name: '',
        type: 'workstation' as 'workstation' | 'server' | 'admin' | 'peripheral' | 'rented',
        ip: '',
        specs: { cpu: '', ram: '', os: 'Windows 11', serial_number: '' },
        last_os_update: null as string | null,
        installed_software: [] as Software[],
        supported_clients: [] as string[],
        it_item_type: '',
        rent_start_date: '',
        rent_end_date: '',
        category_name: ''
    })

    const [selectedClientForSW, setSelectedClientForSW] = useState<string>('')
    const [softEntry, setSoftEntry] = useState<Software>({ name: '', install_date: '', client: '' })
    const [incidentDescription, setIncidentDescription] = useState('')
    const [systemLogs, setSystemLogs] = useState<SystemLog[]>([])
    const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({})

    const isAdmin = true // profile?.role === 'admin' || profile?.role === 'super_admin'
    const branches = ['calicut', 'cochin', 'kannur'];

    const getBranchPrefix = (branch: string) => {
        switch (branch.toLowerCase()) {
            case 'cochin': return 'FCN-WS-';
            case 'calicut': return 'FCL-WS-';
            case 'kannur': return 'FKN-WS-';
            default: return 'SYS-WS-';
        }
    }

    const getTypePrefix = (branch: string, type: string) => {
        const base = getBranchBasePrefix(branch);
        switch (type) {
            case 'server': return `${base}SRV-`;
            case 'admin': return `${base}ADM-`;
            default: return `${base}WS-`;
        }
    }

    const getBranchBasePrefix = (branch: string) => {
        switch (branch.toLowerCase()) {
            case 'cochin': return 'FCN-';
            case 'calicut': return 'FCL-';
            case 'kannur': return 'FKN-';
            default: return 'SYS-';
        }
    }

    useEffect(() => {
        fetchSystems()
        fetchClients()
        fetchCategories()
    }, [activeBranch])

    const fetchCategories = async () => {
        const { data } = await supabase.from('system_categories').select('name, icon').order('is_default', { ascending: false })
        if (data && data.length > 0) {
            setCategories(data)
        } else {
            setCategories([
                { name: 'Systems', icon: 'monitor' },
                { name: 'Printer', icon: 'printer' },
                { name: 'DVR', icon: 'activity' },
                { name: 'Testing Equipments', icon: 'activity' }
            ])
        }
    }

    const handleAddCategory = async () => {
        const name = prompt('Enter new category name:')
        if (!name) return
        const { error } = await supabase.from('system_categories').insert([{ name, icon: 'package' }])
        if (error) {
            toast.error(`Failed to add category: ${error.message}`)
        } else {
            toast.success('Category added')
            fetchCategories()
        }
    }

    useEffect(() => {
        if (showManageModal) {
            fetchSystemLogs(showManageModal.id)
        }
    }, [showManageModal])

    const fetchSystems = async () => {
        setLoading(true)
        const { data, error } = await supabase
            .from('systems')
            .select('*')
            .order('name', { ascending: true })

        if (error) {
            toast.error('Failed to load system data')
        } else {
            setSystems(data || [])
        }
        setLoading(false)
    }

    const fetchSystemLogs = async (systemId: string) => {
        const { data } = await supabase
            .from('system_logs')
            .select('*')
            .eq('system_id', systemId)
            .order('created_at', { ascending: false })
        if (data) setSystemLogs(data)
    }

    const fetchClients = async () => {
        const { data } = await supabase.from('clients').select('id, name, softwares').order('name')
        if (data) setClients(data)
    }

    const logSystemAction = async (systemId: string, type: string, description: string) => {
        await supabase.from('system_logs').insert([{
            system_id: systemId,
            log_type: type,
            description: description,
            user_id: profile?.user_id || profile?.id
        }])
    }

    const handleCreateSystem = async (e: React.FormEvent) => {
        e.preventDefault()

        // Duplicate Check
        const isDuplicate = systems.some(s =>
            s.name.toLowerCase() === newSystem.name.toLowerCase() &&
            s.id !== (newSystem as any).id
        );

        if (isDuplicate) {
            toast.error(`System ${newSystem.name} already exists in the records.`);
            return;
        }

        setLoading(true)

        const payload = {
            branch_location: activeBranch,
            system_type: newSystem.type,
            name: newSystem.name,
            ip_address: newSystem.ip,
            specs: newSystem.specs,
            last_os_update: newSystem.last_os_update || null,
            installed_software: newSystem.installed_software,
            supported_clients: newSystem.supported_clients,
            status: 'operational',
            it_item_type: newSystem.it_item_type || null,
            rent_start_date: newSystem.rent_start_date || null,
            rent_end_date: newSystem.rent_end_date || null,
            is_rented: newSystem.type === 'rented'
        }

        let error;
        if ((newSystem as any).id) {
            const { error: updateErr } = await supabase
                .from('systems')
                .update(payload)
                .eq('id', (newSystem as any).id)
            error = updateErr
        } else {
            const { error: insertErr, data } = await supabase
                .from('systems')
                .insert([payload])
                .select()
            error = insertErr
            if (!error && data?.[0]) {
                await logSystemAction(data[0].id, 'creation', `System registered at ${activeBranch}`)
            }
        }

        if (error) {
            toast.error(error.message)
        } else {
            toast.success((newSystem as any).id ? 'System Updated' : 'System Registered')
            setShowAddModal(false)
            setNewSystem({
                id: undefined,
                name: '',
                type: 'workstation' as any,
                ip: '',
                specs: { cpu: '', ram: '', os: 'Windows 11', serial_number: '' },
                last_os_update: null,
                installed_software: [],
                supported_clients: [],
                it_item_type: '',
                rent_start_date: '',
                rent_end_date: '',
                category_name: ''
            })
            fetchSystems()
        }
        setLoading(false)
    }

    const handleUpdateSystem = async (system: System) => {
        const { error } = await supabase
            .from('systems')
            .update({
                specs: system.specs,
                installed_software: system.installed_software,
                supported_clients: system.supported_clients,
                status: system.status,
                branch_location: system.branch_location
            })
            .eq('id', system.id)

        if (error) toast.error('Update failed')
        else {
            fetchSystems()
        }
    }

    const updateStatus = async (id: string, status: string, reason?: string) => {
        const { error } = await supabase
            .from('systems')
            .update({ status, last_checked: new Date().toISOString() })
            .eq('id', id)

        if (error) toast.error('Status update failed')
        else {
            toast.success(`System status locked to ${status}`)
            await logSystemAction(id, 'status_change', `Status changed to ${status}. ${reason || ''}`)
            fetchSystems()
            if (showManageModal?.id === id) {
                setShowManageModal(prev => prev ? { ...prev, status: status as any } : null)
                fetchSystemLogs(id)
            }
        }
    }

    const handleDeleteSystem = async (systemId: string, name: string) => {
        if (!window.confirm(`Are you sure you want to permanently delete system ${name}?`)) return

        setLoading(true)
        const { error } = await supabase
            .from('systems')
            .delete()
            .eq('id', systemId)

        if (error) {
            toast.error(`Delete failed: ${error.message}`)
        } else {
            toast.success(`System ${name} removed from registry`)
            fetchSystems()
        }
        setLoading(false)
    }

    const handleEditSystemOpen = (sys: System) => {
        setNewSystem({
            id: sys.id as any,
            name: sys.name,
            type: sys.system_type,
            ip: sys.ip_address,
            specs: (sys.specs as any) || { cpu: '', ram: '', os: 'Windows 11', serial_number: '' },
            last_os_update: sys.last_os_update || null,
            installed_software: sys.installed_software || [],
            supported_clients: sys.supported_clients || [],
            it_item_type: sys.it_item_type || '',
            rent_start_date: sys.rent_start_date || '',
            rent_end_date: sys.rent_end_date || '',
            category_name: sys.category_name || ''
        })
        setShowAddModal(true)
    }

    const executeTransfer = async () => {
        if (!showTransferModal || !targetBranch) return;

        if (!window.confirm(`Are you absolutely sure you want to transfer ${showTransferModal.name} to ${targetBranch.toUpperCase()}?`)) return;

        try {
            setLoading(true)
            const { error } = await supabase
                .from('systems')
                .update({ branch_location: targetBranch })
                .eq('id', showTransferModal.id)

            if (error) throw error
            toast.success(`System transferred to ${targetBranch.toUpperCase()}`)
            await logSystemAction(showTransferModal.id, 'location_transfer', `Transferred from ${showTransferModal.branch_location} to ${targetBranch}`)
            setShowTransferModal(null)
            fetchSystems()
        } catch (error) {
            toast.error('Transfer failed')
        } finally {
            setLoading(false)
        }
    }

    const handleAutoIncident = async (system: System) => {
        if (!incidentDescription.trim()) return toast.error('Provide incident details')

        try {
            setLoading(true)
            const { error: incidentErr } = await supabase.from('incidents').insert([{
                title: `HARDWARE FAULT: ${system.name}`,
                description: `System IP: ${system.ip_address}\nIssue: ${incidentDescription}`,
                category: 'Utility/Hardware',
                severity: 'major',
                status: 'open',
                user_id: profile?.id,
                system_id: system.id,
                branch_location: activeBranch
            }])

            if (incidentErr) throw incidentErr

            await updateStatus(system.id, 'fault', `Reported Issue: ${incidentDescription}`)

            toast.success('Incident Broadcasted & System Marked Fault')
            setShowManageModal(null)
            setIncidentDescription('')
        } catch (err: any) {
            toast.error(err.message)
        } finally {
            setLoading(false)
        }
    }

    const generateSerial = () => {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let result = 'FETS-';
        for (let i = 0; i < 4; i++) result += chars.charAt(Math.floor(Math.random() * chars.length));
        result += '-';
        for (let i = 0; i < 4; i++) result += chars.charAt(Math.floor(Math.random() * chars.length));
        setNewSystem(prev => ({ ...prev, specs: { ...prev.specs, serial_number: result } }))
    }

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success('Copied to clipboard');
    }

    const toggleClientSupport = (clientName: string, isNew: boolean, system?: System) => {
        if (isNew) {
            const current = newSystem.supported_clients
            setNewSystem({
                ...newSystem,
                supported_clients: current.includes(clientName)
                    ? current.filter(c => c !== clientName)
                    : [...current, clientName]
            })
        } else if (system) {
            const current = system.supported_clients || []
            const updated = {
                ...system,
                supported_clients: current.includes(clientName)
                    ? current.filter(c => c !== clientName)
                    : [...current, clientName]
            }
            setShowManageModal(updated)
            handleUpdateSystem(updated)
        }
    }

    const addSoftwareToDraft = (isNew: boolean, system?: System) => {
        if (!softEntry.name || !softEntry.client) return toast.error('Name and Client required')

        if (isNew) {
            setNewSystem({
                ...newSystem,
                installed_software: [...newSystem.installed_software, softEntry]
            })
        } else if (system) {
            const updated = {
                ...system,
                installed_software: [...system.installed_software, softEntry]
            }
            setShowManageModal(updated)
            handleUpdateSystem(updated)
            logSystemAction(system.id, 'software_add', `Added protocol: ${softEntry.name}`)
        }
        setSoftEntry({ name: '', install_date: '', client: '' })
    }

    const filteredSystems = systems.filter(sys => {
        const matchesSearch = sys.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            sys.ip_address?.includes(searchTerm);
        const matchesCategory = activeCategory === 'all' || sys.category_name === activeCategory;
        return sys.branch_location === activeBranch && matchesCategory && matchesSearch;
    }).sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));

    const toggleCard = (id: string) => {
        setExpandedCards(prev => {
            const newState = { ...prev };
            newState[id] = !prev[id];
            return newState;
        })
    }

    return (
        <div style={{ background: `linear-gradient(135deg, ${theme.bg}, ${theme.bg}, ${theme.secondary}30)` }} className="min-h-screen text-[#2D3748] p-4 md:p-8 pt-6 font-['Plus_Jakarta_Sans',sans-serif]">
            {/* Header Controls */}
            <div className="max-w-[1600px] mx-auto">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                    >
                        <h2 className="text-4xl md:text-5xl font-black tracking-tighter text-black mb-3 leading-tight">
                            System <span style={{ color: theme.primary }} className="block md:inline">Management</span>
                        </h2>
                        <div className="flex items-center gap-3">
                            <div style={{ borderColor: `${theme.primary}20` }} className="flex items-center gap-3 px-4 py-2 bg-white/60 backdrop-blur-md border rounded-2xl shadow-sm">
                                <div className="relative">
                                    <div style={{ backgroundColor: theme.primary }} className="h-2.5 w-2.5 rounded-full" />
                                    <div style={{ backgroundColor: theme.primary }} className="absolute inset-0 h-2.5 w-2.5 rounded-full animate-ping opacity-40" />
                                </div>
                                <span className="text-xs font-black text-black uppercase tracking-[0.2em]">{activeBranch} Branch</span>
                            </div>
                            <div style={{ backgroundColor: theme.secondary }} className="h-1 w-1 rounded-full" />
                            <span className="text-[10px] font-bold text-slate-800 uppercase tracking-[0.2em] opacity-60">System Registry List</span>
                        </div>
                    </motion.div>

                    <div className="flex flex-wrap items-center gap-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            style={{ borderColor: theme.secondary }}
                            className="flex items-center gap-4 px-6 py-4 bg-white/40 backdrop-blur-md rounded-2xl border shadow-sm group hover:bg-white/60 transition-all duration-300"
                        >
                            <div style={{ backgroundColor: `${theme.primary}10`, color: theme.primary }} className="p-2.5 rounded-xl group-hover:scale-110 transition-transform">
                                <Activity size={20} strokeWidth={2.5} />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black text-black uppercase tracking-widest leading-none mb-1">Current Status</span>
                                <span className="text-sm font-black text-black uppercase tracking-tight">Systems Online</span>
                            </div>
                        </motion.div>
                        {isAdmin && (
                            <div className="flex flex-wrap gap-4">
                                <button
                                    onClick={() => {
                                        setNewSystem({
                                            id: undefined,
                                            name: '',
                                            type: 'workstation' as any,
                                            ip: '',
                                            specs: { cpu: '', ram: '', os: 'Windows 11', serial_number: '' },
                                            last_os_update: null,
                                            installed_software: [],
                                            supported_clients: [],
                                            it_item_type: '',
                                            rent_start_date: '',
                                            rent_end_date: '',
                                            category_name: ''
                                        });
                                        setShowAddModal(true);
                                    }}
                                    style={{ backgroundColor: theme.primary, borderColor: theme.dark }}
                                    className="flex items-center gap-3 px-6 py-4 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:brightness-105 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.1)] transition-all active:scale-95 border-b-4"
                                >
                                    <Plus size={18} strokeWidth={3} />
                                    Add System
                                </button>
                                <button
                                    onClick={() => {
                                        setNewSystem({
                                            id: undefined,
                                            name: '',
                                            type: 'peripheral' as any,
                                            ip: '',
                                            specs: { cpu: 'N/A', ram: 'N/A', os: 'N/A', serial_number: '' },
                                            last_os_update: null,
                                            installed_software: [],
                                            supported_clients: [],
                                            it_item_type: 'Printer',
                                            rent_start_date: '',
                                            rent_end_date: '',
                                            category_name: 'Printer'
                                        });
                                        setShowAddModal(true);
                                    }}
                                    className="flex items-center gap-3 px-6 py-4 bg-white text-black border-2 border-[#BBDED6] rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-[#BBDED6]/10 transition-all active:scale-95 shadow-sm"
                                >
                                    <Printer size={18} strokeWidth={2.5} />
                                    Add IT Item
                                </button>
                                <button
                                    onClick={() => {
                                        setNewSystem({
                                            id: undefined,
                                            name: '',
                                            type: 'rented' as any,
                                            ip: '',
                                            specs: { cpu: '', ram: '', os: 'Windows', serial_number: '' },
                                            last_os_update: null,
                                            installed_software: [],
                                            supported_clients: [],
                                            it_item_type: '',
                                            rent_start_date: format(new Date(), 'yyyy-MM-dd'),
                                            rent_end_date: format(new Date(), 'yyyy-MM-dd'),
                                            category_name: ''
                                        });
                                        setShowAddModal(true);
                                    }}
                                    className="flex items-center gap-3 px-6 py-4 bg-[#FAE3D9] text-black rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-[#FFB6B9]/40 transition-all active:scale-95 shadow-sm border border-white/50"
                                >
                                    <CalendarRange size={18} strokeWidth={2.5} />
                                    Add Rented System
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Menu Navigation & Content */}
                <div className="flex flex-col lg:flex-row gap-8">
                    {/* SIDEBAR MENU */}
                    <div className="w-full lg:w-72 flex flex-col gap-4">
                        <GlassCard className="p-4 flex flex-col gap-2" glow>
                            <span className="text-[10px] font-black text-black/40 uppercase tracking-[0.3em] ml-2 mb-2">Asset Directory</span>
                            {categories.map(cat => {
                                const IconComp = cat.icon === 'monitor' ? Monitor :
                                    cat.icon === 'printer' ? Printer :
                                        cat.icon === 'activity' ? Activity :
                                            cat.icon === 'headphones' ? Headphones : Package;
                                return (
                                    <button
                                        key={cat.name}
                                        onClick={() => setActiveCategory(cat.name)}
                                        style={activeCategory === cat.name ? { backgroundImage: `linear-gradient(to right, ${theme.primary}, ${theme.secondary})` } : {}}
                                        className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-500 group ${activeCategory === cat.name
                                            ? 'text-white shadow-xl translate-x-1'
                                            : 'hover:bg-white/40 text-black/60 hover:text-black'
                                            }`}
                                    >
                                        <div style={activeCategory === cat.name ? { backgroundColor: 'rgba(255,255,255,0.2)' } : { backgroundColor: `${theme.primary}10`, color: theme.primary }} className={`p-2 rounded-xl`}>
                                            <IconComp size={18} />
                                        </div>
                                        <span className="text-xs font-black uppercase tracking-widest">{cat.name}</span>
                                    </button>
                                )
                            })}
                            <button
                                onClick={handleAddCategory}
                                className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl border-2 border-dashed border-[#BBDED6] text-[#61C0BF] hover:bg-[#61C0BF]/5 transition-all group mt-4"
                            >
                                <PlusCircle size={18} className="group-hover:rotate-90 transition-transform" />
                                <span className="text-[10px] font-black uppercase tracking-widest">Add Menu</span>
                            </button>
                        </GlassCard>

                        <GlassCard className="p-4 space-y-4" glow>
                            <div className="relative group">
                                <Search style={{ color: theme.primary }} className="absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:scale-110 transition-transform" size={16} />
                                <input
                                    type="text"
                                    placeholder="Search..."
                                    style={{ borderColor: theme.secondary }}
                                    className="w-full bg-white/40 border rounded-xl py-3 pl-11 pr-4 text-xs font-bold text-black focus:outline-none focus:ring-4 focus:ring-black/5 transition-all font-outfit"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <button
                                onClick={fetchSystems}
                                style={{ borderColor: theme.secondary, color: theme.primary }}
                                className="w-full flex items-center justify-center gap-3 py-3 bg-white/40 border rounded-xl hover:bg-white/80 transition-all shadow-sm group font-black text-[10px] uppercase tracking-widest"
                            >
                                <RefreshCw size={14} className="group-active:rotate-180 transition-transform duration-500" />
                                Resync Data
                            </button>
                        </GlassCard>
                    </div>

                    {/* MAIN CONTENT AREA */}
                    <div className="flex-1 min-w-0">
                        <AnimatePresence mode="wait">
                            {activeCategory === 'Systems' ? (
                                <motion.div
                                    key="systems-view"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="space-y-12"
                                >
                                    {/* Flowchart Content */}
                                    <div className="flex flex-col items-center gap-20 relative">
                                        {/* Row 1: SERVERS */}
                                        <div className="flex flex-col items-center gap-8 w-full relative z-20">
                                            <GlassCard className="px-10 py-4 bg-slate-900 border-slate-700/50 shadow-2xl" glow>
                                                <div className="flex items-center gap-4">
                                                    <HardDrive size={20} style={{ color: theme.primary }} />
                                                    <span className="text-xs font-black text-white uppercase tracking-[0.4em]">Central Infrastructure</span>
                                                </div>
                                            </GlassCard>
                                            <div className="flex flex-wrap justify-center gap-12">
                                                {systems.filter(s => s.system_type === 'server' && s.branch_location === activeBranch).map(sys => (
                                                    <SystemGridCard
                                                        key={sys.id}
                                                        sys={sys}
                                                        activeBranch={activeBranch}
                                                        expandedCards={expandedCards}
                                                        toggleCard={toggleCard}
                                                        copyToClipboard={copyToClipboard}
                                                        handleEditSystemOpen={handleEditSystemOpen}
                                                        setShowManageModal={setShowManageModal}
                                                        setShowTransferModal={setShowTransferModal}
                                                        setTargetBranch={setTargetBranch}
                                                        handleDeleteSystem={handleDeleteSystem}
                                                        variant="server"
                                                    />
                                                ))}
                                                {systems.filter(s => s.system_type === 'server' && s.branch_location === activeBranch).length === 0 && (
                                                    <div className="p-8 border-2 border-dashed border-slate-300 rounded-[2rem] opacity-40 text-[10px] uppercase font-black">No Servers Deployed</div>
                                                )}
                                            </div>
                                        </div>

                                        {/* CONNECTION LINES 1 */}
                                        <div className="absolute top-[80px] left-1/2 -translate-x-1/2 w-full h-24 -z-0 opacity-30 pointer-events-none">
                                            <svg width="100%" height="100%" viewBox="0 0 1000 100" preserveAspectRatio="none">
                                                <path d="M 500 0 L 500 100" stroke={theme.primary} strokeWidth="2" fill="none" strokeDasharray="5,5" />
                                            </svg>
                                        </div>

                                        {/* Row 2: ADMIN SYSTEMS */}
                                        <div className="flex flex-col items-center gap-8 w-full relative z-10">
                                            <GlassCard className="px-8 py-3" glow style={{ borderColor: `${theme.accent}40` }}>
                                                <div className="flex items-center gap-3">
                                                    <Shield size={16} style={{ color: theme.accent }} />
                                                    <span className="text-[10px] font-black text-black uppercase tracking-[0.4em]">Management Terminals</span>
                                                </div>
                                            </GlassCard>
                                            <div className="flex flex-wrap justify-center gap-8">
                                                {systems.filter(s => s.system_type === 'admin' && s.branch_location === activeBranch).map(sys => (
                                                    <SystemGridCard
                                                        key={sys.id}
                                                        sys={sys}
                                                        activeBranch={activeBranch}
                                                        expandedCards={expandedCards}
                                                        toggleCard={toggleCard}
                                                        copyToClipboard={copyToClipboard}
                                                        handleEditSystemOpen={handleEditSystemOpen}
                                                        setShowManageModal={setShowManageModal}
                                                        setShowTransferModal={setShowTransferModal}
                                                        setTargetBranch={setTargetBranch}
                                                        handleDeleteSystem={handleDeleteSystem}
                                                        variant="admin"
                                                    />
                                                ))}
                                            </div>
                                        </div>

                                        {/* CONNECTION LINES 2 */}
                                        <div className="absolute top-[340px] left-1/2 -translate-x-1/2 w-full h-20 -z-0 opacity-30 pointer-events-none">
                                            <svg width="100%" height="100%" viewBox="0 0 1000 100" preserveAspectRatio="none">
                                                <path d="M 500 0 L 500 50 M 200 50 L 800 50 M 200 50 L 200 100 M 500 50 L 500 100 M 800 50 L 800 100" stroke={theme.primary} strokeWidth="2" fill="none" strokeDasharray="5,5" />
                                            </svg>
                                        </div>

                                        {/* Row 3: WORKSTATIONS */}
                                        <div className="flex flex-col items-center gap-8 w-full relative z-0">
                                            <GlassCard className="px-8 py-3" glow style={{ backgroundColor: theme.primary, borderColor: `${theme.primary}30` }}>
                                                <div className="flex items-center gap-3">
                                                    <Layout size={16} className="text-white" />
                                                    <span className="text-[10px] font-black text-white uppercase tracking-[0.4em]">Operational Units</span>
                                                </div>
                                            </GlassCard>
                                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 w-full px-4">
                                                {systems.filter(s => s.system_type === 'workstation' && s.branch_location === activeBranch).map(sys => (
                                                    <SystemGridCard
                                                        key={sys.id}
                                                        sys={sys}
                                                        activeBranch={activeBranch}
                                                        expandedCards={expandedCards}
                                                        toggleCard={toggleCard}
                                                        copyToClipboard={copyToClipboard}
                                                        handleEditSystemOpen={handleEditSystemOpen}
                                                        setShowManageModal={setShowManageModal}
                                                        setShowTransferModal={setShowTransferModal}
                                                        setTargetBranch={setTargetBranch}
                                                        handleDeleteSystem={handleDeleteSystem}
                                                        variant="workstation"
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key={activeCategory}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                                >
                                    {systems.filter(s => s.category_name === activeCategory && s.branch_location === activeBranch).map(sys => (
                                        <SystemGridCard
                                            key={sys.id}
                                            sys={sys}
                                            activeBranch={activeBranch}
                                            expandedCards={expandedCards}
                                            toggleCard={toggleCard}
                                            copyToClipboard={copyToClipboard}
                                            handleEditSystemOpen={handleEditSystemOpen}
                                            setShowManageModal={setShowManageModal}
                                            setShowTransferModal={setShowTransferModal}
                                            setTargetBranch={setTargetBranch}
                                            handleDeleteSystem={handleDeleteSystem}
                                        />
                                    ))}
                                    {systems.filter(s => s.category_name === activeCategory && s.branch_location === activeBranch).length === 0 && (
                                        <div className="col-span-full py-40 text-center border-4 border-dashed border-[#BBDED6] rounded-[3rem] bg-white/20">
                                            <Package size={64} className="mx-auto mb-6 text-[#BBDED6]" strokeWidth={1.5} />
                                            <p className="font-black text-black uppercase tracking-[0.25em] text-lg">Inventory Empty</p>
                                            <p className="text-xs font-bold text-black uppercase tracking-widest mt-2 opacity-50">No items registered in {activeCategory}</p>
                                        </div>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div >


            {/* TRANSFER MODAL */}
            <AnimatePresence>
                {
                    showTransferModal && (
                        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 30 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 30 }}
                                className="w-full max-w-md bg-[#FAE3D9] rounded-[3rem] shadow-[0_30px_100px_-20px_rgba(0,0,0,0.3)] overflow-hidden border-4 border-white"
                            >
                                <div className="flex justify-between items-center p-8 border-b border-[#BBDED6]/40 bg-white/40">
                                    <div>
                                        <h2 className="text-2xl font-black text-black uppercase tracking-tighter">Transfer Branch</h2>
                                        <p className="text-[10px] font-black text-black uppercase tracking-[0.3em] mt-1">Move system to new location</p>
                                    </div>
                                    <button onClick={() => setShowTransferModal(null)} className="p-3 text-black hover:text-[#2D3748] hover:bg-[#BBDED6]/30 rounded-2xl transition-all">
                                        <X size={24} strokeWidth={3} />
                                    </button>
                                </div>

                                <div className="p-10 space-y-8">
                                    <div className="text-center relative">
                                        <div className="absolute inset-0 bg-gradient-to-b from-[#61C0BF]/10 to-transparent rounded-full blur-2xl" />
                                        <div className="relative mx-auto w-20 h-20 bg-[#FAE3D9] rounded-3xl flex items-center justify-center text-[#61C0BF] mb-6 shadow-xl border border-white">
                                            <ArrowRightLeft size={36} strokeWidth={2.5} />
                                        </div>
                                        <div className="inline-block px-5 py-2 bg-[#61C0BF] text-white rounded-2xl text-sm font-black uppercase tracking-widest mb-4 shadow-lg shadow-[#61C0BF]/20">
                                            {showTransferModal.name}
                                        </div>
                                        <p className="text-xs text-black font-bold leading-relaxed opacity-80 uppercase tracking-wider">
                                            You are moving this system to a different physical branch.
                                        </p>
                                    </div>

                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-black uppercase tracking-[0.2em] block ml-1">Target Location</label>
                                        <div className="relative">
                                            <select
                                                value={targetBranch}
                                                onChange={(e) => setTargetBranch(e.target.value)}
                                                className="w-full p-5 bg-[#FAE3D9]/50 border-2 border-[#BBDED6] rounded-[1.5rem] text-sm font-black text-black outline-none focus:border-[#61C0BF] focus:bg-white transition-all appearance-none cursor-pointer shadow-sm pr-12 group"
                                            >
                                                <option value="" disabled>SELECT BRANCH...</option>
                                                {branches.map(b => (
                                                    <option key={b} value={b} className="font-black uppercase py-4">
                                                        {b.toUpperCase()} BRANCH
                                                    </option>
                                                ))}
                                            </select>
                                            <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 text-[#61C0BF] pointer-events-none" size={18} strokeWidth={3} />
                                        </div>
                                    </div>

                                    <div className="pt-4 flex flex-col gap-3">
                                        <button
                                            onClick={executeTransfer}
                                            disabled={!targetBranch || loading || targetBranch === showTransferModal.branch_location}
                                            className="w-full py-5 bg-[#61C0BF] text-white rounded-[1.5rem] font-black uppercase tracking-[0.2em] text-xs shadow-[0_15px_30px_-5px_rgba(97,192,191,0.5)] hover:brightness-105 active:scale-95 disabled:opacity-30 transition-all border-b-4 border-[#4A9695]"
                                        >
                                            {loading ? 'PROCESSING...' : 'CONFIRM TRANSFER'}
                                        </button>
                                        <button
                                            onClick={() => setShowTransferModal(null)}
                                            className="w-full py-4 text-[#7D5A50] font-black uppercase tracking-widest text-xs hover:bg-[#FFB6B9]/20 rounded-[1.5rem] transition-all"
                                        >
                                            ABORT
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    )
                }
            </AnimatePresence >

            {/* REGISTER MODAL */}
            <AnimatePresence>
                {
                    showAddModal && (
                        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 30 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 30 }}
                                className="w-full max-w-5xl bg-[#FAE3D9] rounded-[3rem] shadow-[0_30px_100px_-20px_rgba(0,0,0,0.3)] overflow-hidden border-4 border-white flex flex-col max-h-[90vh]"
                            >
                                <div className="flex justify-between items-center p-8 border-b border-[#BBDED6]/40 bg-white/40">
                                    <div>
                                        <h2 className="text-3xl font-black text-black uppercase tracking-tighter">
                                            {(newSystem as any).id ? 'Edit' : 'Create'} <span className="text-[#61C0BF]">System</span>
                                        </h2>
                                        <p className="text-xs font-black text-black uppercase tracking-[0.3em] mt-1">System Setup & Deployment</p>
                                    </div>
                                    <button onClick={() => setShowAddModal(false)} className="p-3 text-black hover:text-[#2D3748] hover:bg-[#BBDED6]/30 rounded-2xl transition-all">
                                        <X size={28} strokeWidth={3} />
                                    </button>
                                </div>

                                <form onSubmit={handleCreateSystem} className="p-10 overflow-y-auto custom-scrollbar flex-1 bg-gradient-to-b from-white/40 to-transparent">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-8">
                                        <div className="space-y-8">
                                            <div className="space-y-3">
                                                <label className="text-[10px] font-black text-black uppercase tracking-[0.2em] ml-2">System Name</label>
                                                <input
                                                    type="text"
                                                    placeholder="SYSTEM DESIGNATION"
                                                    value={newSystem.name}
                                                    onChange={e => setNewSystem({ ...newSystem, name: e.target.value })}
                                                    className="w-full px-6 py-4 bg-[#FAE3D9]/50 border-2 border-[#BBDED6] rounded-2xl outline-none focus:border-[#61C0BF] focus:bg-white text-black transition-all font-black uppercase tracking-wide placeholder:text-slate-400 shadow-sm"
                                                    required
                                                />
                                            </div>
                                            <div className="space-y-3">
                                                <label className="text-[10px] font-black text-black uppercase tracking-[0.2em] ml-2">IP Address</label>
                                                <input
                                                    type="text"
                                                    placeholder="0.0.0.0"
                                                    value={newSystem.ip}
                                                    onChange={e => setNewSystem({ ...newSystem, ip: e.target.value })}
                                                    className="w-full px-6 py-4 bg-white border-2 border-[#BBDED6] rounded-2xl outline-none focus:border-[#61C0BF] text-black transition-all font-black font-mono placeholder:text-slate-400 shadow-sm"
                                                />
                                            </div>

                                            <div className="space-y-3">
                                                <label className="text-[10px] font-black text-black uppercase tracking-[0.2em] ml-2">System Type</label>
                                                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                                                    {['workstation', 'server', 'admin', 'peripheral', 'rented'].map(type => (
                                                        <button
                                                            key={type}
                                                            type="button"
                                                            onClick={() => setNewSystem({ ...newSystem, type: type as any })}
                                                            className={`p-4 rounded-2xl flex flex-col items-center gap-2 border-2 transition-all duration-300 ${newSystem.type === type
                                                                ? 'bg-[#61C0BF] border-[#4A9695] text-white shadow-xl shadow-[#61C0BF]/30 scale-[1.05]'
                                                                : 'bg-white border-[#BBDED6] text-black hover:border-[#61C0BF]/50'
                                                                }`}
                                                        >
                                                            <div className={`${newSystem.type === type ? 'text-white' : 'text-black'}`}>
                                                                <SystemIcon type={type} itemType={type === 'peripheral' ? (newSystem.it_item_type || 'Package') : undefined} />
                                                            </div>
                                                            <span className="text-[8px] font-black uppercase tracking-widest">{type}</span>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            {newSystem.type === 'peripheral' && (
                                                <div className="space-y-6 p-6 bg-white border-2 border-[#BBDED6] rounded-[2rem] shadow-sm">
                                                    <div className="space-y-3">
                                                        <label className="text-[10px] font-black text-black uppercase tracking-[0.2em] ml-2">Hardware Category</label>
                                                        <select
                                                            value={newSystem.it_item_type}
                                                            onChange={e => setNewSystem({ ...newSystem, it_item_type: e.target.value, category_name: e.target.value === 'Printer' ? 'Printer' : (['Webcam', 'Headphones', 'E Sign pad'].includes(e.target.value) ? 'Testing Equipments' : (e.target.value === 'DVR' ? 'DVR' : 'Testing Equipments')) })}
                                                            className="w-full p-4 bg-[#FAE3D9]/30 border-2 border-[#BBDED6] rounded-xl text-sm font-black text-black outline-none appearance-none cursor-pointer"
                                                        >
                                                            {['Printer', 'DVR', 'Webcam', 'Headphones', 'E Sign pad', 'Other'].map(opt => (
                                                                <option key={opt} value={opt}>{opt}</option>
                                                            ))}
                                                        </select>
                                                    </div>

                                                    {newSystem.it_item_type === 'Printer' && (
                                                        <div className="grid grid-cols-2 gap-4">
                                                            <input placeholder="INK CAPACITY" className="p-4 bg-[#FAE3D9]/20 border border-[#BBDED6] rounded-xl text-xs font-bold" />
                                                            <input placeholder="PAPER TYPE" className="p-4 bg-[#FAE3D9]/20 border border-[#BBDED6] rounded-xl text-xs font-bold" />
                                                        </div>
                                                    )}

                                                    {newSystem.it_item_type === 'DVR' && (
                                                        <div className="grid grid-cols-2 gap-4">
                                                            <input placeholder="CAMERA COUNT" className="p-4 bg-[#FAE3D9]/20 border border-[#BBDED6] rounded-xl text-xs font-bold" />
                                                            <input placeholder="HDD TB" className="p-4 bg-[#FAE3D9]/20 border border-[#BBDED6] rounded-xl text-xs font-bold" />
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {newSystem.type === 'rented' && (
                                                <div className="grid grid-cols-2 gap-4 p-6 bg-[#FAE3D9]/20 border-2 border-[#BBDED6] rounded-[2rem] shadow-sm">
                                                    <div className="space-y-2">
                                                        <label className="text-[10px] font-black text-black uppercase tracking-[0.2em] ml-2">Rent Start Date</label>
                                                        <input
                                                            type="date"
                                                            value={newSystem.rent_start_date}
                                                            onChange={e => setNewSystem({ ...newSystem, rent_start_date: e.target.value })}
                                                            className="w-full p-4 bg-white border-2 border-[#BBDED6] rounded-xl text-sm font-black text-black"
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-[10px] font-black text-black uppercase tracking-[0.2em] ml-2">Return Date</label>
                                                        <input
                                                            type="date"
                                                            value={newSystem.rent_end_date}
                                                            onChange={e => setNewSystem({ ...newSystem, rent_end_date: e.target.value })}
                                                            className="w-full p-4 bg-white border-2 border-[#BBDED6] rounded-xl text-sm font-black text-black"
                                                        />
                                                    </div>
                                                </div>
                                            )}

                                            <div className="space-y-4 pt-8 border-t border-[#BBDED6]/40">
                                                <label className="text-[10px] font-black text-black uppercase tracking-[0.2em] ml-2 block">Support Access</label>
                                                <div className="flex flex-wrap gap-2.5">
                                                    {clients.map(c => (
                                                        <button
                                                            key={c.name}
                                                            type="button"
                                                            onClick={() => toggleClientSupport(c.name, true)}
                                                            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border-2 ${newSystem.supported_clients.includes(c.name)
                                                                ? 'bg-[#61C0BF] border-[#4A9695] text-white shadow-md'
                                                                : 'bg-white border-[#BBDED6] text-black hover:border-[#61C0BF]/40'
                                                                }`}
                                                        >
                                                            {c.name}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-8">
                                            <div className="grid grid-cols-2 gap-5">
                                                <div className="space-y-3">
                                                    <label className="text-[10px] font-black text-black uppercase tracking-[0.2em] ml-2">Processor</label>
                                                    <input
                                                        placeholder="CHIPSET"
                                                        value={newSystem.specs.cpu}
                                                        onChange={e => setNewSystem({ ...newSystem, specs: { ...newSystem.specs, cpu: e.target.value } })}
                                                        className="w-full px-5 py-4 bg-[#FAE3D9]/50 border-2 border-[#BBDED6] rounded-2xl outline-none focus:border-[#61C0BF] focus:bg-white text-sm font-black text-black placeholder:text-slate-400 shadow-sm"
                                                    />
                                                </div>
                                                <div className="space-y-3">
                                                    <label className="text-[10px] font-black text-black uppercase tracking-[0.2em] ml-2">Memory</label>
                                                    <input
                                                        placeholder="CAPACITY"
                                                        value={newSystem.specs.ram}
                                                        onChange={e => setNewSystem({ ...newSystem, specs: { ...newSystem.specs, ram: e.target.value } })}
                                                        className="w-full px-5 py-4 bg-[#FAE3D9]/50 border-2 border-[#BBDED6] rounded-2xl outline-none focus:border-[#61C0BF] focus:bg-white text-sm font-black text-black placeholder:text-slate-400 shadow-sm"
                                                    />
                                                </div>
                                                <div className="col-span-2 space-y-3">
                                                    <label className="text-[10px] font-black text-black uppercase tracking-[0.2em] ml-2">System Serial Number</label>
                                                    <div className="flex gap-3">
                                                        <input
                                                            placeholder="GENERATE SERIAL"
                                                            value={newSystem.specs.serial_number}
                                                            readOnly
                                                            className="flex-1 px-6 py-4 bg-[#FAE3D9]/60 border-2 border-[#BBDED6] rounded-2xl outline-none text-sm font-black text-black font-mono tracking-[0.1em] cursor-default shadow-inner"
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={generateSerial}
                                                            className="px-6 py-4 bg-[#61C0BF] text-white rounded-2xl font-black text-xs uppercase hover:brightness-105 active:scale-95 transition-all shadow-lg shadow-[#61C0BF]/20 border-b-4 border-[#4A9695]"
                                                        >
                                                            GENERATE
                                                        </button>
                                                    </div>
                                                </div>
                                                <div className="col-span-2 space-y-3">
                                                    <label className="text-[10px] font-black text-black uppercase tracking-[0.2em] ml-2">Last System Update</label>
                                                    <input
                                                        type="date"
                                                        value={newSystem.last_os_update || ''}
                                                        onChange={e => setNewSystem({ ...newSystem, last_os_update: e.target.value })}
                                                        className="w-full px-6 py-4 bg-[#FAE3D9]/50 border-2 border-[#BBDED6] rounded-2xl outline-none focus:border-[#61C0BF] focus:bg-white text-sm font-black text-black shadow-sm"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex gap-4 pt-10 mt-6 border-t border-[#BBDED6]/40">
                                        <button
                                            type="button"
                                            onClick={() => setShowAddModal(false)}
                                            className="px-8 py-5 rounded-2xl bg-[#FFB6B9]/10 text-[#874345] font-black uppercase tracking-widest text-xs hover:bg-[#FFB6B9]/20 transition-all border-2 border-transparent"
                                        >
                                            ABORT
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="flex-1 py-5 rounded-[1.5rem] bg-[#61C0BF] shadow-[0_20px_40px_-5px_rgba(97,192,191,0.4)] text-white font-black uppercase tracking-[0.2em] text-xs hover:brightness-105 transition-all active:scale-[0.98] border-b-4 border-[#4A9695]"
                                        >
                                            {loading ? 'SAVING...' : (newSystem as any).id ? 'UPDATE SYSTEM' : 'CREATE SYSTEM'}
                                        </button>
                                    </div>
                                </form>
                            </motion.div>
                        </div>
                    )
                }
            </AnimatePresence >

            {/* MANAGE MODAL */}
            <AnimatePresence>
                {
                    showManageModal && (
                        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 30 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 30 }}
                                className="w-full max-w-5xl bg-[#FAE3D9] rounded-[3.5rem] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.4)] overflow-hidden flex flex-col max-h-[90vh] border-4 border-white"
                            >
                                <div className="flex justify-between items-center p-10 border-b border-[#BBDED6]/40 bg-white/40">
                                    <div className="flex items-center gap-6">
                                        <div className="p-5 bg-white rounded-[2rem] border-2 border-[#BBDED6] shadow-xl group hover:rotate-[360deg] transition-transform duration-700">
                                            <SystemIcon type={showManageModal.system_type} />
                                        </div>
                                        <div>
                                            <h2 className="text-3xl font-black text-black uppercase tracking-tighter">
                                                {showManageModal.name}
                                            </h2>
                                            <div className="flex items-center gap-3 mt-2">
                                                <div className="px-3 py-1 bg-[#FAE3D9] border border-[#BBDED6] rounded-lg text-[10px] font-black text-black font-mono tracking-widest shadow-inner">
                                                    {showManageModal.id.slice(0, 8)}
                                                </div>
                                                <StatusBadge status={showManageModal.status} theme={theme} />
                                            </div>
                                        </div>
                                    </div>
                                    <button onClick={() => setShowManageModal(null)} className="p-4 text-black hover:text-[#2D3748] hover:bg-[#BBDED6]/20 rounded-3xl transition-all">
                                        <X size={32} strokeWidth={3} />
                                    </button>
                                </div>

                                <div className="flex-1 overflow-y-auto custom-scrollbar p-10 bg-gradient-to-b from-white/20 to-transparent">
                                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                                        {/* Control Matrix */}
                                        <div className="space-y-8">
                                            <div className="p-8 rounded-[2.5rem] bg-white/60 border-2 border-[#BBDED6] shadow-xl">
                                                <h4 className="text-[10px] font-black text-black uppercase tracking-[0.25em] mb-6 flex items-center gap-2">
                                                    <div className="h-1.5 w-1.5 rounded-full bg-[#61C0BF]" />
                                                    System Status
                                                </h4>
                                                <div className="space-y-3">
                                                    {['operational', 'maintenance', 'fault'].map(status => (
                                                        <button
                                                            key={status}
                                                            onClick={() => updateStatus(showManageModal.id, status, `Manual Toggle: ${status.toUpperCase()}`)}
                                                            className={`w-full p-4 rounded-2xl border-2 text-[10px] font-black uppercase tracking-widest flex items-center justify-between transition-all duration-300 ${showManageModal.status === status
                                                                ? (status === 'operational' ? 'bg-[#61C0BF] border-[#4A9695] text-white shadow-lg' :
                                                                    status === 'maintenance' ? 'bg-[#FFB6B9] border-[#D98B8E] text-white shadow-lg' :
                                                                        'bg-[#874345] border-[#5E2F31] text-white shadow-lg')
                                                                : 'bg-white border-[#BBDED6]/40 text-black hover:border-[#61C0BF] hover:bg-[#BBDED6]/10'
                                                                }`}
                                                        >
                                                            <span>{status}</span>
                                                            {showManageModal.status === status ? <Check size={16} strokeWidth={4} /> : (
                                                                status === 'maintenance' ? <Settings size={16} /> :
                                                                    status === 'fault' ? <AlertTriangle size={16} /> : <CheckCircle2 size={16} />
                                                            )}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="p-8 rounded-[2.5rem] bg-[#FFB6B9]/10 border-2 border-[#FFB6B9]/20 shadow-xl overflow-hidden relative group">
                                                <div className="absolute top-0 right-0 p-4 opacity-10">
                                                    <AlertTriangle size={80} />
                                                </div>
                                                <h4 className="text-[10px] font-black text-[#874345] uppercase tracking-[0.25em] mb-6 flex items-center gap-2 relative z-10">
                                                    <div className="h-1.5 w-1.5 rounded-full bg-[#FFB6B9]" />
                                                    Report System Issue
                                                </h4>
                                                <textarea
                                                    className="w-full p-5 bg-[#FAE3D9]/50 border-2 border-[#FFB6B9]/20 rounded-2xl text-xs font-bold text-black placeholder:text-[#FFB6B9]/50 outline-none focus:border-[#FFB6B9] focus:bg-white shadow-inner relative z-10"
                                                    rows={4}
                                                    placeholder="Provide incident details..."
                                                    value={incidentDescription}
                                                    onChange={(e) => setIncidentDescription(e.target.value)}
                                                />
                                                <button
                                                    onClick={() => handleAutoIncident(showManageModal)}
                                                    disabled={!incidentDescription}
                                                    className="w-full mt-4 py-4 bg-[#FFB6B9] text-[#874345] rounded-2xl font-black uppercase tracking-[0.15em] text-[10px] shadow-lg shadow-[#FFB6B9]/20 hover:brightness-105 active:scale-[0.98] disabled:opacity-30 transition-all border-b-4 border-[#D98B8E] relative z-10"
                                                >
                                                    SUBMIT REPORT
                                                </button>
                                            </div>
                                        </div>

                                        {/* Activity & Protocol Matrix */}
                                        <div className="lg:col-span-2 space-y-10">
                                            <div className="p-8 rounded-[2.5rem] bg-white/60 border-2 border-[#BBDED6] shadow-xl">
                                                <div className="flex items-center justify-between mb-8">
                                                    <h4 className="text-[10px] font-black text-black uppercase tracking-[0.25em] flex items-center gap-2">
                                                        <div className="h-1.5 w-1.5 rounded-full bg-[#61C0BF]" />
                                                        Software List
                                                    </h4>
                                                    <div className="flex gap-2">
                                                        <select
                                                            value={selectedClientForSW}
                                                            onChange={(e) => setSelectedClientForSW(e.target.value)}
                                                            className="px-4 py-2.5 bg-[#FAE3D9] border-2 border-[#BBDED6] rounded-xl text-[10px] font-black uppercase text-black outline-none focus:border-[#61C0BF] shadow-sm appearance-none pr-8 relative"
                                                        >
                                                            <option value="">CLIENT...</option>
                                                            {clients.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                                                        </select>
                                                        <select
                                                            value={softEntry.name}
                                                            onChange={(e) => setSoftEntry({ ...softEntry, client: selectedClientForSW, name: e.target.value, install_date: new Date().toISOString() })}
                                                            disabled={!selectedClientForSW}
                                                            className="px-4 py-2.5 bg-[#FAE3D9] border-2 border-[#BBDED6] rounded-xl text-[10px] font-black uppercase text-black outline-none min-w-[120px] focus:border-[#61C0BF] shadow-sm disabled:opacity-30"
                                                        >
                                                            <option value="">SOFTWARE...</option>
                                                            {clients.find(c => c.name === selectedClientForSW)?.softwares?.map((sw: string) => (
                                                                <option key={sw} value={sw}>{sw}</option>
                                                            ))}
                                                        </select>
                                                        <button
                                                            onClick={() => addSoftwareToDraft(false, showManageModal)}
                                                            disabled={!softEntry.name}
                                                            className="p-3 bg-[#61C0BF] text-white rounded-xl shadow-lg hover:rotate-90 transition-all active:scale-90 disabled:opacity-30"
                                                        >
                                                            <Plus size={18} strokeWidth={4} />
                                                        </button>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[250px] overflow-y-auto pr-3 custom-scrollbar">
                                                    {(showManageModal.installed_software || []).map((sw, idx) => (
                                                        <motion.div
                                                            key={idx}
                                                            initial={{ opacity: 0, x: -10 }}
                                                            animate={{ opacity: 1, x: 0 }}
                                                            className="flex items-center justify-between p-4 bg-[#FAE3D9]/30 border-2 border-[#BBDED6]/30 rounded-2xl shadow-sm group hover:border-[#61C0BF] hover:shadow-md hover:bg-white transition-all duration-300"
                                                        >
                                                            <div className="flex items-center gap-4">
                                                                <div className="w-10 h-10 rounded-xl bg-[#61C0BF]/10 flex items-center justify-center text-[#61C0BF] group-hover:bg-[#61C0BF] group-hover:text-white transition-colors duration-500">
                                                                    <Terminal size={18} strokeWidth={2.5} />
                                                                </div>
                                                                <div>
                                                                    <p className="text-xs font-black text-black uppercase tracking-tight">{sw.name}</p>
                                                                    <p className="text-[9px] font-black text-black uppercase tracking-[0.2em]">{sw.client}</p>
                                                                </div>
                                                            </div>
                                                            <button
                                                                className="text-[#FFB6B9] p-2 hover:bg-[#FFB6B9]/10 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                                                                onClick={() => {
                                                                    const updated = {
                                                                        ...showManageModal,
                                                                        installed_software: showManageModal.installed_software.filter((_, i) => i !== idx)
                                                                    }
                                                                    setShowManageModal(updated)
                                                                    handleUpdateSystem(updated)
                                                                }}
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </motion.div>
                                                    ))}
                                                    {(showManageModal.installed_software || []).length === 0 && (
                                                        <div className="col-span-full py-12 text-center border-4 border-dashed border-[#BBDED6]/20 rounded-3xl bg-[#BBDED6]/5">
                                                            <Network size={40} className="mx-auto mb-3 text-[#BBDED6]/40" />
                                                            <p className="text-[10px] font-black text-black uppercase tracking-[0.25em]">No Software Installed</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="p-8 rounded-[2.5rem] bg-[#2D3748] border-2 border-[#61C0BF]/20 shadow-2xl relative overflow-hidden">
                                                <div className="absolute inset-0 bg-gradient-to-br from-[#61C0BF]/5 to-transparent pointer-events-none" />
                                                <h4 className="text-[10px] font-black text-[#61C0BF] uppercase tracking-[0.25em] mb-6 flex items-center gap-2">
                                                    <div className="h-1.5 w-1.5 rounded-full bg-[#61C0BF] animate-pulse" />
                                                    Activity History
                                                </h4>
                                                <div className="space-y-3 h-[250px] overflow-y-auto pr-4 custom-scrollbar relative z-10">
                                                    {systemLogs.map(log => (
                                                        <div key={log.id} className="flex gap-4 p-4 bg-white/5 rounded-2xl border border-white/5 hover:border-white/10 transition-colors group">
                                                            <div className="text-[#61C0BF] font-black text-[9px] uppercase tracking-tighter bg-[#61C0BF]/10 px-2 py-1 rounded-md self-start">
                                                                {format(new Date(log.created_at), 'HH:mm:ss')}
                                                            </div>
                                                            <div className="flex-1">
                                                                <div className="flex items-center gap-2 mb-1">
                                                                    <span className={`text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded ${log.log_type === 'fault' ? 'bg-[#FFB6B9]/20 text-[#FFB6B9]' :
                                                                        log.log_type === 'status_change' ? 'bg-[#61C0BF]/20 text-[#61C0BF]' :
                                                                            'bg-[#BBDED6]/20 text-[#BBDED6]'
                                                                        }`}>
                                                                        {log.log_type}
                                                                    </span>
                                                                    <div className="h-px flex-1 bg-white/5" />
                                                                </div>
                                                                <p className="text-white/80 text-[11px] font-bold leading-relaxed">{log.description}</p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                    {systemLogs.length === 0 && (
                                                        <div className="h-full flex flex-col items-center justify-center opacity-20">
                                                            <Terminal size={48} className="text-[#61C0BF] mb-4" />
                                                            <p className="text-[10px] uppercase font-black tracking-[0.4em] text-[#61C0BF]">Signal Void</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    )
                }
            </AnimatePresence >
        </div >
    )
}

export default SystemManager
