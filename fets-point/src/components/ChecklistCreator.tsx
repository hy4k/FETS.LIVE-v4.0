import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Plus,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Save,
  Eye,
  GripVertical,
  AlertCircle,
  CheckCircle2,
  Type,
  Hash,
  Calendar as CalendarIcon,
  ChevronDown,
  Circle,
  CheckSquare,
  FileText
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { QuestionType, ChecklistPriority } from '../types';

interface ChecklistCreatorProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type AnswerType = QuestionType;

interface QuestionItem {
  id: string;
  question_text: string;
  answer_type: AnswerType;
  options: string[];
  is_required: boolean;
  validation_rules: {
    min?: number;
    max?: number;
    pattern?: string;
  };
  order_index: number;
}

interface ChecklistFormData {
  name: string;
  description: string;
  category: string;
  questions: QuestionItem[];
}

const answerTypeOptions = [
  { value: 'checkbox', label: 'Checkbox', icon: CheckSquare, description: 'Yes/No or True/False' },
  { value: 'text', label: 'Short Text', icon: Type, description: 'Single line text input' },
  { value: 'textarea', label: 'Long Text', icon: FileText, description: 'Multi-line text input' },
  { value: 'number', label: 'Number', icon: Hash, description: 'Numeric input with validation' },
  { value: 'dropdown', label: 'Dropdown', icon: ChevronDown, description: 'Select one from list' },
  { value: 'radio', label: 'Radio Buttons', icon: Circle, description: 'Choose one option' },
  { value: 'date', label: 'Date', icon: CalendarIcon, description: 'Date picker' }
];

const categoryOptions = [
  { value: 'pre-exam', label: 'Pre-Exam' },
  { value: 'post-exam', label: 'Post-Exam' },
  { value: 'custom', label: 'Custom' }
];

