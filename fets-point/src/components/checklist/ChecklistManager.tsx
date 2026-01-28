import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    Plus,
    List,
    History,
    Trash2,
    Power,
    CheckCircle,
    Activity,
    Eye,
    X,
    Users,
    ClipboardList,
    Pencil,
    Layout,
    CheckSquare,
    TrendingUp,
    Sparkles,
    CheckCircle2,
    Play,
    Search,
    Maximize2,
    Box,
    Clock,
    MapPin,
    MessageSquare,
    AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChecklistCreator } from './ChecklistCreator';
import { ChecklistAnalysis } from './ChecklistAnalysis';
import { ChecklistFormModal } from './ChecklistFormModal';
import { StaffBranchSelector } from './StaffBranchSelector';
import { ChecklistTemplate, ChecklistSubmissionWithDetails as ChecklistSubmission } from '../../types/checklist';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';
import { useQueryClient } from '@tanstack/react-query';
import {
    format,
    isSameDay
} from 'date-fns';
import { useBranch } from '../../hooks/useBranch';

interface ChecklistManagerProps {
    currentUser: any;
}

export const ChecklistManager: React.FC<ChecklistManagerProps> = ({ currentUser }) => {
    const { activeBranch } = useBranch();
    const [view, setView] = useState<'list' | 'create' | 'history' | 'analysis'>('list');
    const [templates, setTemplates] = useState<ChecklistTemplate[]>([]);
    const [loading, setLoading] = useState(true);
    const [history, setHistory] = useState<ChecklistSubmission[]>([]);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [selectedSubmission, setSelectedSubmission] = useState<ChecklistSubmission | null>(null);
    const [editingTemplate, setEditingTemplate] = useState<ChecklistTemplate | null>(null);
    const [submittingTemplate, setSubmittingTemplate] = useState<ChecklistTemplate | null>(null);
    const [showFillModal, setShowFillModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [historyFilterType, setHistoryFilterType] = useState<string>('all');

    // Select Flow
    const [showStaffSelector, setShowStaffSelector] = useState(false);
    const [preSelection, setPreSelection] = useState<{ staffId: string; branchId: string; staffName: string } | null>(null);

    // Neumorphic Styles
    const neumorphicCard = "bg-[#e0e5ec] shadow-[9px_9px_16px_rgb(163,177,198,0.6),-9px_-9px_16px_rgba(255,255,255,0.5)] rounded-2xl border border-white/20";
    const neumorphicInset = "bg-[#e0e5ec] shadow-[inset_6px_6px_10px_0_rgba(163,177,198,0.7),inset_-6px_-6px_10px_0_rgba(255,255,255,0.8)] rounded-xl border-none";
    const neumorphicBtn = "px-6 py-2.5 rounded-xl font-bold transition-all active:scale-95 active:shadow-[inset_4px_4px_8px_rgba(163,177,198,0.6),inset_-4px_-4px_8px_rgba(255,255,255,0.5)] shadow-[6px_6px_10px_rgba(163,177,198,0.6),-6px_-6px_10px_rgba(255,255,255,0.5)] bg-[#e0e5ec] text-gray-600 flex items-center gap-2 hover:text-blue-600";
    const neumorphicBtnActive = "px-6 py-2.5 rounded-xl font-bold transition-all shadow-[inset_4px_4px_8px_rgba(163,177,198,0.6),inset_-4px_-4px_8px_rgba(255,255,255,0.5)] bg-[#e0e5ec] text-amber-600 flex items-center gap-2 transform scale-105";
    const neumorphicIconBtn = "p-3 rounded-full transition-all active:scale-95 shadow-[5px_5px_10px_rgba(163,177,198,0.6),-5px_-5px_10px_rgba(255,255,255,0.5)] bg-[#e0e5ec] hover:text-blue-600";

    // Authorization Check - Super Admin Only for template management
    const isSuperAdmin = currentUser?.role === 'super_admin';
    const canManageTemplates = isSuperAdmin;
    const canAccessAnalysis = true; // Still open to all for now as per previous logic, but templates are restricted


    const fetchTemplates = useCallback(async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('checklist_templates' as any)
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching templates:', error);
            toast.error('Failed to load checklists');
        } else {
            setTemplates((data as any) || []);
        }
        setLoading(false);
    }, []);

    const fetchHistory = useCallback(async () => {
        setHistoryLoading(true);
        try {
            // Fetch submissions with template details and profile details in one go
            let query = supabase
                .from('checklist_submissions')
                .select(`
                    *,
                    checklist_templates (
                        title,
                        type,
                        questions
                    ),
                    submitted_by_profile:staff_profiles!checklist_submissions_submitted_by_fkey(
                        full_name
                    )
                `);

            // Filter by branch
            if (activeBranch && activeBranch !== 'global') {
                query = query.eq('branch_id', activeBranch);
            }

            const { data: submissions, error } = await query
                .order('submitted_at', { ascending: false });

            if (error) throw error;

            setHistory((submissions || []).map((s: any) => ({
                ...s,
                submitted_by_profile: s.submitted_by_profile || { full_name: 'Unknown User' }
            })) as any);
        } catch (error) {
            console.error('Error fetching history:', error);
            toast.error('Failed to load history');
        } finally {
            setHistoryLoading(false);
        }
    }, [activeBranch]);

    useEffect(() => {
        if (view === 'history') {
            fetchHistory();
        } else {
            fetchTemplates();
        }
    }, [view, activeBranch, fetchHistory, fetchTemplates]);

    const toggleStatus = async (id: string, currentStatus: boolean) => {
        const { error } = await supabase
            .from('checklist_templates' as any)
            .update({ is_active: !currentStatus })
            .eq('id', id);

        if (error) {
            toast.error('Failed to update status');
        } else {
            toast.success(`Checklist ${!currentStatus ? 'enabled' : 'disabled'}`);
            fetchTemplates();
            queryClient.invalidateQueries({ queryKey: ['checklistTemplates'] });
        }
    };

    const handleEditTemplate = (template: ChecklistTemplate) => {
        setEditingTemplate(template);
        setView('create');
    };

    const deleteTemplate = async (id: string) => {
        if (!confirm('Are you sure? This will delete the template and ALL associated history/submissions. This cannot be undone.')) return;

        try {
            // 1. Delete submissions first
            const { error: subError } = await supabase
                .from('checklist_submissions')
                .delete()
                .eq('template_id', id);

            if (subError) throw new Error(`Submissions: ${subError.message}`);

            // 2. Now delete the template
            const { error } = await supabase
                .from('checklist_templates')
                .delete()
                .eq('id', id);

            if (error) throw error;

            toast.success('Checklist and history deleted');
            fetchTemplates();
            queryClient.invalidateQueries({ queryKey: ['checklistTemplates'] });
            if (view === 'history') fetchHistory();
        } catch (error: any) {
            console.error('Delete error details:', error);
            toast.error(`Failed to delete: ${error.message || 'It may have existing data'}`);
        }
    };


    const deleteSubmission = async (id: string) => {
        if (!confirm('Delete this submission record?')) return;

        const { error } = await supabase
            .from('checklist_submissions')
            .delete()
            .eq('id', id);

        if (error) {
            toast.error(`Failed to delete record: ${error.message}`);
        } else {
            toast.success('Record deleted');
            fetchHistory();
        }
    };

    const queryClient = useQueryClient();

    if (view === 'create') {
        return (
            <div className="min-h-screen -mt-32 pt-48 bg-[#e0e5ec] pb-12" style={{ fontFamily: "'Montserrat', sans-serif" }}>
                <div className="max-w-[1600px] mx-auto px-6">
                    <ChecklistCreator
                        onCancel={() => {
                            setView('list');
                            setEditingTemplate(null);
                        }}
                        onSuccess={() => {
                            setView('list');
                            setEditingTemplate(null);
                            fetchTemplates();
                            queryClient.invalidateQueries({ queryKey: ['checklistTemplates'] });
                        }}
                        currentUser={currentUser}
                        initialData={editingTemplate}
                    />
                </div>
            </div>
        );
    }

    if (view === 'analysis' && canAccessAnalysis) {
        return <ChecklistAnalysis currentUser={currentUser} activeBranch={activeBranch} onClose={() => setView('list')} />;
    }

    const filteredTemplates = templates.filter(t => {
        const matchesSearch = t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            t.description?.toLowerCase().includes(searchTerm.toLowerCase());

        // Checklist created by centre will be shown only when main location in branch selector is that centre.
        const matchesBranch = !t.branch_location || t.branch_location === 'global' || t.branch_location === activeBranch;

        return matchesSearch && matchesBranch;
    });

    const historyFiltered = history.filter(h => {
        const matchesSearch = h.checklist_templates?.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            h.submitted_by_profile?.full_name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = historyFilterType === 'all' || h.checklist_templates?.type === historyFilterType;
        return matchesSearch && matchesType;
    });

    const groupedHistory = historyFiltered.reduce((acc: any, item) => {
        const dateKey = format(new Date(item.created_at), 'yyyy-MM-dd');
        if (!acc[dateKey]) acc[dateKey] = [];
        acc[dateKey].push(item);
        return acc;
    }, {});

    const sortedDates = Object.keys(groupedHistory).sort((a, b) => b.localeCompare(a));

    return (
        <div className="min-h-screen -mt-32 pt-48 bg-[#e0e5ec] pb-12" style={{ fontFamily: "'Montserrat', sans-serif" }}>
            <div className="max-w-[1600px] mx-auto px-6">
                {/* Executive Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-8 mb-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6"
                >
                    <div className="flex items-center gap-6">
                        <div className="p-5 rounded-2xl bg-[#e0e5ec] shadow-[9px_9px_16px_rgb(163,177,198,0.6),-9px_-9px_16px_rgba(255,255,255,0.5)] text-gray-700">
                            <ClipboardList size={42} strokeWidth={1.5} />
                        </div>
                        <div>
                            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-gray-700 mb-2 uppercase">
                                FETS <span className="text-amber-600">Protocols</span>
                            </h1>
                            <p className="text-lg text-gray-500 font-medium">Compliance & Operational Verification</p>
                        </div>
                    </div>
                </motion.div>

                {/* Toolbar */}
                <div className={`${neumorphicCard} p-4 mb-8 flex flex-col xl:flex-row items-center justify-between gap-6 sticky top-24 z-30`}>
                    <div className="flex items-center space-x-3 w-full xl:w-auto overflow-x-auto pb-2 xl:pb-0 scrollbar-hide">
                        <button
                            onClick={() => { setView('list'); setSearchTerm(''); }}
                            className={view === 'list' ? neumorphicBtnActive : neumorphicBtn}
                        >
                            <Layout size={18} />
                            <span>Templates</span>
                        </button>
                        <button
                            onClick={() => { setView('history'); setSearchTerm(''); }}
                            className={view === 'history' ? neumorphicBtnActive : neumorphicBtn}
                        >
                            <History size={18} />
                            <span>Logs</span>
                        </button>
                        {canAccessAnalysis && (
                            <button
                                onClick={() => setView('analysis')}
                                className={view === 'analysis' ? neumorphicBtnActive : neumorphicBtn}
                            >
                                <TrendingUp size={18} />
                                <span>Analysis</span>
                            </button>
                        )}
                    </div>

                    <div className="flex flex-col md:flex-row items-center gap-4 w-full xl:w-auto">
                        <div className={`flex-1 min-w-[280px] relative group ${neumorphicInset} px-4 py-2.5 flex items-center gap-3`}>
                            <Search size={18} className="text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                            <input
                                type="text"
                                placeholder={view === 'history' ? "Search title or agent..." : "Search protocols..."}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="bg-transparent border-none outline-none text-sm font-bold text-gray-700 w-full placeholder:text-gray-400"
                            />
                        </div>

                        {view === 'history' && (
                            <div className="flex gap-1 p-1 bg-gray-200/50 rounded-xl overflow-x-auto scrollbar-hide">
                                {['all', 'pre_exam', 'post_exam', 'custom'].map(type => (
                                    <button
                                        key={type}
                                        onClick={() => setHistoryFilterType(type)}
                                        className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${historyFilterType === type
                                            ? 'bg-white text-blue-600 shadow-sm'
                                            : 'text-gray-500 hover:text-gray-700'}`}
                                    >
                                        {type === 'all' ? 'All' : type === 'pre_exam' ? 'Start' : type === 'post_exam' ? 'End' : 'Custom'}
                                    </button>
                                ))}
                            </div>
                        )}

                        {canManageTemplates && (
                            <button
                                onClick={() => {
                                    setEditingTemplate(null);
                                    setView('create');
                                }}
                                className="px-6 py-2.5 rounded-xl font-bold transition-all active:scale-95 shadow-[6px_6px_10px_rgba(163,177,198,0.6),-6px_-6px_10px_rgba(255,255,255,0.5)] bg-amber-500 text-white flex items-center gap-2 hover:bg-amber-600 whitespace-nowrap"
                            >
                                <Plus size={18} />
                                <span>New Template</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="mt-12">
                    {view === 'list' ? (
                        <div className="space-y-16">
                            {loading ? (
                                <div className="flex flex-col items-center justify-center py-24 opacity-50">
                                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mb-4"></div>
                                    <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Syncing Protocols...</p>
                                </div>
                            ) : filteredTemplates.length === 0 ? (
                                <div className={`${neumorphicCard} p-16 text-center shadow-inner`}>
                                    <Search size={48} className="mx-auto mb-4 text-gray-300" />
                                    <h3 className="text-xl font-black text-gray-700 uppercase">No Protocols Found</h3>
                                    <p className="text-gray-500 mt-2">Adjust search or initialize a new sequence.</p>
                                </div>
                            ) : (
                                <>
                                    {/* Categorized Protocol Sections */}
                                    {['pre_exam', 'post_exam', 'custom'].map(type => {
                                        const typeTemplates = filteredTemplates.filter(t => (type === 'custom' ? t.type !== 'pre_exam' && t.type !== 'post_exam' : t.type === type));
                                        if (typeTemplates.length === 0) return null;

                                        let sectionMeta = { title: '', sub: '', colorClass: '', icon: Play, borderColor: '', gradient: '' };

                                        if (type === 'pre_exam') {
                                            sectionMeta = {
                                                title: 'Start Shift Protocols',
                                                sub: 'Hardware & facility verification',
                                                colorClass: 'text-blue-600',
                                                icon: Play,
                                                borderColor: 'border-blue-200 bg-blue-50 text-blue-600',
                                                gradient: 'from-blue-200'
                                            };
                                        } else if (type === 'post_exam') {
                                            sectionMeta = {
                                                title: 'End Shift Protocols',
                                                sub: 'Post-session reconciliation',
                                                colorClass: 'text-purple-600',
                                                icon: CheckCircle2,
                                                borderColor: 'border-purple-200 bg-purple-50 text-purple-600',
                                                gradient: 'from-purple-200'
                                            };
                                        } else {
                                            sectionMeta = {
                                                title: 'Ad-Hoc Operations',
                                                sub: 'Maintenance & specialized audits',
                                                colorClass: 'text-amber-600',
                                                icon: Sparkles,
                                                borderColor: 'border-amber-200 bg-amber-50 text-amber-600',
                                                gradient: 'from-amber-200'
                                            };
                                        }

                                        return (
                                            <div key={type} className="space-y-8">
                                                <div className="flex items-center gap-6">
                                                    <div className={`flex items-center justify-center w-12 h-12 rounded-2xl shadow-sm border ${sectionMeta.borderColor}`}>
                                                        <sectionMeta.icon size={24} className={type === 'pre_exam' ? 'fill-current' : ''} />
                                                    </div>
                                                    <div className="flex-1">
                                                        <h2 className={`text-xl font-black uppercase tracking-[0.2em] ${sectionMeta.colorClass}`}>{sectionMeta.title}</h2>
                                                        <p className={`text-xs font-bold opacity-60 uppercase tracking-widest mt-0.5 ${sectionMeta.colorClass}`}>{sectionMeta.sub}</p>
                                                    </div>
                                                    <div className={`h-px flex-[2] bg-gradient-to-r ${sectionMeta.gradient} to-transparent`}></div>
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-10">
                                                    {typeTemplates.map((template, idx) => (
                                                        <TemplateCard
                                                            key={template.id}
                                                            template={template}
                                                            index={idx}
                                                            isSuperAdmin={isSuperAdmin}
                                                            onEdit={handleEditTemplate}
                                                            onToggle={toggleStatus}
                                                            onDelete={deleteTemplate}
                                                            onFill={(t: any) => {
                                                                setSubmittingTemplate(t);
                                                                setShowStaffSelector(true);
                                                            }}
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </>
                            )}
                        </div>
                    ) : view === 'history' ? (
                        <div className="space-y-4 pb-20">
                            {sortedDates.length === 0 ? (
                                <div className={`${neumorphicCard} p-16 text-center shadow-inner`}>
                                    <History size={48} className="mx-auto mb-4 text-gray-300" />
                                    <h3 className="text-xl font-black text-gray-700 uppercase">No Logs Found</h3>
                                    <p className="text-gray-500 mt-2">No checklists have been submitted matching criteria.</p>
                                </div>
                            ) : (
                                sortedDates.map((dateKey, dateIdx) => (
                                    <motion.div
                                        key={dateKey}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: dateIdx * 0.1 }}
                                        className="relative"
                                    >
                                        {/* Date Header */}
                                        <div className="sticky top-24 z-20 py-6 bg-[#e0e5ec]/95 backdrop-blur flex items-center gap-4 border-b border-white/50 mb-6">
                                            <div className="flex flex-col items-center justify-center w-12 h-12 rounded-xl bg-[#e0e5ec] shadow-[4px_4px_8px_#bec3c9,-4px_-4px_8px_#ffffff] text-amber-600">
                                                <span className="text-[10px] font-black uppercase">
                                                    {format(new Date(dateKey), 'MMM')}
                                                </span>
                                                <span className="text-lg font-black leading-none">
                                                    {format(new Date(dateKey), 'dd')}
                                                </span>
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-black text-gray-700 uppercase tracking-tight">
                                                    {isSameDay(new Date(dateKey), new Date()) ? 'Today' :
                                                        isSameDay(new Date(dateKey), new Date(Date.now() - 86400000)) ? 'Yesterday' :
                                                            format(new Date(dateKey), 'EEEE')}
                                                </h3>
                                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{format(new Date(dateKey), 'MMMM yyyy')}</p>
                                            </div>
                                            <div className="h-0.5 bg-gray-300/30 flex-1 ml-4 rounded-full"></div>
                                        </div>

                                        <div className="grid gap-4">
                                            {groupedHistory[dateKey].map((sub: any) => (
                                                <div
                                                    key={sub.id}
                                                    className="group p-5 rounded-3xl bg-[#e0e5ec] shadow-[9px_9px_16px_#bec3c9,-9px_-9px_16px_#ffffff] hover:shadow-[5px_5px_10px_#bec3c9,-5px_-5px_10px_#ffffff] hover:translate-x-1 transition-all border border-white/40 flex flex-col lg:flex-row items-center gap-6 relative overflow-hidden"
                                                >
                                                    {/* Accent Side Bar */}
                                                    <div className={`absolute left-0 top-0 bottom-0 w-1.5 
                                                        ${sub.checklist_templates?.type === 'pre_exam' ? 'bg-blue-500' :
                                                            sub.checklist_templates?.type === 'post_exam' ? 'bg-purple-500' : 'bg-amber-500'}`}
                                                    />

                                                    {/* Time & User Avatar */}
                                                    <div className="flex items-center gap-5 w-full lg:w-auto min-w-[200px] pl-4">
                                                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg transform group-hover:scale-110 transition-transform duration-300
                                                            ${sub.checklist_templates?.type === 'pre_exam' ? 'bg-gradient-to-br from-blue-400 to-blue-600' :
                                                                sub.checklist_templates?.type === 'post_exam' ? 'bg-gradient-to-br from-purple-400 to-purple-600' : 'bg-gradient-to-br from-amber-400 to-amber-600'}`}
                                                        >
                                                            {sub.submitted_by_profile?.full_name?.charAt(0) || '?'}
                                                        </div>
                                                        <div>
                                                            <div className="flex items-baseline gap-1">
                                                                <span className="text-3xl font-black text-gray-700 leading-none">
                                                                    {format(new Date(sub.submitted_at), 'hh:mm')}
                                                                </span>
                                                                <span className="text-xs font-bold text-gray-400 uppercase">
                                                                    {format(new Date(sub.submitted_at), 'a')}
                                                                </span>
                                                            </div>
                                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1 truncate max-w-[120px]">
                                                                {sub.submitted_by_profile?.full_name}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    {/* Vertical Separator (Hidden on mobile) */}
                                                    <div className="hidden lg:block w-px h-16 bg-gradient-to-b from-transparent via-gray-300 to-transparent"></div>

                                                    {/* Details */}
                                                    <div className="flex-1 w-full text-center lg:text-left">
                                                        <div className="flex items-center justify-center lg:justify-start gap-3 mb-2">
                                                            <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider border
                                                                ${sub.checklist_templates?.type === 'pre_exam' ? 'bg-blue-50 border-blue-200 text-blue-600' :
                                                                    sub.checklist_templates?.type === 'post_exam' ? 'bg-purple-50 border-purple-200 text-purple-600' : 'bg-amber-50 border-amber-200 text-amber-600'}`}
                                                            >
                                                                {sub.checklist_templates?.type === 'pre_exam' ? 'Start Shift' : sub.checklist_templates?.type === 'post_exam' ? 'End Shift' : 'Custom'}
                                                            </span>
                                                        </div>
                                                        <h4 className="text-xl font-bold text-gray-800 uppercase tracking-tight leading-tight">{sub.checklist_templates?.title}</h4>
                                                    </div>

                                                    {/* Action */}
                                                    <div className="w-full lg:w-auto flex justify-end gap-3 px-4 lg:px-0">
                                                        <button
                                                            onClick={() => setSelectedSubmission(sub)}
                                                            className="px-6 py-3 rounded-xl bg-[#e0e5ec] shadow-[4px_4px_8px_#bec3c9,-4px_-4px_8px_#ffffff] text-gray-600 font-bold text-xs uppercase tracking-wider hover:text-blue-600 hover:scale-105 active:scale-95 active:shadow-inner transition-all flex items-center gap-2 group/btn"
                                                        >
                                                            <Eye size={18} className="group-hover/btn:text-blue-600 transition-colors" />
                                                            <span>Review</span>
                                                        </button>
                                                        {isSuperAdmin && (
                                                            <button
                                                                onClick={() => deleteSubmission(sub.id)}
                                                                className="px-4 py-3 rounded-xl bg-[#e0e5ec] shadow-[4px_4px_8px_#bec3c9,-4px_-4px_8px_#ffffff] text-gray-400 hover:text-red-500 hover:shadow-[inset_2px_2px_5px_#bec3c9,inset_-2px_-2px_5px_#ffffff] active:scale-95 transition-all"
                                                            >
                                                                <Trash2 size={18} />
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </motion.div>
                                ))
                            )}
                        </div>
                    ) : null}
                </div>

                <AnimatePresence>
                    {/* Execution Modal */}
                    {showStaffSelector && submittingTemplate && (
                        <StaffBranchSelector
                            onSelect={(data) => {
                                setPreSelection(data);
                                setShowStaffSelector(false);
                                setShowFillModal(true);
                            }}
                            onClose={() => { setShowStaffSelector(false); setSubmittingTemplate(null); }}
                        />
                    )}
                    {showFillModal && submittingTemplate && (
                        <ChecklistFormModal
                            template={submittingTemplate}
                            onClose={() => { setShowFillModal(false); setSubmittingTemplate(null); }}
                            onSuccess={() => {
                                if (view === 'history') fetchHistory();
                                else fetchTemplates();
                            }}
                            currentUser={currentUser}
                            overrideStaff={preSelection ? { id: preSelection.staffId, name: preSelection.staffName } : undefined}
                            overrideBranch={preSelection?.branchId}
                        />
                    )}

                    {/* Submission Details Modal - POPUP PORTAL STYLE */}
                    {/* Submission Details Modal - POPUP PORTAL STYLE */}
                    {selectedSubmission && (
                        <SubmissionDetailsModal
                            submission={selectedSubmission}
                            onClose={() => setSelectedSubmission(null)}
                        />
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

// --- Sub-Components ---

const TemplateCard = ({ template, index, isSuperAdmin, onEdit, onDelete, onFill }: {
    template: ChecklistTemplate;
    index: number;
    isSuperAdmin?: boolean;
    onEdit: (t: ChecklistTemplate) => void;
    onToggle: (id: string, s: boolean) => void;
    onDelete: (id: string) => void;
    onFill: (t: ChecklistTemplate) => void;
}) => {
    // Determine color styles based on type
    const isPre = template.type === 'pre_exam';
    const isPost = template.type === 'post_exam';

    // Updated cleaner styles
    const accentColor = isPre ? 'text-blue-600' : isPost ? 'text-purple-600' : 'text-amber-600';
    const accentBg = isPre ? 'bg-blue-500' : isPost ? 'bg-purple-500' : 'bg-amber-500';
    const typeLabel = isPre ? 'Start Shift' : isPost ? 'End Shift' : 'Custom';

    const neumorphicCard = "bg-[#e0e5ec] shadow-[9px_9px_16px_rgb(163,177,198,0.6),-9px_-9px_16px_rgba(255,255,255,0.5)] rounded-3xl border border-white/40";
    const innerShadow = "shadow-[inset_4px_4px_8px_rgba(163,177,198,0.6),inset_-4px_-4px_8px_rgba(255,255,255,0.8)]";

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
            className={`${neumorphicCard} p-6 relative flex flex-col h-full group hover:scale-[1.02] transition-transform duration-300`}
        >
            {/* Header: Type Badge & Admin Actions */}
            <div className="flex justify-between items-start mb-6">
                <div className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 ${innerShadow} ${accentColor} bg-[#e0e5ec]`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${accentBg} animate-pulse`} />
                    {typeLabel}
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={(e) => { e.stopPropagation(); onEdit(template); }}
                        className="p-2 rounded-xl text-gray-400 hover:text-blue-500 hover:bg-white transition-all shadow-none hover:shadow-md"
                        title="Edit Template"
                    >
                        <Pencil size={14} />
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); onDelete(template.id); }}
                        className="p-2 rounded-xl text-gray-400 hover:text-red-500 hover:bg-white transition-all shadow-none hover:shadow-md"
                        title="Delete Template"
                    >
                        <Trash2 size={14} />
                    </button>
                </div>
            </div>

            {/* Content: Title & Description */}
            <div className="flex-1 flex flex-col items-center text-center px-4 mb-8">
                <div className={`mb-4 w-12 h-1 bg-gradient-to-r from-transparent via-gray-300 to-transparent opacity-50`}></div>
                <h3 className="text-xl font-black text-gray-700 mb-3 leading-tight uppercase tracking-tight group-hover:text-gray-900 transition-colors">
                    {template.title}
                </h3>
                <p className="text-gray-500 text-xs font-medium leading-relaxed line-clamp-2 max-w-[90%]">
                    {template.description || 'Verified operational procedure ready for execution.'}
                </p>
            </div>

            {/* Footer: Stats & Action */}
            <div className="space-y-4">
                {/* Stats Row */}
                <div className="flex items-center justify-center gap-4 text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                    <span className="flex items-center gap-1.5 bg-gray-100/50 px-2 py-1 rounded-lg">
                        <List size={10} /> {template.questions?.length || 0} Steps
                    </span>
                    <span className={`flex items-center gap-1.5 px-2 py-1 rounded-lg ${template.is_active ? 'bg-green-100/50 text-green-600' : 'bg-gray-100/50 text-gray-400'}`}>
                        <Activity size={10} /> {template.is_active ? 'Active' : 'Inactive'}
                    </span>
                </div>

                {/* Big Action Button */}
                <button
                    onClick={() => onFill(template)}
                    disabled={!template.is_active}
                    className={`w-full py-4 rounded-2xl font-black uppercase tracking-[0.25em] text-[10px] transition-all flex items-center justify-center gap-3 active:scale-95 group/btn
                    ${template.is_active
                            ? 'bg-[#e0e5ec] shadow-[6px_6px_12px_#bec3c9,-6px_-6px_12px_#ffffff] text-gray-700 hover:text-blue-600 hover:shadow-[inset_6px_6px_12px_#bec3c9,inset_-6px_-6px_12px_#ffffff]'
                            : 'bg-[#e0e5ec] text-gray-300 shadow-none cursor-not-allowed opacity-60'}`}
                >
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center ${template.is_active ? 'bg-gray-200 group-hover/btn:bg-blue-100 group-hover/btn:text-blue-600' : 'bg-gray-100'}`}>
                        <Play size={10} className="ml-0.5 fill-current" />
                    </span>
                    Execute Protocol
                </button>
            </div>
        </motion.div>
    );
};

const HistoryItem = ({ submission, index, onSelect, onDelete }: {
    submission: ChecklistSubmission;
    index: number;
    onSelect: (s: ChecklistSubmission) => void;
    onDelete: (id: string) => void;
}) => {
    const typeLabel = submission.checklist_templates?.type === 'pre_exam' ? 'Pre-Exam' : submission.checklist_templates?.type === 'post_exam' ? 'Post-Exam' : 'Custom';
    const typeColor = submission.checklist_templates?.type === 'pre_exam' ? 'bg-blue-50 text-blue-600 border-blue-100' : submission.checklist_templates?.type === 'post_exam' ? 'bg-purple-50 text-purple-600 border-purple-100' : 'bg-amber-50 text-amber-600 border-amber-100';

    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={() => onSelect(submission)}
            className="flex items-center justify-between p-6 rounded-[2rem] bg-[#e0e5ec] shadow-[9px_9px_16px_#bebebe,-9px_-9px_16px_#ffffff] group hover:shadow-[inset_4px_4px_8px_#bebebe,inset_-4px_-4px_8px_#ffffff] transition-all cursor-pointer"
        >
            <div className="flex-1">
                <div className="flex items-center gap-4 mb-3">
                    <span className={`px-3 py-1 rounded-xl text-[8px] font-black uppercase tracking-[0.2em] border ${typeColor} shadow-sm`}>{typeLabel}</span>
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{new Date(submission.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                </div>
                <div className="flex flex-col">
                    <h4 className="text-lg font-black text-gray-700 uppercase group-hover:text-blue-700 transition-colors tracking-tight">{submission.checklist_templates?.title}</h4>
                    <div className="flex items-center gap-3 mt-1">
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{format(new Date(submission.submitted_at), 'MMM dd, yyyy • HH:mm')}</p>
                        <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                        <p className="text-[10px] text-amber-600 font-black uppercase tracking-widest">{submission.submitted_by_profile?.full_name}</p>
                        <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                        <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-600 text-[10px] font-black uppercase tracking-widest border border-blue-200">
                            {submission.branch_id || 'Global'}
                        </span>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-5">
                <div className={`px-5 py-2 rounded-2xl text-[10px] font-black uppercase tracking-[0.1em] flex items-center gap-2.5 shadow-sm border border-white/20 ${submission.status === 'completed' || submission.status === 'submitted' ? 'bg-green-100/50 text-green-700' : 'bg-amber-100/50 text-amber-700'}`}>
                    {submission.status === 'completed' || submission.status === 'submitted' ? <CheckCircle size={16} /> : <Activity size={16} />}
                    {submission.status}
                </div>
                <div className="flex gap-3">
                    <button onClick={(e) => { e.stopPropagation(); onSelect(submission); }} className="p-3.5 rounded-2xl bg-[#e0e5ec] shadow-[4px_4px_8px_#bec3c9,-4px_-4px_8px_#ffffff] text-gray-500 hover:text-blue-600 transition-all hover:scale-105 active:scale-95">
                        <Eye size={20} />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); onDelete(submission.id); }} className="p-3.5 rounded-2xl bg-[#e0e5ec] shadow-[4px_4px_8px_#bec3c9,-4px_-4px_8px_#ffffff] text-red-300 hover:text-red-500 transition-all hover:scale-105 active:scale-95">
                        <Trash2 size={20} />
                    </button>
                </div>
            </div>
        </motion.div>
    );
};

