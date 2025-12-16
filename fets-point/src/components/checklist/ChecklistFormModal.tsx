import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { X, Save, Clock, User, Calendar } from 'lucide-react';
import { ChecklistTemplate, ChecklistSubmission } from '../../types/checklist';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

interface ChecklistFormModalProps {
    template: ChecklistTemplate;
    onClose: () => void;
    currentUser: any;
}

export const ChecklistFormModal: React.FC<ChecklistFormModalProps> = ({ template, onClose, currentUser }) => {
    const { register, control, handleSubmit, formState: { errors } } = useForm();
    const [submitting, setSubmitting] = useState(false);

    const neumorphicClass = "bg-[#e0e5ec] shadow-[9px_9px_16px_rgb(163,177,198,0.6),-9px_-9px_16px_rgba(255,255,255,0.5)] rounded-xl border border-white/20";
    const neumorphicInset = "bg-[#e0e5ec] shadow-[inset_6px_6px_10px_0_rgba(163,177,198,0.7),inset_-6px_-6px_10px_0_rgba(255,255,255,0.8)] rounded-xl border-none";
    const neumorphicBtn = "px-6 py-2 rounded-xl font-medium transition-all active:scale-95 active:shadow-[inset_4px_4px_8px_rgba(163,177,198,0.6),inset_-4px_-4px_8px_rgba(255,255,255,0.5)] shadow-[6px_6px_10px_rgba(163,177,198,0.6),-6px_-6px_10px_rgba(255,255,255,0.5)] bg-[#e0e5ec] text-gray-700 hover:text-blue-600";

    const onSubmit = async (data: any) => {
        setSubmitting(true);
        try {
            // Validate time constraints if needed (Pre-exam cutoff, Post-exam start)
            // For now, just submit.

            const submission: Partial<ChecklistSubmission> = {
                template_id: template.id,
                submitted_by: currentUser.id,
                branch_id: currentUser.branch_id || null, // Assuming branch_id is on user profile
                submitted_at: new Date().toISOString(),
                answers: data,
                status: 'submitted'
            };

            const { error } = await supabase
                .from('checklist_submissions' as any)
                .insert(submission);

            if (error) throw error;

            toast.success('Checklist submitted successfully!');
            onClose();
        } catch (error) {
            console.error('Error submitting checklist:', error);
            toast.error('Failed to submit checklist');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <div className={`w-full max-w-4xl max-h-[90vh] overflow-y-auto ${neumorphicClass} relative animate-in fade-in zoom-in duration-300`}>

                {/* Header */}
                <div className="sticky top-0 z-10 bg-[#e0e5ec]/90 backdrop-blur-md p-6 border-b border-gray-200/50 flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-700">{template.title}</h2>
                        <p className="text-gray-500 text-sm">{template.description}</p>
                    </div>
                    <button onClick={onClose} className={`${neumorphicBtn} text-red-500`}>
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="p-8 space-y-8">

                    {/* Metadata Banner */}
                    <div className={`p-4 ${neumorphicInset} grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600`}>
                        <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-blue-500" />
                            <span className="font-semibold">Staff:</span> {currentUser?.full_name || 'Unknown'}
                        </div>
                        <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-green-500" />
                            <span className="font-semibold">Date:</span> {new Date().toLocaleDateString()}
                        </div>
                        <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-orange-500" />
                            <span className="font-semibold">Time:</span> {new Date().toLocaleTimeString()}
                        </div>
                    </div>

                    {/* Questions */}
                    <div className="space-y-6">
                        {template.questions.map((q, idx) => (
                            <div key={q.id} className={`p-6 ${neumorphicClass}`}>
                                <label className="block text-gray-700 font-bold mb-2 text-lg">
                                    <span className="text-gray-400 mr-2">#{idx + 1}</span>
                                    {q.text} {q.required && <span className="text-red-500">*</span>}
                                </label>
                                {q.description && <p className="text-sm text-gray-500 mb-4">{q.description}</p>}

                                {q.type === 'text' && (
                                    <input
                                        {...register(q.id, { required: q.required })}
                                        className={`w-full p-3 ${neumorphicInset} outline-none bg-transparent focus:shadow-[inset_2px_2px_5px_rgba(0,0,0,0.1)] transition-shadow`}
                                        placeholder="Enter your answer..."
                                    />
                                )}

                                {q.type === 'number' && (
                                    <input
                                        type="number"
                                        {...register(q.id, { required: q.required })}
                                        className={`w-full p-3 ${neumorphicInset} outline-none bg-transparent`}
                                        placeholder="0"
                                    />
                                )}

                                {q.type === 'checkbox' && (
                                    <label className="flex items-center space-x-3 cursor-pointer p-2 rounded-lg hover:bg-white/30 transition-colors">
                                        <input
                                            type="checkbox"
                                            {...register(q.id, { required: q.required })}
                                            className="w-6 h-6 accent-blue-500 rounded focus:ring-blue-500"
                                        />
                                        <span className="text-gray-700">Mark as completed</span>
                                    </label>
                                )}

                                {q.type === 'yes_no' && (
                                    <div className="flex space-x-6">
                                        <label className="flex items-center space-x-2 cursor-pointer">
                                            <input
                                                type="radio"
                                                value="yes"
                                                {...register(q.id, { required: q.required })}
                                                className="w-5 h-5 accent-green-500"
                                            />
                                            <span className="text-gray-700 font-medium">Yes</span>
                                        </label>
                                        <label className="flex items-center space-x-2 cursor-pointer">
                                            <input
                                                type="radio"
                                                value="no"
                                                {...register(q.id, { required: q.required })}
                                                className="w-5 h-5 accent-red-500"
                                            />
                                            <span className="text-gray-700 font-medium">No</span>
                                        </label>
                                    </div>
                                )}

                                {(q.type === 'dropdown') && (
                                    <select
                                        {...register(q.id, { required: q.required })}
                                        className={`w-full p-3 ${neumorphicInset} outline-none bg-transparent`}
                                    >
                                        <option value="">Select an option...</option>
                                        {q.options?.map((opt, i) => (
                                            <option key={i} value={opt}>{opt}</option>
                                        ))}
                                    </select>
                                )}

                                {q.type === 'radio' && (
                                    <div className="space-y-2">
                                        {q.options?.map((opt, i) => (
                                            <label key={i} className="flex items-center space-x-2 cursor-pointer">
                                                <input
                                                    type="radio"
                                                    value={opt}
                                                    {...register(q.id, { required: q.required })}
                                                    className="w-5 h-5 accent-blue-500"
                                                />
                                                <span className="text-gray-700">{opt}</span>
                                            </label>
                                        ))}
                                    </div>
                                )}

                                {q.type === 'date' && (
                                    <input
                                        type="date"
                                        {...register(q.id, { required: q.required })}
                                        className={`p-3 ${neumorphicInset} outline-none bg-transparent`}
                                    />
                                )}

                                {errors[q.id] && <span className="text-red-500 text-sm mt-2 block">This field is required</span>}
                            </div>
                        ))}
                    </div>

                    <div className="flex justify-end pt-6 border-t border-gray-200/50">
                        <button
                            type="submit"
                            disabled={submitting}
                            className={`${neumorphicBtn} bg-blue-50 text-blue-600 text-lg px-8 py-3 w-full md:w-auto flex justify-center items-center`}
                        >
                            {submitting ? 'Submitting...' : (
                                <>
                                    <Save className="w-6 h-6 mr-2" /> Submit Checklist
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