export function ChecklistCreator({ isOpen, onClose, onSuccess }: ChecklistCreatorProps) {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<ChecklistFormData>({
    name: '',
    description: '',
    category: 'custom',
    questions: []
  });
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentStep(1);
      setFormData({
        name: '',
        description: '',
        category: 'custom',
        questions: []
      });
      setShowPreview(false);
    }
  }, [isOpen]);

  const addQuestion = () => {
    const newQuestion: QuestionItem = {
      id: `temp-${Date.now()}`,
      question_text: '',
      answer_type: 'checkbox',
      options: [],
      is_required: true,
      validation_rules: {},
      order_index: formData.questions.length
    };
    setFormData({
      ...formData,
      questions: [...formData.questions, newQuestion]
    });
  };

  const removeQuestion = (id: string) => {
    setFormData({
      ...formData,
      questions: formData.questions.filter(q => q.id !== id)
    });
  };

  const updateQuestion = (id: string, updates: Partial<QuestionItem>) => {
    setFormData({
      ...formData,
      questions: formData.questions.map(q =>
        q.id === id ? { ...q, ...updates } : q
      )
    });
  };

  const addOption = (questionId: string) => {
    const question = formData.questions.find(q => q.id === questionId);
    if (question) {
      updateQuestion(questionId, {
        options: [...question.options, '']
      });
    }
  };

  const updateOption = (questionId: string, optionIndex: number, value: string) => {
    const question = formData.questions.find(q => q.id === questionId);
    if (question) {
      const newOptions = [...question.options];
      newOptions[optionIndex] = value;
      updateQuestion(questionId, { options: newOptions });
    }
  };

  const removeOption = (questionId: string, optionIndex: number) => {
    const question = formData.questions.find(q => q.id === questionId);
    if (question) {
      updateQuestion(questionId, {
        options: question.options.filter((_, i) => i !== optionIndex)
      });
    }
  };

  const validateStep1 = () => {
    if (!formData.name.trim()) {
      toast.error('Please enter a checklist name');
      return false;
    }
    if (!formData.description.trim()) {
      toast.error('Please enter a description');
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (formData.questions.length === 0) {
      toast.error('Please add at least one question');
      return false;
    }

    for (const question of formData.questions) {
      if (!question.question_text.trim()) {
        toast.error('All questions must have text');
        return false;
      }

      if ((question.answer_type === 'dropdown' || question.answer_type === 'radio') && question.options.length < 2) {
        toast.error(`Question "${question.question_text}" requires at least 2 options`);
        return false;
      }

      if ((question.answer_type === 'dropdown' || question.answer_type === 'radio')) {
        const hasEmptyOption = question.options.some(opt => !opt.trim());
        if (hasEmptyOption) {
          toast.error(`Question "${question.question_text}" has empty options`);
          return false;
        }
      }
    }

    return true;
  };

  const handleNext = () => {
    if (currentStep === 1 && validateStep1()) {
      setCurrentStep(2);
    }
  };

  const handleBack = () => {
    if (currentStep === 2) {
      setCurrentStep(1);
    }
  };

  const handleSave = async () => {
    if (!validateStep2()) return;

    try {
      setSaving(true);

      // Create the template
      const { data: template, error: templateError } = await supabase
        .from('checklist_templates')
        .insert({
          name: formData.name,
          description: formData.description,
          category: formData.category,
          created_by: user?.id,
          is_active: true
        })
        .select()
        .single();

      if (templateError) throw templateError;

      // Create the template items
      const items = formData.questions.map((question, index) => ({
        template_id: template.id,
        title: question.question_text,
        description: null,
        priority: 'medium' as ChecklistPriority,
        estimated_time_minutes: 5,
        responsible_role: 'staff',
        sort_order: index,
        question_type: question.answer_type,  // Save as question_type to match the schema
        dropdown_options: (question.answer_type === 'dropdown' || question.answer_type === 'radio')
          ? question.options
          : null,
        is_required: question.is_required,
        validation_rules: Object.keys(question.validation_rules).length > 0
          ? question.validation_rules
          : null
      }));

      const { error: itemsError } = await supabase
        .from('checklist_template_items')
        .insert(items);

      if (itemsError) throw itemsError;

      toast.success('Checklist created successfully!');
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error creating checklist:', error);
      toast.error('Failed to create checklist: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-semibold text-white mb-2">
          Checklist Name *
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="e.g., Pre-Exam Safety Checklist"
          className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-amber-400"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-white mb-2">
          Description *
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Describe the purpose of this checklist..."
          rows={3}
          className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-white mb-2">
          Category *
        </label>
        <select
          value={formData.category}
          onChange={(e) => setFormData({ ...formData, category: e.target.value })}
          className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
        >
          {categoryOptions.map(cat => (
            <option key={cat.value} value={cat.value} className="bg-gray-800">
              {cat.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-start gap-3 p-4 bg-amber-500/10 border border-amber-400/30 rounded-xl">
        <AlertCircle className="text-amber-400 flex-shrink-0 mt-0.5" size={20} />
        <div className="text-sm text-amber-100">
          <p className="font-semibold mb-1">Next Step: Add Questions</p>
          <p className="text-amber-200/80">After entering basic information, you'll be able to add custom questions with various answer types.</p>
        </div>
      </div>
    </div>
  );

  const renderQuestionBuilder = (question: QuestionItem, index: number) => {
    const AnswerTypeIcon = answerTypeOptions.find(opt => opt.value === question.answer_type)?.icon || CheckSquare;

    return (
      <motion.div
        key={question.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="bg-white/5 border border-white/20 rounded-xl p-6 space-y-4"
      >
        {/* Question Header */}
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-2 text-white/40 cursor-move">
            <GripVertical size={20} />
          </div>
          <div className="flex-1 space-y-4">
            {/* Question Text */}
            <div>
              <label className="block text-sm font-semibold text-white mb-2">
                Question {index + 1} *
              </label>
              <input
                type="text"
                value={question.question_text}
                onChange={(e) => updateQuestion(question.id, { question_text: e.target.value })}
                placeholder="Enter your question..."
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>

            {/* Answer Type Selector */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-semibold text-white mb-2">
                  Answer Type *
                </label>
                <select
                  value={question.answer_type}
                  onChange={(e) => updateQuestion(question.id, {
                    answer_type: e.target.value as AnswerType,
                    options: (e.target.value === 'dropdown' || e.target.value === 'radio') ? [''] : []
                  })}
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                >
                  {answerTypeOptions.map(opt => (
                    <option key={opt.value} value={opt.value} className="bg-gray-800">
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-end">
                <label className="flex items-center gap-2 px-4 py-2 bg-white/10 border border-white/20 rounded-lg cursor-pointer hover:bg-white/20 transition-colors">
                  <input
                    type="checkbox"
                    checked={question.is_required}
                    onChange={(e) => updateQuestion(question.id, { is_required: e.target.checked })}
                    className="w-4 h-4 rounded text-amber-400 focus:ring-amber-400 focus:ring-offset-0"
                  />
                  <span className="text-sm text-white font-medium">Required</span>
                </label>
              </div>
            </div>

            {/* Answer Type Description */}
            <div className="flex items-center gap-2 text-sm text-white/60">
              <AnswerTypeIcon size={16} />
              <span>{answerTypeOptions.find(opt => opt.value === question.answer_type)?.description}</span>
            </div>

            {/* Options for dropdown/radio */}
            {(question.answer_type === 'dropdown' || question.answer_type === 'radio') && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold text-white">
                    Options (minimum 2) *
                  </label>
                  <button
                    onClick={() => addOption(question.id)}
                    className="px-3 py-1 bg-amber-400/20 hover:bg-amber-400/30 text-amber-300 rounded-lg text-sm font-medium transition-colors flex items-center gap-1"
                  >
                    <Plus size={14} />
                    Add Option
                  </button>
                </div>
                <div className="space-y-2">
                  {question.options.map((option, optIndex) => (
                    <div key={optIndex} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={option}
                        onChange={(e) => updateOption(question.id, optIndex, e.target.value)}
                        placeholder={`Option ${optIndex + 1}`}
                        className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-amber-400"
                      />
                      <button
                        onClick={() => removeOption(question.id, optIndex)}
                        className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Validation for number type */}
            {question.answer_type === 'number' && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-white mb-2">
                    Min Value (optional)
                  </label>
                  <input
                    type="number"
                    value={question.validation_rules.min ?? ''}
                    onChange={(e) => updateQuestion(question.id, {
                      validation_rules: {
                        ...question.validation_rules,
                        min: e.target.value ? Number(e.target.value) : undefined
                      }
                    })}
                    placeholder="No minimum"
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-white mb-2">
                    Max Value (optional)
                  </label>
                  <input
                    type="number"
                    value={question.validation_rules.max ?? ''}
                    onChange={(e) => updateQuestion(question.id, {
                      validation_rules: {
                        ...question.validation_rules,
                        max: e.target.value ? Number(e.target.value) : undefined
                      }
                    })}
                    placeholder="No maximum"
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Delete Question Button */}
          <button
            onClick={() => removeQuestion(question.id)}
            className="flex-shrink-0 p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
          >
            <Trash2 size={20} />
          </button>
        </div>
      </motion.div>
    );
  };

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-white">Questions</h3>
          <p className="text-sm text-white/60 mt-1">
            Add questions to your checklist. You can reorder them by dragging.
          </p>
        </div>
        <button
          onClick={addQuestion}
          className="px-4 py-2 bg-gradient-to-r from-amber-400 to-yellow-500 text-black rounded-lg font-semibold hover:shadow-xl transition-all duration-200 flex items-center gap-2"
        >
          <Plus size={20} />
          Add Question
        </button>
      </div>

      {formData.questions.length === 0 ? (
        <div className="text-center py-12 bg-white/5 border border-white/20 rounded-xl">
          <CheckSquare className="mx-auto h-12 w-12 text-white/20 mb-3" />
          <p className="text-white/60 mb-4">No questions added yet</p>
          <button
            onClick={addQuestion}
            className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg font-medium transition-colors inline-flex items-center gap-2"
          >
            <Plus size={20} />
            Add Your First Question
          </button>
        </div>
      ) : (
        <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
          <AnimatePresence>
            {formData.questions.map((question, index) =>
              renderQuestionBuilder(question, index)
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );

  const renderPreview = () => (
    <div className="space-y-6">
      <div className="bg-white/5 border border-white/20 rounded-xl p-6">
        <h3 className="text-2xl font-bold text-white mb-2">{formData.name}</h3>
        <p className="text-white/70 mb-4">{formData.description}</p>
        <div className="flex items-center gap-4 text-sm">
          <span className="px-3 py-1 bg-amber-400/20 text-amber-300 rounded-full font-medium">
            {formData.category}
          </span>
          <span className="text-white/60">
            {formData.questions.length} question{formData.questions.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
        {formData.questions.map((question, index) => {
          const AnswerTypeIcon = answerTypeOptions.find(opt => opt.value === question.answer_type)?.icon || CheckSquare;

          return (
            <div key={question.id} className="bg-white/5 border border-white/20 rounded-xl p-6">
              <div className="flex items-start gap-3 mb-4">
                <div className="flex-shrink-0 w-8 h-8 bg-amber-400/20 text-amber-300 rounded-full flex items-center justify-center font-bold text-sm">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <p className="text-white font-medium">
                      {question.question_text}
                      {question.is_required && <span className="text-red-400 ml-1">*</span>}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-white/60">
                      <AnswerTypeIcon size={14} />
                      <span>{answerTypeOptions.find(opt => opt.value === question.answer_type)?.label}</span>
                    </div>
                  </div>

                  {/* Preview of answer input */}
                  {question.answer_type === 'checkbox' && (
                    <div className="flex items-center gap-2 text-white/60">
                      <input type="checkbox" className="w-4 h-4 rounded" disabled />
                      <span className="text-sm">Yes/No</span>
                    </div>
                  )}

                  {question.answer_type === 'text' && (
                    <input
                      type="text"
                      placeholder="Text answer..."
                      disabled
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white/60"
                    />
                  )}

                  {question.answer_type === 'textarea' && (
                    <textarea
                      placeholder="Long text answer..."
                      disabled
                      rows={3}
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white/60 resize-none"
                    />
                  )}

                  {question.answer_type === 'number' && (
                    <div>
                      <input
                        type="number"
                        placeholder="Number..."
                        disabled
                        className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white/60"
                      />
                      {(question.validation_rules.min !== undefined || question.validation_rules.max !== undefined) && (
                        <p className="text-xs text-white/40 mt-1">
                          Range: {question.validation_rules.min ?? '∞'} to {question.validation_rules.max ?? '∞'}
                        </p>
                      )}
                    </div>
                  )}

                  {question.answer_type === 'dropdown' && (
                    <select disabled className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white/60">
                      <option>Select an option...</option>
                      {question.options.map((opt, i) => (
                        <option key={i}>{opt}</option>
                      ))}
                    </select>
                  )}

                  {question.answer_type === 'radio' && (
                    <div className="space-y-2">
                      {question.options.map((opt, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <input type="radio" name={question.id} disabled className="w-4 h-4" />
                          <span className="text-sm text-white/60">{opt}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {question.answer_type === 'date' && (
                    <input
                      type="date"
                      disabled
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white/60"
                    />
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-4xl bg-gradient-to-br from-purple-900/95 to-indigo-900/95 rounded-2xl shadow-2xl border border-white/20 max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-xl flex items-center justify-center">
              {showPreview ? <Eye size={20} /> : <CheckSquare size={20} className="text-white" />}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">
                {showPreview ? 'Preview Checklist' : 'Create New Checklist'}
              </h2>
              <p className="text-sm text-white/60">
                {showPreview
                  ? 'Review your checklist before saving'
                  : `Step ${currentStep} of 2: ${currentStep === 1 ? 'Basic Information' : 'Add Questions'}`
                }
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white/60 hover:text-white"
          >
            <X size={24} />
          </button>
        </div>

        {/* Progress Bar */}
        {!showPreview && (
          <div className="px-6 pt-4">
            <div className="flex items-center gap-2">
              <div className={`flex-1 h-2 rounded-full transition-colors ${currentStep >= 1 ? 'bg-amber-400' : 'bg-white/20'}`} />
              <div className={`flex-1 h-2 rounded-full transition-colors ${currentStep >= 2 ? 'bg-amber-400' : 'bg-white/20'}`} />
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <AnimatePresence mode="wait">
            {showPreview ? (
              <motion.div
                key="preview"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                {renderPreview()}
              </motion.div>
            ) : (
              <motion.div
                key={`step-${currentStep}`}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                {currentStep === 1 ? renderStep1() : renderStep2()}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-white/20 bg-white/5">
          <div>
            {currentStep === 2 && !showPreview && (
              <button
                onClick={() => setShowPreview(true)}
                className="px-4 py-2 text-white/70 hover:text-white transition-colors flex items-center gap-2"
              >
                <Eye size={18} />
                Preview
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            {showPreview ? (
              <>
                <button
                  onClick={() => setShowPreview(false)}
                  className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-semibold transition-colors flex items-center gap-2"
                >
                  <ChevronLeft size={20} />
                  Edit
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-6 py-3 bg-gradient-to-r from-green-400 to-emerald-500 text-white rounded-xl font-semibold hover:shadow-xl transition-all duration-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save size={20} />
                      Save Checklist
                    </>
                  )}
                </button>
              </>
            ) : (
              <>
                {currentStep > 1 && (
                  <button
                    onClick={handleBack}
                    className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-semibold transition-colors flex items-center gap-2"
                  >
                    <ChevronLeft size={20} />
                    Back
                  </button>
                )}
                <button
                  onClick={currentStep === 1 ? handleNext : () => setShowPreview(true)}
                  className="px-6 py-3 bg-gradient-to-r from-amber-400 to-yellow-500 text-black rounded-xl font-semibold hover:shadow-xl transition-all duration-200 flex items-center gap-2"
                >
                  {currentStep === 1 ? (
                    <>
                      Next
                      <ChevronRight size={20} />
                    </>
                  ) : (
                    <>
                      Preview & Save
                      <CheckCircle2 size={20} />
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