const SubmissionDetailsModal = ({ submission, onClose }: { submission: any; onClose: () => void }) => {
    // 1. Group questions by section
    const groupedQuestions = useMemo(() => {
        const questions = submission.checklist_templates?.questions || [];
        const groups: Record<string, any[]> = {};
        
        // Default group if no section
        const DEFAULT_SECTION = 'General Verification';

        questions.forEach((q: any) => {
            const section = q.section || DEFAULT_SECTION;
            if (!groups[section]) groups[section] = [];
            groups[section].push(q);
        });

        return groups;
    }, [submission]);

    const isPre = submission.checklist_templates?.type === 'pre_exam';
    const isPost = submission.checklist_templates?.type === 'post_exam';
    const themeColor = isPre ? 'blue' : isPost ? 'purple' : 'amber';
    const themeGradient = isPre ? 'from-blue-500 to-blue-600' : isPost ? 'from-purple-500 to-purple-600' : 'from-amber-500 to-amber-600';
    const themeLight = isPre ? 'bg-blue-50 text-blue-700' : isPost ? 'bg-purple-50 text-purple-700' : 'bg-amber-50 text-amber-700';

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="w-full max-w-4xl max-h-[90vh] flex flex-col bg-[#e0e5ec] rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
                {/* Header Banner */}
                <div className={`relative px-8 py-8 bg-gradient-to-r ${themeGradient} text-white shrink-0`}>
                    <div className="absolute top-0 right-0 p-32 bg-white opacity-5 rounded-full blur-3xl transform -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
                    
                    <div className="relative z-10 flex justify-between items-start">
                        <div>
                            <div className="flex items-center gap-3 mb-2 opacity-90">
                                <span className="px-2.5 py-1 rounded-lg bg-white/20 text-[10px] font-black uppercase tracking-[0.2em] backdrop-blur-md border border-white/20">
                                    {isPre ? 'Start Shift Protocol' : isPost ? 'End Shift Protocol' : 'Custom Check'}
                                </span>
                                <span className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-1">
                                    <Clock size={12} />
                                    {format(new Date(submission.submitted_at), 'HH:mm')} hrs
                                </span>
                            </div>
                            <h2 className="text-3xl font-black uppercase tracking-tight leading-none mb-1 text-white drop-shadow-sm">
                                {submission.checklist_templates?.title}
                            </h2>
                            <p className="text-white/70 text-xs font-medium uppercase tracking-widest">
                                Submission ID: {submission.id.slice(0, 8)}
                            </p>
                        </div>
                        <button 
                            onClick={onClose}
                            className="p-3 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all backdrop-blur-md border border-white/10"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Metadata Strip */}
                    <div className="mt-8 flex items-center gap-8 text-xs font-bold bg-black/10 backdrop-blur-sm p-4 rounded-2xl border border-white/10">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-white text-gray-800 flex items-center justify-center font-black text-base shadow-lg">
                                {submission.submitted_by_profile?.full_name?.charAt(0)}
                            </div>
                            <div>
                                <p className="opacity-50 text-[9px] uppercase tracking-widest mb-0.5">Submitted By</p>
                                <p className="text-lg leading-none">{submission.submitted_by_profile?.full_name || 'Unknown'}</p>
                            </div>
                        </div>
                        <div className="w-px h-8 bg-white/20"></div>
                        <div>
                            <p className="opacity-50 text-[9px] uppercase tracking-widest mb-0.5">Submission Date</p>
                            <p className="text-lg leading-none">{format(new Date(submission.submitted_at), 'dd MMM yyyy')}</p>
                        </div>
                        <div className="w-px h-8 bg-white/20"></div>
                        <div>
                             <p className="opacity-50 text-[9px] uppercase tracking-widest mb-0.5">Location Node</p>
                             <div className="flex items-center gap-1.5">
                                <MapPin size={14} className="opacity-80"/>
                                <p className="text-lg leading-none uppercase">{submission.branch_id || 'Global'}</p>
                             </div>
                        </div>
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                    {/* Progress Overview (Optional visual summary) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {Object.entries(groupedQuestions).map(([section, questions]) => (
                            <div key={section} className="flex flex-col gap-4">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shadow-inner ${themeLight}`}>
                                        <Box size={16} />
                                    </div>
                                    <h3 className="text-sm font-black text-gray-600 uppercase tracking-widest">
                                        {section}
                                    </h3>
                                    <div className="h-px bg-gray-300 flex-1 ml-2 opacity-50"></div>
                                </div>

                                <div className="space-y-3">
                                    {questions.map((q: any) => {
                                        const answer = submission.answers[q.id];
                                        const hasAnswer = answer !== undefined && answer !== null && answer !== '';
                                        
                                        // Visual Logic
                                        let isNegative = false; // logic to determine if answer is "bad"
                                        if (q.type === 'radio' || q.type === 'dropdown') {
                                           if (typeof answer === 'string' && (answer.toLowerCase() === 'no' || answer.toLowerCase() === 'fail' || answer.toLowerCase() === 'poor')) isNegative = true;
                                        }

                                        return (
                                            <div 
                                                key={q.id} 
                                                className={`
                                                    p-5 rounded-2xl bg-[#e0e5ec] shadow-[5px_5px_10px_#bec3c9,-5px_-5px_10px_#ffffff] border 
                                                    ${isNegative ? 'border-red-200 bg-red-50/10' : 'border-white/50'} 
                                                    flex flex-col gap-3 transition-all hover:translate-y-[-2px]
                                                `}
                                            >
                                                <div className="flex justify-between items-start gap-4">
                                                    <p className="text-sm font-bold text-gray-700 leading-snug">{q.text}</p>
                                                    {/* Status Indicator */}
                                                    {hasAnswer ? (
                                                        <div className={`shrink-0`}>
                                                            {q.type === 'checkbox' ? (
                                                                answer ? <CheckCircle2 className="text-green-500" size={20}/> : <X className="text-gray-300" size={20}/>
                                                            ) : (typeof answer === 'string' && (answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'pass' || answer.toLowerCase() === 'good')) ? (
                                                                <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-green-100/80 text-green-700 text-[10px] font-black uppercase tracking-wider border border-green-200">
                                                                    <CheckCircle2 size={12} /> {answer}
                                                                </span>
                                                            ) : (typeof answer === 'string' && (answer.toLowerCase() === 'no' || answer.toLowerCase() === 'fail' || answer.toLowerCase() === 'poor')) ? (
                                                                <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-100/80 text-red-700 text-[10px] font-black uppercase tracking-wider border border-red-200">
                                                                    <AlertCircle size={12} /> {answer}
                                                                </span>
                                                            ) : (
                                                                 <span className="px-2.5 py-1 rounded-lg bg-gray-200/50 text-gray-600 text-[10px] font-bold uppercase tracking-wider">
                                                                    {String(answer)}
                                                                 </span>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <span className="px-2 py-1 rounded bg-gray-100 text-gray-400 text-[9px] font-bold uppercase tracking-wider">Skipped</span>
                                                    )}
                                                </div>

                                                {/* Text responses or comments */}
                                                {(q.type === 'text' || q.type === 'textarea') && hasAnswer && (
                                                     <div className="p-3 bg-white/40 rounded-xl text-xs font-medium text-gray-600 border border-white/40 italic flex gap-2">
                                                        <MessageSquare size={14} className="text-gray-400 mt-0.5 shrink-0"/>
                                                        {answer}
                                                     </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="p-6 bg-[#e0e5ec] border-t border-white/20 flex items-center justify-between shrink-0">
                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                        Validated System Entry
                    </div>
                    <button
                        onClick={onClose}
                        className="px-8 py-3 rounded-xl bg-gray-200 text-gray-600 font-bold uppercase tracking-widest text-xs hover:bg-gray-300 hover:text-gray-800 transition-colors shadow-sm"
                    >
                        Close Review
                    </button>
                </div>
            </motion.div>
        </div>
    );
};



export default ChecklistManager;
