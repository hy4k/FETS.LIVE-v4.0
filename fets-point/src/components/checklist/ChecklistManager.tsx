import React, { useState, useEffect } from 'react';
import { Plus, List, History, Trash2, Edit, Power, CheckCircle, XCircle } from 'lucide-react';
import { ChecklistCreator } from './ChecklistCreator';
import { ChecklistTemplate } from '../../types/checklist';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

interface ChecklistManagerProps {
    currentUser: any;
}

export const ChecklistManager: React.FC<ChecklistManagerProps> = ({ currentUser }) => {
    const [view, setView] = useState<'list' | 'create' | 'history'>('list');
    const [templates, setTemplates] = useState<ChecklistTemplate[]>([]);
    const [loading, setLoading] = useState(true);

    const neumorphicClass = "bg-[#e0e5ec] shadow-[9px_9px_16px_rgb(163,177,198,0.6),-9px_-9px_16px_rgba(255,255,255,0.5)] rounded-xl border border-white/20";
    const neumorphicBtn = "px-4 py-2 rounded-xl font-medium transition-all active:scale-95 active:shadow-[inset_4px_4px_8px_rgba(163,177,198,0.6),inset_-4px_-4px_8px_rgba(255,255,255,0.5)] shadow-[6px_6px_10px_rgba(163,177,198,0.6),-6px_-6px_10px_rgba(255,255,255,0.5)] bg-[#e0e5ec] text-gray-700 hover:text-blue-600";
    const neumorphicInset = "bg-[#e0e5ec] shadow-[inset_6px_6px_10px_0_rgba(163,177,198,0.7),inset_-6px_-6px_10px_0_rgba(255,255,255,0.8)] rounded-xl";

    useEffect(() => {
        fetchTemplates();
    }, [view]);

    const fetchTemplates = async () => {
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
    };

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
        }
    };

    const deleteTemplate = async (id: string) => {
        if (!confirm('Are you sure you want to delete this checklist? This action cannot be undone.')) return;

        const { error } = await supabase
            .from('checklist_templates' as any)
            .delete()
            .eq('id', id);

        if (error) {
            toast.error('Failed to delete checklist');
        } else {
            toast.success('Checklist deleted');
            fetchTemplates();
        }
    };

    if (view === 'create') {
        return <ChecklistCreator onCancel={() => setView('list')} onSuccess={() => setView('list')} currentUser={currentUser} />;
    }

    return (
        <div className="space-y-8">
            {/* Header Controls */}
            <div className={`p-6 ${neumorphicClass} flex flex-col md:flex-row justify-between items-center gap-4`}>
                <div>
                    <h2 className="text-2xl font-bold text-gray-700">Checklist Management Protocols</h2>
                    <p className="text-gray-500">Manage operational protocols and compliance</p>
                </div>
                <div className="flex space-x-4">
                    <button
                        onClick={() => setView('list')}
                        className={`${neumorphicBtn} ${view === 'list' ? 'text-blue-600 shadow-[inset_4px_4px_8px_rgba(163,177,198,0.6),inset_-4px_-4px_8px_rgba(255,255,255,0.5)]' : ''}`}
                    >
                        <List className="w-5 h-5 mr-2 inline" /> Manage
                    </button>
                    <button
                        onClick={() => setView('history')}
                        className={`${neumorphicBtn} ${view === 'history' ? 'text-blue-600 shadow-[inset_4px_4px_8px_rgba(163,177,198,0.6),inset_-4px_-4px_8px_rgba(255,255,255,0.5)]' : ''}`}
                    >
                        <History className="w-5 h-5 mr-2 inline" /> History
                    </button>
                    <button onClick={() => setView('create')} className={`${neumorphicBtn} text-green-600`}>
                        <Plus className="w-5 h-5 mr-2 inline" /> Create New
                    </button>
                </div>
            </div>

            {view === 'list' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {loading ? (
                        <div className="col-span-full text-center py-12 text-gray-500">Loading checklists...</div>
                    ) : templates.length === 0 ? (
                        <div className="col-span-full text-center py-12 text-gray-500 border-2 border-dashed border-gray-300 rounded-xl">
                            No checklists found. Create one to get started.
                        </div>
                    ) : (
                        templates.map(template => (
                            <div key={template.id} className={`p-6 ${neumorphicClass} relative group transition-all hover:-translate-y-1`}>
                                <div className="flex justify-between items-start mb-4">
                                    <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${template.type === 'pre_exam' ? 'bg-blue-100 text-blue-600' :
                                        template.type === 'post_exam' ? 'bg-purple-100 text-purple-600' :
                                            'bg-orange-100 text-orange-600'
                                        }`}>
                                        {template.type.replace('_', ' ')}
                                    </div>
                                    <div className="flex space-x-2">
                                        <button
                                            onClick={() => toggleStatus(template.id, template.is_active)}
                                            title={template.is_active ? "Disable" : "Enable"}
                                            className={`p-2 rounded-full transition-colors ${template.is_active ? 'text-green-500 hover:bg-green-50' : 'text-gray-400 hover:bg-gray-100'}`}
                                        >
                                            <Power className="w-5 h-5" />
                                        </button>
                                        <button
                                            onClick={() => deleteTemplate(template.id)}
                                            className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>

                                <h3 className="text-xl font-bold text-gray-700 mb-2">{template.title}</h3>
                                <p className="text-gray-500 text-sm mb-4 line-clamp-2">{template.description || 'No description provided.'}</p>

                                <div className="flex justify-between items-center text-sm text-gray-400 mt-4 pt-4 border-t border-gray-200">
                                    <span>{template.questions.length} Questions</span>
                                    <span>{new Date(template.created_at).toLocaleDateString()}</span>
                                </div>

                                {!template.is_active && (
                                    <div className="absolute inset-0 bg-gray-200/50 backdrop-blur-[1px] rounded-xl flex items-center justify-center">
                                        <span className="bg-white/80 px-4 py-2 rounded-lg font-bold text-gray-500 shadow-sm">DISABLED</span>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            )}

            {view === 'history' && (
                <div className={`p-6 ${neumorphicClass} min-h-[400px] flex items-center justify-center text-gray-500`}>
                    Checklist History Module (Coming Soon)
                </div>
            )}
        </div>
    );
};
