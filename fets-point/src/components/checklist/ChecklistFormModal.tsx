import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { X, Save, ClipboardCheck, AlertCircle, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChecklistTemplate } from '../../types/checklist';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

interface ChecklistFormModalProps {
    template: ChecklistTemplate;
    onClose: () => void;
    onSuccess?: () => void;
    currentUser: any;
    overrideStaff?: { id: string; name: string };
    overrideBranch?: string;
}

export const ChecklistFormModal: React.FC<ChecklistFormModalProps> = ({ template, onClose, onSuccess, currentUser, overrideStaff, overrideBranch }) => {
    const { register, handleSubmit, formState: { errors }, watch } = useForm();
    const [submitting, setSubmitting] = useState(false);

    const questions = template.questions || [];

    // Modern Professional Styles
    const cardStyle = "bg-white/80 backdrop-blur-md border border-slate-200 shadow-sm rounded-2xl overflow-hidden";
    const inputStyle = "w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-slate-700 font-medium";
    const labelStyle = "text-sm font-semibold text-slate-700 flex items-center gap-2";
    const questionContainer = "p-6 border-b border-slate-100 last:border-0 hover:bg-slate-50/50 transition-colors";

    const onSubmit = async (data: any) => {
        setSubmitting(true);
        try {
            const submission = {
                template_id: template.id,
                submitted_by: overrideStaff?.id || currentUser.user_id || currentUser.id,
                branch_id: overrideBranch || currentUser.branch_assigned || currentUser.branch_id || null,
                submitted_at: new Date().toISOString(),
                answers: data,
                status: 'submitted'
            };

            const { error } = await supabase
                .from('checklist_submissions')
                .insert(submission);

            if (error) throw error;

            toast.success('Protocol execution recorded.');
            if (onSuccess) onSuccess();
            onClose();
        } catch (error: any) {
            console.error('Submission error:', error);
            toast.error(error.message || 'Failed to record protocol.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="w-full max-w-3xl max-h-[90vh] flex flex-col bg-slate-50 rounded-[2rem] shadow-2xl overflow-hidden border border-white"
            >
                {/* Fixed Header */}
                <div className="p-8 bg-white border-b border-slate-200 flex items-start justify-between">
                    <div className="flex gap-5">
                        <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-sm">
                            <ClipboardCheck size={28} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-slate-800 tracking-tight">{template.title}</h2>
                            <p className="text-slate-500 text-sm mt-1 font-medium">{template.description || "System Verification Protocol"}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-3 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-all active:scale-95"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Scrollable Form Content */}
                <div className="flex-1 overflow-y-auto p-2 scrollbar-hide">
                    <form id="checklist-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4 p-4">
                        <div className={cardStyle}>
                            {questions.map((q, idx) => (
                                <div key={q.id || idx} className={questionContainer}>
                                    <div className="flex gap-4">
                                        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 text-xs font-bold border border-slate-200">
                                            {(idx + 1).toString().padStart(2, '0')}
                                        </div>
                                        <div className="flex-1 space-y-4">
                                            <div>
                                                <h3 className="text-base font-semibold text-slate-800 leading-snug">
                                                    {q.text} {q.required && <span className="text-rose-500 ml-1 font-bold">*</span>}
                                                </h3>
                                                {q.description && (
                                                    <p className="text-xs text-slate-500 mt-1.5 font-medium leading-relaxed italic">{q.description}</p>
                                                )}
                                            </div>

                                            {/* Input Controls */}
                                            <div className="mt-4">
                                                {q.type === 'text' && (
                                                    <input
                                                        type="text"
                                                        {...register(q.id, { required: q.required })}
                                                        className={inputStyle}
                                                        placeholder="Enter your response..."
                                                    />
                                                )}

                                                {q.type === 'textarea' && (
                                                    <textarea
                                                        {...register(q.id, { required: q.required })}
                                                        rows={3}
                                                        className={inputStyle}
                                                        placeholder="Provide detailed information..."
                                                    />
                                                )}

                                                {q.type === 'number' && (
                                                    <div className="max-w-[200px]">
                                                        <input
                                                            type="number"
                                                            step="any"
                                                            {...register(q.id, { required: q.required })}
                                                            className={inputStyle}
                                                            placeholder="0.00"
                                                        />
                                                    </div>
                                                )}

                                                {q.type === 'checkbox' && (
                                                    <label className="flex items-center gap-3 cursor-pointer group">
                                                        <div className="relative flex items-center">
                                                            <input
                                                                type="checkbox"
                                                                {...register(q.id, { required: q.required })}
                                                                className="w-6 h-6 rounded-lg border-2 border-slate-300 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-0 transition-all cursor-pointer"
                                                            />
                                                        </div>
                                                        <span className="text-sm font-semibold text-slate-600 group-hover:text-slate-900 transition-colors">Confirmed and Verified</span>
                                                    </label>
                                                )}

                                                {q.type === 'radio' && (
                                                    <div className="flex flex-wrap gap-3">
                                                        {q.options?.map((opt, i) => (
                                                            <label key={i} className={`flex items-center gap-2.5 px-5 py-2.5 rounded-xl border-2 transition-all cursor-pointer ${watch(q.id) === opt ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-sm' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'}`}>
                                                                <input
                                                                    type="radio"
                                                                    value={opt}
                                                                    {...register(q.id, { required: q.required })}
                                                                    className="hidden"
                                                                />
                                                                {watch(q.id) === opt ? <CheckCircle2 size={16} /> : <div className="w-4 h-4 rounded-full border-2 border-slate-300" />}
                                                                <span className="text-sm font-bold tracking-tight">{opt}</span>
                                                            </label>
                                                        ))}
                                                    </div>
                                                )}

                                                {q.type === 'dropdown' && (
                                                    <select
                                                        {...register(q.id, { required: q.required })}
                                                        className={inputStyle}
                                                    >
                                                        <option value="">Select an option...</option>
                                                        {q.options?.map((opt, i) => (
                                                            <option key={i} value={opt}>{opt}</option>
                                                        ))}
                                                    </select>
                                                )}

                                                {q.type === 'date' && (
                                                    <input
                                                        type="date"
                                                        {...register(q.id, { required: q.required })}
                                                        className={inputStyle}
                                                    />
                                                )}
                                            </div>

                                            <AnimatePresence>
                                                {errors[q.id] && (
                                                    <motion.div
                                                        initial={{ opacity: 0, height: 0 }}
                                                        animate={{ opacity: 1, height: 'auto' }}
                                                        exit={{ opacity: 0, height: 0 }}
                                                        className="flex items-center gap-1.5 text-rose-500 mt-2"
                                                    >
                                                        <AlertCircle size={14} />
                                                        <span className="text-[10px] font-bold uppercase tracking-wider">Required Field</span>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </form>
                </div>

                {/* Fixed Footer */}
                <div className="p-8 bg-white border-t border-slate-200">
                    <div className="flex items-center justify-between">
                        <div className="hidden md:block">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Operator Verification Required</p>
                            <p className="text-slate-500 text-sm font-semibold">{overrideStaff?.name || currentUser.full_name || currentUser.username}</p>
                        </div>
                        <div className="flex gap-4 w-full md:w-auto">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 md:flex-none px-8 py-3.5 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition-all border border-slate-200 active:scale-95"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                form="checklist-form"
                                disabled={submitting}
                                className="flex-1 md:flex-none px-10 py-3.5 rounded-xl font-bold bg-indigo-600 text-white shadow-lg shadow-indigo-200 hover:bg-indigo-700 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {submitting ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <Save size={18} />
                                        Complete Entry
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};
