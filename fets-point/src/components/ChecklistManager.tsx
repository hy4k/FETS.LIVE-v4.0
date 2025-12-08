import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ClipboardList,
    Plus,
    Search,
    Settings,
    Eye,
    Edit,
    Trash2,
    CheckCircle,
    CheckCircle2,
    XCircle,
    Clock,
    Calendar,
    User,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { ChecklistCreator } from './ChecklistCreator';
import { ViewChecklistModal } from './ViewChecklistModal';
import { EditChecklistModal } from './EditChecklistModal';

interface ChecklistTemplate {
    id: string;
    name: string;
    description: string;
    category: string;
    created_at: string;
    created_by: string;
    is_active: boolean;
    items_count?: number;
}

interface ChecklistInstance {
    id: string;
    template_id: string;
    name: string;
    category: string;
    exam_date: string;
    created_by: string;
    branch_location: string;
    completed_at: string | null;
    status?: string;
    created_at: string;
    template?: ChecklistTemplate;
    completed_by_profile?: any;
}

export function ChecklistManager() {
    const { profile } = useAuth();
    const [checklists, setChecklists] = useState<ChecklistTemplate[]>([]);
    const [checklistInstances, setChecklistInstances] = useState<ChecklistInstance[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterCategory, setFilterCategory] = useState<string>('all');
    const [showCreator, setShowCreator] = useState(false);
    const [viewingChecklist, setViewingChecklist] = useState<ChecklistTemplate | null>(null);
    const [editingChecklist, setEditingChecklist] = useState<ChecklistTemplate | null>(null);
    const [checklistItems, setChecklistItems] = useState<any[]>([]);
    const [viewingInstance, setViewingInstance] = useState<ChecklistInstance | null>(null);
    const [viewingInstanceItems, setViewingInstanceItems] = useState<any[]>([]);

    useEffect(() => {
        fetchChecklists();
        fetchChecklistInstances();
    }, []);

    const fetchChecklists = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('checklist_templates')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;

            const templatesWithCounts = await Promise.all(
                (data || []).map(async (template) => {
                    const { count } = await supabase
                        .from('checklist_template_items')
                        .select('*', { count: 'exact', head: true })
                        .eq('template_id', template.id);

                    return {
                        ...template,
                        items_count: count || 0
                    };
                })
            );

            setChecklists(templatesWithCounts);
        } catch (error: any) {
            console.error('Error fetching checklists:', error);
            toast.error('Failed to load checklists');
        } finally {
            setLoading(false);
        }
    };

    const fetchChecklistInstances = async () => {
        try {
            const { data, error } = await supabase
                .from('checklist_instances')
                .select(`
          *,
          template:checklist_templates(*)
        `)
                .order('created_at', { ascending: false })
                .limit(50);

            if (error) throw error;
            setChecklistInstances(data || []);
        } catch (error: any) {
            console.error('Error fetching checklist instances:', error);
        }
    };

    const deleteTemplate = async (id: string) => {
        try {
            const { data: instances, error: instancesError } = await supabase
                .from('checklist_instances')
                .select('id')
                .eq('template_id', id);

            if (instancesError) throw instancesError;

            if (instances && instances.length > 0) {
                toast.error(`Cannot delete template: ${instances.length} submitted checklist(s) exist. Deactivate it instead.`);
                return;
            }

            if (!confirm('Are you sure you want to delete this checklist template? This action cannot be undone.')) return;

            const { error: itemsError } = await supabase
                .from('checklist_template_items')
                .delete()
                .eq('template_id', id);

            if (itemsError) throw itemsError;

            const { error: templateError } = await supabase
                .from('checklist_templates')
                .delete()
                .eq('id', id);

            if (templateError) throw templateError;

            toast.success('Checklist template deleted successfully');
            fetchChecklists();
        } catch (error: any) {
            toast.error(`Failed to delete template: ${error.message || 'Unknown error'}`);
        }
    };

    const toggleTemplateStatus = async (id: string, currentStatus: boolean) => {
        try {
            const { error } = await supabase
                .from('checklist_templates')
                .update({ is_active: !currentStatus })
                .eq('id', id);

            if (error) throw error;
            toast.success(`Template ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
            fetchChecklists();
        } catch (error: any) {
            toast.error('Failed to update template');
        }
    };

    const handleViewChecklist = async (checklist: ChecklistTemplate) => {
        try {
            const { data, error } = await supabase
                .from('checklist_template_items')
                .select('*')
                .eq('template_id', checklist.id)
                .order('sort_order');

            if (error) throw error;
            setChecklistItems(data || []);
            setViewingChecklist(checklist);
        } catch (error: any) {
            toast.error('Failed to load checklist items');
        }
    };

    const handleEditChecklist = async (checklist: ChecklistTemplate) => {
        try {
            const { data, error } = await supabase
                .from('checklist_template_items')
                .select('*')
                .eq('template_id', checklist.id)
                .order('sort_order');

            if (error) throw error;
            setChecklistItems(data || []);
            setEditingChecklist(checklist);
        } catch (error: any) {
            toast.error('Failed to load checklist items');
        }
    };

    const handleViewInstance = async (instance: ChecklistInstance) => {
        try {
            const { data: items, error } = await supabase
                .from('checklist_instance_items')
                .select('*')
                .eq('instance_id', instance.id)
                .order('sort_order', { ascending: true });

            if (error) throw error;

            if (items && items.length > 0) {
                const userIds = items.filter(item => item.completed_by).map(item => item.completed_by);

                let profiles: any[] = [];
                if (userIds.length > 0) {
                    const { data: profilesData } = await supabase.from('staff_profiles').select('id, full_name, avatar_url').in('id', userIds);
                    profiles = profilesData || [];
                }

                const itemsWithProfiles = items.map(item => ({
                    ...item,
                    completed_by_profile: profiles.find(p => p.id === item.completed_by)
                }));

                setViewingInstanceItems(itemsWithProfiles);
                setViewingInstance(instance);
            } else {
                setViewingInstanceItems([]);
                setViewingInstance(instance);
            }
        } catch (error: any) {
            toast.error(error.message || 'Failed to load checklist');
        }
    };

    const categories = Array.from(new Set(checklists.filter(c => c && c.category).map(c => c.category)));

    const renderChecklistCard = (checklist: ChecklistTemplate) => {
        const categoryStyles = {
            'pre-exam': { gradient: 'from-emerald-500/20 via-green-500/20 to-teal-500/20', border: 'border-emerald-400/40', badge: 'bg-emerald-500/20 text-emerald-700', iconBg: 'bg-emerald-500' },
            'post-exam': { gradient: 'from-purple-500/20 via-violet-500/20 to-indigo-500/20', border: 'border-purple-400/40', badge: 'bg-purple-500/20 text-purple-700', iconBg: 'bg-purple-500' },
            'custom': { gradient: 'from-amber-500/20 via-orange-500/20 to-yellow-500/20', border: 'border-amber-400/40', badge: 'bg-amber-500/20 text-amber-700', iconBg: 'bg-amber-500' },
        };
        const style = categoryStyles[checklist.category as keyof typeof categoryStyles] || categoryStyles['custom'];

        return (
            <div key={checklist.id} className={`bg-white rounded-xl p-5 border shadow-sm hover:shadow-md transition-all ${style.border}`}>
                <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${style.iconBg} text-white shadow-sm`}>
                            <ClipboardList size={20} />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-800">{checklist.name}</h3>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${style.badge} border border-opacity-20`}>{checklist.category}</span>
                        </div>
                    </div>
                    <div className="flex gap-1">
                        <button onClick={() => toggleTemplateStatus(checklist.id, checklist.is_active)} className={`p-1.5 rounded-lg ${checklist.is_active ? 'text-green-600 hover:bg-green-50' : 'text-gray-400 hover:bg-gray-100'}`}>
                            {checklist.is_active ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
                        </button>
                        <button onClick={() => handleEditChecklist(checklist)} className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50">
                            <Edit size={18} />
                        </button>
                        {checklist.category === 'custom' && (
                            <button onClick={() => deleteTemplate(checklist.id)} className="p-1.5 rounded-lg text-red-600 hover:bg-red-50">
                                <Trash2 size={18} />
                            </button>
                        )}
                    </div>
                </div>
                <p className="text-sm text-gray-500 line-clamp-2 mb-4 h-10">{checklist.description || 'No description provided.'}</p>

                <div className="flex items-center justify-between text-xs text-gray-400 mt-2 pt-3 border-t border-gray-100">
                    <span className="flex items-center gap-1"><ClipboardList size={12} /> {checklist.items_count} Items</span>
                    <span className="flex items-center gap-1"><Calendar size={12} /> {new Date(checklist.created_at).toLocaleDateString()}</span>
                    <button onClick={() => handleViewChecklist(checklist)} className="text-blue-600 font-medium hover:text-blue-800">Preview</button>
                </div>
            </div>
        );
    };

    return (
        <div>
            {/* Header Actions */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex gap-4 flex-1">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search templates..."
                            className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <select
                        className="px-4 py-2 rounded-xl border border-gray-200 bg-white"
                        value={filterCategory}
                        onChange={e => setFilterCategory(e.target.value)}
                    >
                        <option value="all">All Categories</option>
                        {categories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>
                <button
                    onClick={() => setShowCreator(true)}
                    className="px-4 py-2 bg-gradient-to-r from-amber-500 to-yellow-600 text-white rounded-xl font-bold hover:shadow-lg transition-all flex items-center gap-2"
                >
                    <Plus size={18} /> New Checklist
                </button>
            </div>

            {/* Templates Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12">
                {checklists
                    .filter(c =>
                        (filterCategory === 'all' || c.category === filterCategory) &&
                        (c.name.toLowerCase().includes(searchQuery.toLowerCase()))
                    )
                    .map(renderChecklistCard)
                }
            </div>

            {/* Recent Activity Table */}
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <h3 className="font-bold text-gray-800">Recent Submissions</h3>
                    <span className="text-xs font-medium text-gray-500">Last 50 records</span>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200 text-xs text-gray-500 uppercase tracking-wider text-left">
                            <tr>
                                <th className="px-6 py-3">Template</th>
                                <th className="px-6 py-3">Exam Date</th>
                                <th className="px-6 py-3">Branch</th>
                                <th className="px-6 py-3">Status</th>
                                <th className="px-6 py-3 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {checklistInstances.map(instance => (
                                <tr key={instance.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-3 font-medium text-gray-800">{instance.template?.name || instance.name}</td>
                                    <td className="px-6 py-3 text-sm text-gray-600">{new Date(instance.exam_date).toLocaleDateString()}</td>
                                    <td className="px-6 py-3 text-sm capitalize">{instance.branch_location}</td>
                                    <td className="px-6 py-3">
                                        <span className={`px-2 py-1 rounded-md text-xs font-bold ${instance.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                            {instance.status.toUpperCase()}
                                        </span>
                                    </td>
                                    <td className="px-6 py-3 text-right">
                                        <button onClick={() => handleViewInstance(instance)} className="text-blue-600 hover:text-blue-800 font-medium text-sm">View</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modals */}
            <ChecklistCreator isOpen={showCreator} onClose={() => setShowCreator(false)} onSuccess={() => { fetchChecklists(); fetchChecklistInstances(); }} />
            {viewingChecklist && <ViewChecklistModal isOpen={!!viewingChecklist} onClose={() => setViewingChecklist(null)} checklist={viewingChecklist} items={checklistItems} />}
            {editingChecklist && <EditChecklistModal isOpen={!!editingChecklist} onClose={() => setEditingChecklist(null)} checklist={editingChecklist} items={checklistItems} onSuccess={() => { fetchChecklists(); setEditingChecklist(null); }} />}

            {viewingInstance && (
                <AnimatePresence>
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setViewingInstance(null)}>
                        <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="bg-white rounded-2xl max-w-3xl w-full max-h-[85vh] overflow-hidden shadow-2xl flex flex-col" onClick={e => e.stopPropagation()}>
                            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                                <div>
                                    <h2 className="text-xl font-bold text-gray-800">{viewingInstance.name}</h2>
                                    <p className="text-sm text-gray-500">Submitted: {new Date(viewingInstance.created_at).toLocaleString()}</p>
                                </div>
                                <button onClick={() => setViewingInstance(null)} className="p-2 hover:bg-gray-200 rounded-full"><XCircle /></button>
                            </div>
                            <div className="flex-1 overflow-y-auto p-6 space-y-4">
                                {viewingInstanceItems.map((item, idx) => (
                                    <div key={idx} className={`p-4 rounded-xl border ${item.is_completed ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'}`}>
                                        <div className="flex gap-3">
                                            <div className="mt-0.5">{item.is_completed ? <CheckCircle2 className="text-green-600" /> : <XCircle className="text-red-500" />}</div>
                                            <div className="flex-1">
                                                <h4 className="font-bold text-gray-800">{item.title}</h4>
                                                {item.description && <p className="text-sm text-gray-600 mt-1">{item.description}</p>}
                                                {item.notes && <div className="mt-2 text-sm bg-white/50 p-2 rounded border border-black/5 font-medium">Note: {item.notes}</div>}
                                                {item.completed_by_profile && <div className="mt-2 text-xs text-gray-500">By: {item.completed_by_profile.full_name}</div>}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="p-4 bg-gray-50 border-t border-gray-100 text-right">
                                <button onClick={() => setViewingInstance(null)} className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg font-bold text-gray-700">Close</button>
                            </div>
                        </motion.div>
                    </motion.div>
                </AnimatePresence>
            )}
        </div>
    );
}
