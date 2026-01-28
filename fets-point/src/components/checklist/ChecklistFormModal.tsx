import React, { useState, useMemo, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { X, Save, ClipboardCheck, AlertCircle, CheckCircle2, Paperclip, FileText, LayoutList, ChevronRight, Check, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChecklistTemplate } from '../../types/checklist';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';
import FileUpload from '../FileUpload';

interface ChecklistFormModalProps {
    template: ChecklistTemplate;
    onClose: () => void;
    onSuccess?: () => void;
    currentUser: any;
    overrideStaff?: { id: string; name: string };
    overrideBranch?: string;
}

export const ChecklistFormModal: React.FC<ChecklistFormModalProps> = ({ template, onClose, onSuccess, currentUser, overrideStaff, overrideBranch }) => {
    const { register, handleSubmit, formState: { errors }, watch, setValue } = useForm();
    const [submitting, setSubmitting] = useState(false);
    const [attachments, setAttachments] = useState<Record<string, any[]>>({});
    const [activeSection, setActiveSection] = useState<string>('');
    const [availableSystems, setAvailableSystems] = useState<any[]>([]); // Systems for dropdown

    useEffect(() => {
        const fetchSystems = async () => {
            const { data } = await supabase.from('systems').select('id, name, branch_location, system_type, ip_address').order('name');
            if (data) setAvailableSystems(data);
        };
        fetchSystems();
    }, []);

    const questions = template.questions || [];
    const watchedValues = watch();

    // Theme Configuration based on checklist type
    const theme = useMemo(() => {
        const isPre = template.type === 'pre_exam';
        const isPost = template.type === 'post_exam';
        
        if (isPre) return {
            primary: 'bg-[#E19898]', // Elegant Rose Gold
            secondary: 'bg-[#FFF5F5]',
            text: 'text-[#8E5D5D]',
            border: 'border-[#F2D7D7]',
            accent: 'rose',
            gradient: 'from-[#E19898] to-[#D48686]',
            shadow: 'shadow-rose-100'
        };
        if (isPost) return {
            primary: 'bg-[#607D8B]', // Sophisticated Slate Teal
            secondary: 'bg-[#F0F4F7]',
            text: 'text-[#455A64]',
            border: 'border-[#CFD8DC]',
            accent: 'slate',
            gradient: 'from-[#607D8B] to-[#546E7A]',
            shadow: 'shadow-slate-100'
        };
        return {
            primary: 'bg-slate-700',
            secondary: 'bg-slate-50',
            text: 'text-slate-600',
            border: 'border-slate-200',
            accent: 'slate',
            gradient: 'from-slate-700 to-slate-600',
            shadow: 'shadow-slate-100'
        };
    }, [template.type]);

    // Group questions by section
    const sectionedQuestions = useMemo(() => {
        const groups: Record<string, any[]> = {};
        questions.forEach(q => {
            const section = q.section || 'General Checks';
            if (!groups[section]) groups[section] = [];
            groups[section].push(q);
        });
        return groups;
    }, [questions]);

    const sections = useMemo(() => Object.keys(sectionedQuestions), [sectionedQuestions]);

    useEffect(() => {
        if (sections.length > 0 && !activeSection) {
            setActiveSection(sections[0]);
        }
    }, [sections]);

    // Progress Calculation
    const progress = useMemo(() => {
        const total = questions.length;
        if (total === 0) return 0;
        const filled = questions.filter(q => {
            const val = watchedValues[q.id];
            if (q.type === 'checkbox') return val === true;
            return val !== undefined && val !== '';
        }).length;
        return Math.round((filled / total) * 100);
    }, [questions, watchedValues]);

    const onSubmit = async (data: any) => {
        const missingAttachments = questions.filter(q => q.attachment_mode === 'required' && (!attachments[q.id] || attachments[q.id].length === 0));
        if (missingAttachments.length > 0) {
            toast.error(`Photo is required for: ${missingAttachments[0].text}`);
            return;
        }

        setSubmitting(true);
        try {
            // CRITICAL: submitted_by MUST be the auth.uid() (user_id from staff_profiles)
            // The RLS policy requires auth.uid() = submitted_by for INSERT
            // Note: When overrideStaff is used for admin submission on behalf of another user,
            // we still use the current user's auth ID since that's what RLS checks
            const authUserId = currentUser.user_id || currentUser.id;
            
            const submission = {
                template_id: template.id,
                submitted_by: authUserId, // Always use the authenticated user's ID
                branch_id: overrideBranch || currentUser.branch_assigned || currentUser.branch_id || null,
                submitted_at: new Date().toISOString(),
                answers: data,
                attachments: attachments,
                status: 'submitted'
            };

            console.log('📋 Submitting checklist:', {
                template_id: submission.template_id,
                submitted_by: submission.submitted_by,
                branch_id: submission.branch_id,
                currentUser_user_id: currentUser.user_id,
                currentUser_id: currentUser.id
            });

            const { error } = await supabase.from('checklist_submissions').insert(submission);
            if (error) {
                console.error('❌ Supabase insert error:', error);
                throw error;
            }

            console.log('✅ Checklist submitted successfully');
            toast.success('Form saved successfully.');
            if (onSuccess) onSuccess();
            onClose();
        } catch (error: any) {
            console.error('❌ Submission error:', error);
            toast.error(error.message || 'Failed to save form.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleFilesSelected = (questionId: string, files: any[]) => {
        setAttachments(prev => ({ ...prev, [questionId]: files }));
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.05 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 10 },
        visible: { opacity: 1, y: 0 }
    };

    return (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-0 md:p-6 bg-slate-900/60 backdrop-blur-md">
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 40 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 40 }}
                className="w-full max-w-6xl h-full md:h-[90vh] flex flex-col bg-[#fdfdfd] md:rounded-[3rem] shadow-2xl overflow-hidden border border-white/40"
            >
                {/* Immersive Header */}
                <div className={`p-6 md:p-8 bg-white border-b border-slate-100 relative overflow-hidden`}>
                    {/* Progress Bar Background */}
                    <div className="absolute bottom-0 left-0 w-full h-1 bg-slate-100 opacity-50">
                        <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            className={`h-full ${theme.primary} transition-all duration-700`}
                        />
                    </div>

                    <div className="flex items-center justify-between relative z-10">
                        <div className="flex items-center gap-4 md:gap-8">
                            <div className={`w-14 h-14 md:w-16 md:h-16 rounded-2xl ${theme.primary} flex items-center justify-center text-white shadow-xl ${theme.shadow} rotate-[-2deg] transition-all`}>
                                <ClipboardCheck size={32} className="md:size-8" />
                            </div>
                            <div>
                                <h2 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight leading-tight mb-1 select-none">
                                    {template.title}
                                </h2>
                                <div className="flex flex-wrap items-center gap-2 md:gap-4">
                                    <span className={`px-2.5 py-0.5 ${theme.secondary} ${theme.text} text-[10px] font-black uppercase tracking-[0.1em] rounded-md border ${theme.border}`}>
                                        Active Form
                                    </span>
                                    <div className="hidden md:block w-1 h-1 rounded-full bg-slate-200" />
                                    <p className="text-slate-400 text-[10px] md:text-xs font-bold truncate max-w-[200px] md:max-w-none">
                                        {template.description || "Daily verification check"}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="hidden lg:flex flex-col items-end mr-4">
                                <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1">Items Filled</span>
                                <span className={`text-xl font-black ${theme.text} leading-none`}>{progress}%</span>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-3 md:p-4 rounded-2xl bg-slate-50 border border-slate-100 text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-all active:scale-95 group"
                            >
                                <X size={20} className="group-hover:rotate-90 transition-transform" />
                            </button>
                        </div>
                    </div>
                </div>

                <div className="flex-1 flex overflow-hidden">
                    {/* Left Sidebar Navigation (Desktop) */}
                    <div className="hidden lg:flex w-64 flex-col bg-[#f9fafb] border-r border-slate-100 p-6 overflow-y-auto">
                        <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] mb-6 px-2">Checklist Steps</span>
                        <div className="space-y-2">
                            {sections.map((section, idx) => {
                                const isCompleted = sectionedQuestions[section].every(q => {
                                    const val = watchedValues[q.id];
                                    if (q.type === 'checkbox') return val === true;
                                    return val !== undefined && val !== '';
                                });
                                const isActive = activeSection === section;

                                return (
                                    <button
                                        key={section}
                                        onClick={() => {
                                            setActiveSection(section);
                                            document.getElementById(`section-${idx}`)?.scrollIntoView({ behavior: 'smooth' });
                                        }}
                                        className={`w-full p-4 rounded-2xl flex items-center gap-3 transition-all text-left ${
                                            isActive 
                                            ? `${theme.primary} text-white shadow-lg ${theme.shadow}` 
                                            : 'hover:bg-white text-slate-400 hover:text-slate-600'
                                        }`}
                                    >
                                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-black shrink-0 ${
                                            isActive ? 'bg-white/20' : isCompleted ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200/50 text-slate-400'
                                        }`}>
                                            {isCompleted ? <Check size={14} /> : idx + 1}
                                        </div>
                                        <span className="text-[11px] font-black uppercase tracking-tight line-clamp-1">{section}</span>
                                    </button>
                                );
                            })}
                        </div>
                        
                        <div className="mt-auto p-5 bg-white rounded-2xl border border-slate-100 shadow-sm">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center">
                                    <Shield size={14} />
                                </div>
                                <span className="text-[10px] font-black uppercase text-slate-800 tracking-wider">Help</span>
                            </div>
                            <p className="text-[10px] text-slate-400 font-bold leading-relaxed">
                                Please fill all fields accurately. Once saved, this data is sent to the central office.
                            </p>
                        </div>
                    </div>

                    {/* Main Form Area */}
                    <div className="flex-1 overflow-y-auto p-4 md:p-10 scroll-smooth bg-[#fdfdfd]" id="form-container">
                        <form id="checklist-form" onSubmit={handleSubmit(onSubmit)} className="max-w-3xl mx-auto space-y-16 pb-20">
                            {Object.entries(sectionedQuestions).map(([section, groupQuestions], sIdx) => (
                                <motion.div 
                                    key={section} 
                                    id={`section-${sIdx}`}
                                    variants={containerVariants}
                                    initial="hidden"
                                    whileInView="visible"
                                    viewport={{ once: true, margin: "-100px" }}
                                    className="relative"
                                >
                                    {/* Section Heading */}
                                    <div className="flex items-center gap-4 mb-10">
                                        <div className={`w-10 h-10 ${theme.primary} text-white rounded-xl flex items-center justify-center text-xs font-black shadow-lg`}>
                                            {sIdx + 1}
                                        </div>
                                        <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">
                                            {section}
                                        </h3>
                                        <div className="h-px flex-1 bg-slate-100 ml-2" />
                                    </div>

                                    <div className="space-y-8">
                                        {groupQuestions.map((q, idx) => {
                                            // ---------------------------------------------------------
                                            // LOGIC: Conditional Visibility & Custom System Error Input
                                            // ---------------------------------------------------------
                                            
                                            // 1. Identify if this is the dependent question
                                            const isSystemErrorQuestion = q.text.toLowerCase().includes('system number') && q.text.toLowerCase().includes('error note');
                                            
                                            // 2. Conditional Visibility Logic
                                            if (isSystemErrorQuestion) {
                                                const triggerQuestion = questions.find(qst => qst.text.toLowerCase().includes('any workstation errors'));
                                                // If trigger exists, check its value. If it's NOT "Yes" (or equivalent positive), hide this question.
                                                if (triggerQuestion) {
                                                    const triggerValue = watchedValues[triggerQuestion.id];
                                                    const isYes = typeof triggerValue === 'string' && ['yes', 'fail', 'error', 'issues'].some(v => triggerValue.toLowerCase().includes(v));
                                                    // Also check for boolean true if it's a checkbox, though usually these are Radios
                                                    const isChecked = triggerValue === true;
                                                    
                                                    if (!isYes && !isChecked) return null;
                                                }
                                            }

                                            // 3. Render Custom System Selector if matched
                                            if (isSystemErrorQuestion) {
                                                return (
                                                     <SystemErrorInput 
                                                        key={q.id}
                                                        question={q}
                                                        theme={theme}
                                                        register={register}
                                                        setValue={setValue}
                                                        watch={watch}
                                                        errors={errors}
                                                        attachments={attachments}
                                                        onFilesSelected={handleFilesSelected}
                                                        activeBranch={overrideBranch || currentUser.branch_assigned || currentUser.branch_id || 'Global'}
                                                        availableSystems={availableSystems}
                                                     />
                                                );
                                            }

                                            // ---------------------------------------------------------
                                            // END CUSTOM LOGIC
                                            // ---------------------------------------------------------

                                            return (
                                            <motion.div 
                                                key={q.id || idx}
                                                variants={itemVariants}
                                                className={`group p-6 md:p-8 rounded-[2rem] border transition-all duration-300 relative bg-white ${
                                                    watchedValues[q.id] ? 'border-emerald-100 bg-emerald-50/5' : 'border-slate-100 hover:border-slate-200'
                                                }`}
                                            >
                                                {/* Filled Indicator */}
                                                <AnimatePresence>
                                                    {watchedValues[q.id] && (
                                                        <motion.div 
                                                            initial={{ scale: 0 }} animate={{ scale: 1 }}
                                                            className="absolute -right-2 -top-2 w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg border-2 border-white z-10"
                                                        >
                                                            <Check size={14} />
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>

                                                <div className="flex gap-4 md:gap-6">
                                                    <div className="flex-1 space-y-6">
                                                        <div>
                                                            <h3 className="text-lg md:text-xl font-black text-slate-700 leading-snug tracking-tight text-balance">
                                                                {q.text} {q.required && <span className="text-rose-400 ml-1 font-bold">*</span>}
                                                            </h3>
                                                            {q.description && (
                                                                <p className="text-[11px] text-slate-400 mt-2 font-bold leading-relaxed">{q.description}</p>
                                                            )}
                                                        </div>

                                                        {/* Input Canvas */}
                                                        <div className="relative">
                                                            {q.type === 'text' && (
                                                                <input
                                                                    type="text"
                                                                    {...register(q.id, { required: q.required })}
                                                                    className={`w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:border-${theme.accent}-400 outline-none transition-all text-slate-700 font-bold placeholder:text-slate-300 shadow-sm`}
                                                                    placeholder="Type here..."
                                                                />
                                                            )}

                                                            {q.type === 'textarea' && (
                                                                <textarea
                                                                    {...register(q.id, { required: q.required })}
                                                                    rows={3}
                                                                    className={`w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:border-${theme.accent}-400 outline-none transition-all text-slate-700 font-bold placeholder:text-slate-300 shadow-sm resize-none`}
                                                                    placeholder="Type notes here..."
                                                                />
                                                            )}

                                                            {q.type === 'number' && (
                                                                <div className="max-w-[150px]">
                                                                    <input
                                                                        type="number"
                                                                        step="any"
                                                                        {...register(q.id, { required: q.required })}
                                                                        className={`w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:border-${theme.accent}-400 outline-none transition-all text-slate-700 font-black text-xl shadow-sm`}
                                                                        placeholder="00"
                                                                    />
                                                                </div>
                                                            )}

                                                            {q.type === 'checkbox' && (
                                                                <label className={`flex items-center gap-4 cursor-pointer p-5 rounded-2xl border-2 transition-all ${watchedValues[q.id] ? `border-emerald-100 bg-emerald-50/20` : 'border-slate-50 hover:border-slate-100'}`}>
                                                                    <div className={`w-7 h-7 rounded-lg border flex items-center justify-center transition-all ${watchedValues[q.id] ? 'bg-emerald-500 border-emerald-500 text-white shadow-emerald-100' : 'bg-white border-slate-200'}`}>
                                                                        <Check size={16} className={watchedValues[q.id] ? 'opacity-100 scale-100' : 'opacity-0 scale-50'} />
                                                                    </div>
                                                                    <input
                                                                        type="checkbox"
                                                                        {...register(q.id, { required: q.required })}
                                                                        className="hidden"
                                                                    />
                                                                    <span className={`text-sm font-black uppercase tracking-widest ${watchedValues[q.id] ? 'text-emerald-700' : 'text-slate-400'}`}>
                                                                        I have checked this
                                                                    </span>
                                                                </label>
                                                            )}

                                                            {q.type === 'radio' && (
                                                                <div className="flex flex-wrap gap-3">
                                                                    {q.options?.map((opt: string, i: number) => {
                                                                        const isSelected = watch(q.id) === opt;
                                                                        return (
                                                                            <label key={i} className={`flex items-center gap-3 px-6 py-4 rounded-2xl border transition-all cursor-pointer shadow-sm ${isSelected ? `border-${theme.accent}-300 ${theme.secondary} ${theme.text}` : 'border-slate-100 bg-white text-slate-500 hover:border-slate-200'}`}>
                                                                                <input
                                                                                    type="radio"
                                                                                    value={opt}
                                                                                    {...register(q.id, { required: q.required })}
                                                                                    className="hidden"
                                                                                />
                                                                                <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${isSelected ? `border-${theme.accent}-400 bg-${theme.accent}-400` : 'border-slate-200'}`}>
                                                                                    {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                                                                                </div>
                                                                                <span className="text-xs font-black uppercase tracking-tight">{opt}</span>
                                                                            </label>
                                                                        );
                                                                    })}
                                                                </div>
                                                            )}

                                                            {q.type === 'dropdown' && (
                                                                <div className="relative">
                                                                    <select
                                                                        {...register(q.id, { required: q.required })}
                                                                        className={`w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:border-${theme.accent}-400 outline-none transition-all text-slate-700 font-bold appearance-none shadow-sm`}
                                                                    >
                                                                        <option value="">Choose one...</option>
                                                                        {q.options?.map((opt: string, i: number) => (
                                                                            <option key={i} value={opt}>{opt}</option>
                                                                        ))}
                                                                    </select>
                                                                    <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none opacity-40">
                                                                        <LayoutList size={20} />
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {q.type === 'date' && (
                                                                <input
                                                                    type="date"
                                                                    {...register(q.id, { required: q.required })}
                                                                    className={`max-w-[280px] w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:border-${theme.accent}-400 outline-none transition-all text-slate-700 font-black shadow-sm`}
                                                                />
                                                            )}

                                                            {q.type === 'time' && (
                                                                <input
                                                                    type="time"
                                                                    {...register(q.id, { required: q.required })}
                                                                    className={`max-w-[200px] w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:border-${theme.accent}-400 outline-none transition-all text-slate-700 font-black shadow-sm`}
                                                                />
                                                            )}

                                                            {/* Evidence Upload Handler */}
                                                            {q.attachment_mode && q.attachment_mode !== 'none' && (
                                                                <div className={`mt-8 p-8 rounded-[2rem] border-2 border-dashed ${attachments[q.id]?.length > 0 ? 'border-emerald-100 bg-emerald-50/10' : 'border-slate-100 bg-slate-50/30'} hover:border-slate-200 transition-colors shadow-inner`}>
                                                                    <div className="flex items-center justify-between mb-6">
                                                                        <div className="flex items-center gap-3">
                                                                            <div className={`w-8 h-8 rounded-lg ${theme.primary} text-white flex items-center justify-center shadow-md`}>
                                                                                <Paperclip size={16} />
                                                                            </div>
                                                                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-800">
                                                                                Attach Photo {q.attachment_mode === 'required' ? '(Required)' : '(Optional)'}
                                                                            </span>
                                                                        </div>
                                                                        {attachments[q.id]?.length > 0 && (
                                                                            <div className="flex items-center gap-2 text-emerald-600 bg-white px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm">
                                                                                <Check size={14} /> Attached
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                    <FileUpload 
                                                                        onFilesSelected={(files) => handleFilesSelected(q.id, files)} 
                                                                        maxFiles={1} 
                                                                    />
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Dynamic Error State */}
                                                        <AnimatePresence>
                                                            {errors[q.id] && (
                                                                <motion.div
                                                                    initial={{ opacity: 0, x: -10 }}
                                                                    animate={{ opacity: 1, x: 0 }}
                                                                    exit={{ opacity: 0, x: -10 }}
                                                                    className="flex items-center gap-2 text-rose-500 font-black text-[10px] uppercase tracking-widest px-1"
                                                                >
                                                                    <AlertCircle size={14} /> Please fill this item
                                                                </motion.div>
                                                            )}
                                                        </AnimatePresence>
                                                    </div>
                                                </div>
                                            </motion.div>
                                            );
                                        })}
                                    </div>
                                </motion.div>
                            ))}
                        </form>
                    </div>
                </div>

                {/* Footer Dashboard Controls */}
                <div className="p-6 md:p-8 bg-white border-t border-slate-100 z-20">
                    <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 md:gap-0">
                        {/* Operator Display */}
                        <div className="flex items-center gap-5">
                            <div className={`w-14 h-14 md:w-16 md:h-16 rounded-2xl overflow-hidden border-2 border-slate-50 shadow-lg`}>
                                <img 
                                    src={currentUser?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(overrideStaff?.name || currentUser.full_name || 'User')}&background=0F172A&color=EAB308&size=128`} 
                                    alt="User" 
                                    className="w-full h-full object-cover" 
                                />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1 leading-none select-none">Submitted by</p>
                                <p className="text-slate-700 font-black text-lg tracking-tight leading-none">{overrideStaff?.name || currentUser.full_name || currentUser.username}</p>
                            </div>
                        </div>

                        {/* Submission Engine */}
                        <div className="flex items-center gap-4 w-full md:w-auto">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 md:flex-none px-10 py-5 rounded-2xl font-black uppercase tracking-widest text-[11px] text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all active:scale-95"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                form="checklist-form"
                                disabled={submitting}
                                className={`flex-1 md:flex-none px-14 py-5 rounded-[1.5rem] font-black uppercase tracking-[0.2em] text-[11px] ${theme.primary} text-white shadow-xl ${theme.shadow} hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-4 group/btn`}
                            >
                                {submitting ? (
                                    <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <Save size={18} />
                                        <span>Save & Submit</span>
                                        <ChevronRight size={18} className="hidden md:block group-hover/btn:translate-x-1 transition-transform" />
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

const SystemErrorInput = ({ question, theme, register, setValue, watch, errors, attachments, onFilesSelected, activeBranch, availableSystems }: any) => {
    const [selectedSysIds, setSelectedSysIds] = useState<string[]>([]);
    const [errorNote, setErrorNote] = useState('');
    const [search, setSearch] = useState('');
    
    // Initialize from form state if present
    useEffect(() => {
        const currentVal = watch(question.id);
        if (currentVal && typeof currentVal === 'object') {
             if (currentVal.systems) setSelectedSysIds(currentVal.systems);
             if (currentVal.note) setErrorNote(currentVal.note);
        }
    }, [watch, question.id]);

    // Sync to form
    useEffect(() => {
        setValue(question.id, {
            systems: selectedSysIds,
            note: errorNote,
            summary: `${selectedSysIds.length} Systems: ${errorNote}` 
        });
    }, [selectedSysIds, errorNote, setValue, question.id]);

    const filteredSystems = availableSystems.filter((s: any) => {
        const matchesBranch = activeBranch === 'Global' || s.branch_location === activeBranch;
        const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase()) || (s.ip_address && s.ip_address.includes(search));
        return matchesBranch && matchesSearch; 
    });

    const toggleSystem = (id: string) => {
        setSelectedSysIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    };

    return (
        <div className={`p-6 md:p-8 rounded-[2rem] border transition-all duration-300 bg-white ${selectedSysIds.length > 0 ? 'border-amber-200 bg-amber-50/5' : 'border-slate-100'}`}>
            <h3 className="text-lg md:text-xl font-black text-slate-700 leading-snug tracking-tight mb-4">
                {question.text} <span className="text-rose-400 ml-1">*</span>
            </h3>
            
            <div className="space-y-6">
                {/* 1. System Selector */}
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Affected System(s)</label>
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                        <input 
                            type="text" 
                            placeholder="Search systems..." 
                            className="w-full bg-transparent outline-none text-xs font-bold mb-4 border-b border-slate-200 pb-2"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                        <div className="max-h-[150px] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                            {filteredSystems.length > 0 ? filteredSystems.map((sys: any) => (
                                <div 
                                    key={sys.id} 
                                    onClick={() => toggleSystem(sys.id)}
                                    className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all border ${selectedSysIds.includes(sys.id) ? `bg-${theme.accent}-100 border-${theme.accent}-200` : 'bg-white border-slate-100 hover:border-slate-200'}`}
                                >
                                    <div>
                                        <p className="text-xs font-black uppercase">{sys.name}</p>
                                        <p className="text-[9px] font-bold text-slate-400">{sys.ip_address}</p>
                                    </div>
                                    {selectedSysIds.includes(sys.id) && (
                                        <div className={`w-5 h-5 rounded-full ${theme.primary} text-white flex items-center justify-center`}>
                                            <Check size={12} />
                                        </div>
                                    )}
                                </div>
                            )) : (
                                <p className="text-[10px] text-slate-400 italic">No matching systems found in {activeBranch}</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* 2. Error Note */}
                <div className="space-y-2">
                     <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Error Details</label>
                     <textarea
                        value={errorNote}
                        onChange={e => setErrorNote(e.target.value)}
                        className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:border-rose-400 outline-none transition-all text-slate-700 font-bold placeholder:text-slate-300 shadow-sm resize-none"
                        placeholder="Describe the error..."
                        rows={3}
                     />
                </div>

                {/* 3. Attachment */}
                 <div className={`p-6 rounded-[1.5rem] border-2 border-dashed ${attachments[question.id]?.length > 0 ? 'border-emerald-100 bg-emerald-50/10' : 'border-slate-100 bg-slate-50/30'}`}>
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-800">
                                Proof of Error
                            </span>
                        </div>
                        {attachments[question.id]?.length > 0 && (
                            <div className="flex items-center gap-2 text-emerald-600 bg-white px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm">
                                <Check size={14} /> Attached
                            </div>
                        )}
                    </div>
                    <FileUpload 
                        onFilesSelected={(files) => onFilesSelected(question.id, files)} 
                        maxFiles={1} 
                    />
                </div>
            </div>
        </div>
    );
};
