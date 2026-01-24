import React, { useState } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { Plus, Trash2, Eye, Save, X, GripVertical } from 'lucide-react';
import { ChecklistTemplate, QuestionType } from '../../types/checklist';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

interface ChecklistCreatorProps {
    onCancel: () => void;
    onSuccess: () => void;
    currentUser: any;
    initialData?: ChecklistTemplate | null;
}

const QUESTION_TYPES: { value: QuestionType; label: string }[] = [
    { value: 'checkbox', label: 'Checkbox' },
    { value: 'text', label: 'Text Input' },
    { value: 'number', label: 'Number Input' },
    { value: 'dropdown', label: 'Dropdown' },
    { value: 'radio', label: 'Radio Button' },
    { value: 'date', label: 'Date Picker' },
    { value: 'time', label: 'Time Input' },
    { value: 'textarea', label: 'Detailed Text Area' },
];

export const ChecklistCreator: React.FC<ChecklistCreatorProps> = ({ onCancel, onSuccess, currentUser, initialData }) => {
    const [isPreviewMode, setIsPreviewMode] = useState(false);
    const { register, control, handleSubmit, watch, formState: { errors } } = useForm<ChecklistTemplate>({
        defaultValues: {
            title: initialData?.title || '',
            description: initialData?.description || '',
            type: initialData?.type || 'custom',
            questions: initialData?.questions || [],
            is_active: initialData?.is_active ?? true,
            branch_location: initialData?.branch_location || 'global',
        }
    });

    const { fields, append, remove, move } = useFieldArray({
        control,
        name: 'questions',
    });

    const watchType = watch('type');

    const onSubmit = async (data: ChecklistTemplate) => {
        try {
            if (initialData?.id) {
                // Update existing
                const { error } = await supabase
                    .from('checklist_templates' as any)
                    .update({
                        title: data.title,
                        description: data.description,
                        type: data.type,
                        questions: data.questions,
                        is_active: data.is_active,
                        branch_location: data.branch_location,
                    })
                    .eq('id', initialData.id);

                if (error) throw error;
                toast.success('Checklist updated successfully!');
            } else {
                // Create new
                const { error } = await supabase
                    .from('checklist_templates' as any)
                    .insert({
                        title: data.title,
                        description: data.description,
                        type: data.type,
                        questions: data.questions,
                        is_active: data.is_active,
                        branch_location: data.branch_location || 'global',
                        created_by: currentUser.user_id,
                    });

                if (error) throw error;
                toast.success('Checklist created successfully!');
            }
            onSuccess();
        } catch (error) {
            console.error('Error saving checklist:', error);
            toast.error('Failed to save checklist');
        }
    };

    const neumorphicClass = "bg-[#e0e5ec] shadow-[9px_9px_16px_rgb(163,177,198,0.6),-9px_-9px_16px_rgba(255,255,255,0.5)] rounded-xl border border-white/20";
    const neumorphicInset = "bg-[#e0e5ec] shadow-[inset_6px_6px_10px_0_rgba(163,177,198,0.7),inset_-6px_-6px_10px_0_rgba(255,255,255,0.8)] rounded-xl border-none";
    const neumorphicBtn = "px-6 py-2 rounded-xl font-medium transition-all active:scale-95 active:shadow-[inset_4px_4px_8px_rgba(163,177,198,0.6),inset_-4px_-4px_8px_rgba(255,255,255,0.5)] shadow-[6px_6px_10px_rgba(163,177,198,0.6),-6px_-6px_10px_rgba(255,255,255,0.5)] bg-[#e0e5ec] text-gray-700 hover:text-blue-600";

    if (isPreviewMode) {
        return (
            <div className={`p-8 ${neumorphicClass} max-w-4xl mx-auto`}>
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-700">Preview: {watch('title')}</h2>
                    <button onClick={() => setIsPreviewMode(false)} className={neumorphicBtn}>
                        <X className="w-5 h-5 mr-2 inline" /> Exit Preview
                    </button>
                </div>
                <div className="space-y-6">
                    {/* Render questions as they would appear */}
                    {watch('questions').map((q, idx) => (
                        <div key={idx} className={`p-6 ${neumorphicClass}`}>
                            <label className="block text-gray-700 font-semibold mb-2">
                                {q.text} {q.required && <span className="text-red-500">*</span>}
                            </label>
                            {q.description && <p className="text-sm text-gray-500 mb-3">{q.description}</p>}

                            {q.type === 'text' && <input type="text" className={`w-full p-3 ${neumorphicInset} outline-none`} placeholder="Enter text..." disabled />}
                            {q.type === 'number' && <input type="number" className={`w-full p-3 ${neumorphicInset} outline-none`} placeholder="0" disabled />}
                            {q.type === 'checkbox' && <div className="flex items-center"><input type="checkbox" className="w-5 h-5 mr-2" disabled /> <span className="text-gray-600">Check this box</span></div>}

                            {(q.type === 'dropdown' || q.type === 'radio') && (
                                <div className="space-y-2">
                                    {q.options?.map((opt, i) => (
                                        <div key={i} className="text-gray-600">• {opt}</div>
                                    ))}
                                </div>
                            )}
                            {q.type === 'date' && <input type="date" className={`p-3 ${neumorphicInset} outline-none`} disabled />}
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className={`p-8 ${neumorphicClass} max-w-5xl mx-auto bg-[#e0e5ec]`}>
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-3xl font-bold text-gray-700">Create New Checklist</h2>
                    <p className="text-gray-500 mt-1">Design a new protocol for your team</p>
                </div>
                <div className="flex space-x-4">
                    <button onClick={() => setIsPreviewMode(true)} className={`${neumorphicBtn} text-blue-600`}>
                        <Eye className="w-5 h-5 mr-2 inline" /> Preview
                    </button>
                    <button onClick={onCancel} className={`${neumorphicBtn} text-red-500`}>
                        <X className="w-5 h-5 mr-2 inline" /> Cancel
                    </button>
                </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                {/* Metadata Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-gray-700 font-medium mb-2">Created By</label>
                            <div className={`p-3 ${neumorphicInset} text-gray-500`}>
                                {currentUser?.full_name || 'Unknown User'} ({currentUser?.department || 'Staff'})
                            </div>
                        </div>
                        <div>
                            <label className="block text-gray-700 font-medium mb-2">Date</label>
                            <div className={`p-3 ${neumorphicInset} text-gray-500`}>
                                {new Date().toLocaleDateString()}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-gray-700 font-medium mb-2">Checklist Type</label>
                            <select {...register('type')} className={`w-full p-3 ${neumorphicInset} outline-none bg-transparent`}>
                                <option value="pre_exam">Pre-Exam Checklist</option>
                                <option value="post_exam">Post-Exam Checklist</option>
                                <option value="custom">Custom Checklist</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-gray-700 font-medium mb-2">Branch / Centre</label>
                            <select {...register('branch_location')} className={`w-full p-3 ${neumorphicInset} outline-none bg-transparent`}>
                                <option value="global">Global (All Centres)</option>
                                <option value="cochin">Cochin</option>
                                <option value="calicut">Calicut</option>
                                <option value="kannur">Kannur</option>
                                <option value="trivandrum">Trivandrum</option>
                            </select>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-gray-700 font-medium mb-2">Checklist Name</label>
                            <input {...register('title', { required: true })} className={`w-full p-3 ${neumorphicInset} outline-none bg-transparent`} placeholder="e.g., Morning Opening Protocol" />
                            {errors.title && <span className="text-red-500 text-sm">Required</span>}
                        </div>
                        <div>
                            <label className="block text-gray-700 font-medium mb-2">Status</label>
                            <select {...register('is_active')} className={`w-full p-3 ${neumorphicInset} outline-none bg-transparent`} defaultValue="true">
                                <option value="true">Active</option>
                                <option value="false">Inactive</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div>
                    <label className="block text-gray-700 font-medium mb-2">Description</label>
                    <textarea {...register('description')} className={`w-full p-3 ${neumorphicInset} outline-none bg-transparent h-24`} placeholder="Briefly describe the purpose of this checklist..." />
                </div>

                {/* Questions Builder */}
                <div className="mt-8">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-bold text-gray-700">Questions</h3>
                        <button
                            type="button"
                            onClick={() => append({ id: crypto.randomUUID(), text: '', type: 'checkbox', required: false, options: [] })}
                            className={`${neumorphicBtn} bg-blue-50 text-blue-600`}
                        >
                            <Plus className="w-5 h-5 mr-2 inline" /> Add Question
                        </button>
                    </div>

                    <div className="space-y-6">
                        {fields.map((field, index) => (
                            <div key={field.id} className={`p-6 ${neumorphicClass} relative group transition-all hover:scale-[1.01]`}>
                                <div className="absolute right-4 top-4 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button type="button" onClick={() => remove(index)} className="text-red-500 hover:text-red-700 p-2">
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                                    <div className="md:col-span-1 flex justify-center pt-3 text-gray-400 cursor-move">
                                        <GripVertical className="w-6 h-6" />
                                    </div>

                                    <div className="md:col-span-11 space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div className="md:col-span-2">
                                                <input
                                                    {...register(`questions.${index}.text` as const, { required: true })}
                                                    placeholder="Question Text"
                                                    className={`w-full p-3 ${neumorphicInset} outline-none bg-transparent`}
                                                />
                                            </div>
                                            <div>
                                                <select
                                                    {...register(`questions.${index}.type` as const)}
                                                    className={`w-full p-3 ${neumorphicInset} outline-none bg-transparent`}
                                                >
                                                    {QUESTION_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                                                </select>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <input
                                                    {...register(`questions.${index}.section` as const)}
                                                    placeholder="Section Name (e.g., DVR Verification)"
                                                    className={`w-full p-3 ${neumorphicInset} outline-none bg-transparent text-sm`}
                                                />
                                            </div>
                                            <div>
                                                <select
                                                    {...register(`questions.${index}.attachment_mode` as const)}
                                                    className={`w-full p-3 ${neumorphicInset} outline-none bg-transparent text-sm`}
                                                >
                                                    <option value="none">No Attachment</option>
                                                    <option value="optional">Attachment Optional</option>
                                                    <option value="required">Attachment Required</option>
                                                </select>
                                            </div>
                                        </div>

                                        <div className="flex items-center space-x-4">
                                            <label className="flex items-center space-x-2 text-gray-600 cursor-pointer select-none">
                                                <input type="checkbox" {...register(`questions.${index}.required` as const)} className="w-4 h-4 accent-blue-500" />
                                                <span>Required</span>
                                            </label>
                                        </div>

                                        {/* Options for Dropdown/Radio */}
                                        {(watch(`questions.${index}.type`) === 'dropdown' || watch(`questions.${index}.type`) === 'radio') && (
                                            <div className="pl-4 border-l-2 border-gray-300">
                                                <label className="block text-sm text-gray-500 mb-1">Options (comma separated)</label>
                                                <Controller
                                                    control={control}
                                                    name={`questions.${index}.options` as const}
                                                    render={({ field: { onChange, value } }) => (
                                                        <input
                                                            className={`w-full p-2 ${neumorphicInset} outline-none bg-transparent text-sm`}
                                                            placeholder="Option 1, Option 2, Option 3"
                                                            value={value?.join(', ') || ''}
                                                            onChange={(e) => onChange(e.target.value.split(',').map(s => s.trim()))}
                                                        />
                                                    )}
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}

                        {fields.length === 0 && (
                            <div className="text-center py-12 text-gray-400 border-2 border-dashed border-gray-300 rounded-xl">
                                No questions added yet. Click "Add Question" to start.
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex justify-end pt-8">
                    <button type="submit" className={`${neumorphicBtn} bg-green-50 text-green-600 text-lg px-8 py-3`}>
                        <Save className="w-6 h-6 mr-2 inline" /> Save Checklist
                    </button>
                </div>
            </form>
        </div>
    );
};
