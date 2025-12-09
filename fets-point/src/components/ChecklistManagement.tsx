import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, History, Play, Edit, Copy, Archive, Eye, Download,
  Calendar, Filter, Search, Check, X, Save, Settings,
  ListChecks, FileText, User, Clock, MapPin, Badge,
  ChevronRight, ChevronDown, Trash2, AlertCircle, CheckCircle2,
  Circle, ClipboardCheck, ClipboardList, Sparkles
} from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useBranch } from '../hooks/useBranch'
import { supabase } from '../lib/supabase'
import { toast } from 'react-hot-toast'

interface ChecklistTemplate {
  id: string
  name: string
  category: string
  is_active: boolean
  created_by: string
  created_at: string
  updated_at: string
  description?: string
}

interface ChecklistTemplateItem {
  id: string
  template_id: string
  title: string
  description?: string
  priority: 'low' | 'medium' | 'high'
  estimated_time_minutes: number
  responsible_role: string
  sort_order: number
  notes?: string
  question_type?: 'checkbox' | 'text' | 'number' | 'dropdown' | 'date' | 'time'
  dropdown_options?: string[]
}

interface ChecklistInstance {
  id: string
  template_id: string
  name: string
  category: string
  exam_date: string
  created_by: string
  created_at: string
  branch_location: string
  completed_at?: string
}

interface ChecklistInstanceItem {
  id: string
  instance_id: string
  template_item_id?: string
  title: string
  description?: string
  is_completed: boolean
  notes?: string
  completed_by?: string
  completed_at?: string
  priority?: string
  sort_order?: number
}

const PRIORITY_CONFIG = {
  high: { color: 'bg-red-100 text-red-700 border-red-200', dot: 'bg-red-500', label: 'High' },
  medium: { color: 'bg-orange-100 text-orange-700 border-orange-200', dot: 'bg-orange-500', label: 'Medium' },
  low: { color: 'bg-blue-100 text-blue-700 border-blue-200', dot: 'bg-blue-500', label: 'Low' }
}

export function ChecklistManagement() {
  const { profile } = useAuth()
  const { activeBranch } = useBranch()

  const [preExamTemplate, setPreExamTemplate] = useState<ChecklistTemplate | null>(null)
  const [postExamTemplate, setPostExamTemplate] = useState<ChecklistTemplate | null>(null)
  const [preExamItems, setPreExamItems] = useState<ChecklistTemplateItem[]>([])
  const [postExamItems, setPostExamItems] = useState<ChecklistTemplateItem[]>([])
  const [customTemplates, setCustomTemplates] = useState<ChecklistTemplate[]>([])
  const [instances, setInstances] = useState<ChecklistInstance[]>([])
  const [loading, setLoading] = useState(true)

  // Modals
  const [showHistoryModal, setShowHistoryModal] = useState(false)
  const [showFillModal, setShowFillModal] = useState(false)
  const [showCreateCustomModal, setShowCreateCustomModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<ChecklistTemplate | null>(null)
  const [selectedTemplateItems, setSelectedTemplateItems] = useState<ChecklistTemplateItem[]>([])
  const [editingTemplate, setEditingTemplate] = useState<ChecklistTemplate | null>(null)
  const [editingItems, setEditingItems] = useState<ChecklistTemplateItem[]>([])
  const [viewingInstance, setViewingInstance] = useState<ChecklistInstance | null>(null)
  const [viewingInstanceItems, setViewingInstanceItems] = useState<ChecklistInstanceItem[]>([])

  // Fill checklist state
  const [fillData, setFillData] = useState({
    exam_date: new Date().toISOString().split('T')[0],
    items: {} as { [key: string]: boolean }
  })

  // Custom checklist state
  const [customChecklistData, setCustomChecklistData] = useState({
    name: '',
    description: '',
    questions: [] as Array<{
      id: string;
      title: string;
      description: string;
      priority: 'low' | 'medium' | 'high';
      estimated_time_minutes: number;
      question_type: 'checkbox' | 'text' | 'number' | 'dropdown' | 'date' | 'time';
      dropdown_options: string[];
    }>
  })

  // Stats
  const [stats, setStats] = useState({
    total_completed_today: 0,
    pre_exam_completed: 0,
    post_exam_completed: 0,
    pending_checklists: 0
  })

  const loadTemplates = useCallback(async () => {
    try {
      // Load Pre-Exam Template
      const { data: preExam, error: preError } = await supabase
        .from('checklist_templates')
        .select('*')
        .eq('category', 'pre-exam')
        .eq('is_active', true)
        .single()

      if (preError && preError.code !== 'PGRST116') throw preError
      if (preExam) {
        setPreExamTemplate(preExam)

        // Load Pre-Exam Items
        const { data: preItems, error: preItemsError } = await supabase
          .from('checklist_template_items')
          .select('*')
          .eq('template_id', preExam.id)
          .order('sort_order', { ascending: true })

        if (preItemsError) throw preItemsError
        setPreExamItems((preItems || []).map(item => ({ ...item, priority: (item.priority || 'medium') as 'low' | 'medium' | 'high' })))
      }

      // Load Post-Exam Template
      const { data: postExam, error: postError } = await supabase
        .from('checklist_templates')
        .select('*')
        .eq('category', 'post-exam')
        .eq('is_active', true)
        .single()

      if (postError && postError.code !== 'PGRST116') throw postError
      if (postExam) {
        setPostExamTemplate(postExam)

        // Load Post-Exam Items
        const { data: postItems, error: postItemsError } = await supabase
          .from('checklist_template_items')
          .select('*')
          .eq('template_id', postExam.id)
          .order('sort_order', { ascending: true })

        if (postItemsError) throw postItemsError
        setPostExamItems((postItems || []).map(item => ({ ...item, priority: (item.priority || 'medium') as 'low' | 'medium' | 'high' })))
      }

      // Load Custom Templates
      const { data: custom, error: customError } = await supabase
        .from('checklist_templates')
        .select('*')
        .eq('category', 'custom')
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (customError) throw customError
      setCustomTemplates(custom || [])

    } catch (error) {
      console.error('Error loading templates:', error)
      toast.error('Failed to load checklists')
    }
  }, [])

  const loadInstances = useCallback(async () => {
    try {
      let query = supabase
        .from('checklist_instances')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)

      if (activeBranch !== 'global') {
        query = query.eq('branch_location', activeBranch)
      }

      const { data, error } = await query
      if (error) throw error
      setInstances(data || [])
    } catch (error) {
      console.error('Error loading instances:', error)
    }
  }, [activeBranch])

  const loadStats = useCallback(async () => {
    try {
      const today = new Date().toISOString().split('T')[0]

      let query = supabase
        .from('checklist_instances')
        .select('*')
        .gte('exam_date', today)

      if (activeBranch !== 'global') {
        query = query.eq('branch_location', activeBranch)
      }

      const { data, error } = await query
      if (error) throw error

      const completedToday = data?.filter(i => i.completed_at)?.length || 0
      const preExamCompleted = data?.filter(i => i.category === 'pre-exam' && i.completed_at)?.length || 0
      const postExamCompleted = data?.filter(i => i.category === 'post-exam' && i.completed_at)?.length || 0
      const pending = data?.filter(i => !i.completed_at)?.length || 0

      setStats({
        total_completed_today: completedToday,
        pre_exam_completed: preExamCompleted,
        post_exam_completed: postExamCompleted,
        pending_checklists: pending
      })
    } catch (error) {
      console.error('Error loading stats:', error)
    }
  }, [activeBranch])

  const loadAllData = useCallback(async () => {
    setLoading(true)
    await Promise.all([
      loadTemplates(),
      loadInstances(),
      loadStats()
    ])
    setLoading(false)
  }, [loadTemplates, loadInstances, loadStats])

  useEffect(() => {
    loadAllData()
  }, [activeBranch, loadAllData])

  const handleFillChecklist = async (template: ChecklistTemplate, items: ChecklistTemplateItem[]) => {
    setSelectedTemplate(template)
    setSelectedTemplateItems(items)
    setFillData({
      exam_date: new Date().toISOString().split('T')[0],
      items: {}
    })
    setShowFillModal(true)
  }

  const submitChecklist = async () => {
    if (!profile || !selectedTemplate) return

    const allCompleted = selectedTemplateItems.every(item => fillData.items[item.id])

    if (!allCompleted) {
      const proceed = confirm('Not all items are checked. Do you want to submit anyway?')
      if (!proceed) return
    }

    try {
      // Create instance
      const { data: instance, error: instanceError } = await supabase
        .from('checklist_instances')
        .insert({
          template_id: selectedTemplate.id,
          name: `${selectedTemplate.name} - ${new Date(fillData.exam_date).toLocaleDateString()}`,
          category: selectedTemplate.category,
          exam_date: fillData.exam_date,
          created_by: profile.user_id,
          branch_location: activeBranch === 'global' ? 'calicut' : activeBranch,
          completed_at: allCompleted ? new Date().toISOString() : null
        })
        .select()
        .single()

      if (instanceError) throw instanceError

      // Create instance items
      const instanceItems = selectedTemplateItems.map(item => ({
        instance_id: instance.id,
        template_item_id: item.id,
        title: item.title,
        description: item.description,
        priority: item.priority,
        is_completed: fillData.items[item.id] || false,
        completed_by: fillData.items[item.id] ? profile.id : null,
        completed_at: fillData.items[item.id] ? new Date().toISOString() : null,
        sort_order: item.sort_order
      }))

      const { error: itemsError } = await supabase
        .from('checklist_instance_items')
        .insert(instanceItems)

      if (itemsError) throw itemsError

      toast.success('Checklist submitted successfully')
      setShowFillModal(false)
      loadAllData()
    } catch (error) {
      console.error('Error submitting checklist:', error)
      toast.error('Failed to submit checklist')
    }
  }

  const handleEditTemplate = (template: ChecklistTemplate, items: ChecklistTemplateItem[]) => {
    setEditingTemplate(template)
    setEditingItems(items.map(item => ({ ...item })))
    setShowEditModal(true)
  }

  const handleViewInstance = async (instance: ChecklistInstance) => {
    try {
      console.log('Loading instance items for:', instance.id)

      // Fetch instance items
      const { data: items, error } = await supabase
        .from('checklist_instance_items')
        .select('*')
        .eq('instance_id', instance.id)
        .order('sort_order', { ascending: true })

      if (error) {
        console.error('Error loading instance items:', error)
        toast.error('Failed to load checklist details')
        return
      }

      console.log('Loaded instance items:', items)
      setViewingInstance(instance)
      setViewingInstanceItems(items || [])
      setShowViewModal(true)
    } catch (error: any) {
      console.error('Error in handleViewInstance:', error)
      toast.error(error.message || 'Failed to load checklist')
    }
  }

  const addQuestionToTemplate = () => {
    const newQuestion: ChecklistTemplateItem = {
      id: `temp-${Date.now()}`,
      template_id: editingTemplate?.id || '',
      title: '',
      description: '',
      priority: 'medium',
      estimated_time_minutes: 5,
      responsible_role: 'staff',
      sort_order: editingItems.length + 1,
      question_type: 'checkbox',
      dropdown_options: []
    }
    setEditingItems([...editingItems, newQuestion])
  }

  const updateQuestion = (id: string, updates: Partial<ChecklistTemplateItem>) => {
    setEditingItems(items => items.map(item => item.id === id ? { ...item, ...updates } : item))
  }

  const deleteQuestion = (id: string) => {
    setEditingItems(items => items.filter(item => item.id !== id))
  }

  const saveTemplateChanges = async () => {
    if (!editingTemplate || !profile) return

    try {
      // Delete removed items
      const existingIds = editingItems.filter(item => !item.id.startsWith('temp-')).map(item => item.id)
      const { error: deleteError } = await supabase
        .from('checklist_template_items')
        .delete()
        .eq('template_id', editingTemplate.id)
        .not('id', 'in', `(${existingIds.join(',') || 'null'})`)

      if (deleteError && existingIds.length > 0) console.error('Delete error:', deleteError)

      // Update or insert items
      for (const item of editingItems) {
        if (item.id.startsWith('temp-')) {
          // Insert new item
          const { error } = await supabase
            .from('checklist_template_items')
            .insert({
              template_id: editingTemplate.id,
              title: item.title,
              description: item.description,
              priority: item.priority,
              estimated_time_minutes: item.estimated_time_minutes,
              responsible_role: item.responsible_role,
              sort_order: item.sort_order
            })
          if (error) throw error
        } else {
          // Update existing item
          const { error } = await supabase
            .from('checklist_template_items')
            .update({
              title: item.title,
              description: item.description,
              priority: item.priority,
              estimated_time_minutes: item.estimated_time_minutes,
              responsible_role: item.responsible_role,
              sort_order: item.sort_order
            })
            .eq('id', item.id)
          if (error) throw error
        }
      }

      toast.success('Template updated successfully')
      setShowEditModal(false)
      loadAllData()
    } catch (error) {
      console.error('Error saving template:', error)
      toast.error('Failed to save template')
    }
  }

  const createCustomChecklist = async () => {
    if (!profile || !customChecklistData.name.trim()) {
      toast.error('Checklist name is required')
      return
    }

    if (customChecklistData.questions.length === 0) {
      toast.error('At least one question is required')
      return
    }

    try {
      // Create template
      const { data: template, error: templateError } = await supabase
        .from('checklist_templates')
        .insert({
          name: customChecklistData.name,
          description: customChecklistData.description,
          category: 'custom',
          is_active: true,
          created_by: profile.user_id
        })
        .select()
        .single()

      if (templateError) throw templateError

      // Create items
      const items = customChecklistData.questions.map((q, index) => ({
        template_id: template.id,
        title: q.title,
        description: q.description,
        priority: q.priority,
        estimated_time_minutes: q.estimated_time_minutes,
        responsible_role: 'staff',
        sort_order: index + 1
      }))

      const { error: itemsError } = await supabase
        .from('checklist_template_items')
        .insert(items)

      if (itemsError) throw itemsError

      toast.success('Custom checklist created successfully')
      setShowCreateCustomModal(false)
      setCustomChecklistData({
        name: '',
        description: '',
        questions: []
      })
      loadAllData()
    } catch (error) {
      console.error('Error creating custom checklist:', error)
      toast.error('Failed to create custom checklist')
    }
  }

  const addCustomQuestion = () => {
    setCustomChecklistData(prev => ({
      ...prev,
      questions: [...prev.questions, {
        id: Date.now().toString(),
        title: '',
        description: '',
        priority: 'medium',
        estimated_time_minutes: 5,
        question_type: 'checkbox',
        dropdown_options: []
      }]
    }))
  }

  const updateCustomQuestion = (id: string, updates: Partial<typeof customChecklistData.questions[0]>) => {
    setCustomChecklistData(prev => ({
      ...prev,
      questions: prev.questions.map(q => q.id === id ? { ...q, ...updates } : q)
    }))
  }

  const deleteCustomQuestion = (id: string) => {
    setCustomChecklistData(prev => ({
      ...prev,
      questions: prev.questions.filter(q => q.id !== id)
    }))
  }

  const renderChecklistCard = (
    title: string,
    template: ChecklistTemplate | null,
    items: ChecklistTemplateItem[],
    color: string,
    icon: React.ElementType
  ) => {
    const Icon = icon
    const totalItems = items.length
    const estimatedTime = items.reduce((sum, item) => sum + item.estimated_time_minutes, 0)

    return (
      <div className={`bg-white rounded-2xl shadow-sm border-2 ${color} overflow-hidden`}>
        {/* Header */}
        <div className={`${color.replace('border', 'bg').replace('200', '100')} p-6 border-b-2 ${color}`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 ${color.replace('border', 'bg').replace('100', '500')} rounded-xl flex items-center justify-center shadow-lg`}>
                <Icon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
                <p className="text-sm text-gray-600">{template?.description || `Standard ${title.toLowerCase()} checklist`}</p>
              </div>
            </div>

            <button
              onClick={() => template && handleFillChecklist(template, items)}
              disabled={!template || items.length === 0}
              className={`flex items-center gap-2 px-6 py-3 ${
                template && items.length > 0
                  ? `${color.replace('border', 'bg').replace('100', '500')} hover:${color.replace('border', 'bg').replace('100', '600')} text-white`
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              } rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl`}
            >
              <Play className="w-5 h-5" />
              Fill Checklist
            </button>
          </div>

          {/* Quick Stats */}
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <ListChecks className="w-4 h-4 text-gray-700" />
              <span className="font-medium text-gray-700">{totalItems} Tasks</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-700" />
              <span className="font-medium text-gray-700">~{estimatedTime} min</span>
            </div>
            {template?.is_active && (
              <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full border border-green-200">
                ACTIVE
              </span>
            )}
          </div>
        </div>

        {/* Checklist Items */}
        <div className="p-6">
          {items.length === 0 ? (
            <div className="text-center py-12">
              <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 font-medium">No checklist items configured</p>
              <p className="text-sm text-gray-400 mt-1">Contact administrator to set up this checklist</p>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item, index) => {
                const priorityConfig = PRIORITY_CONFIG[item.priority]
                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="group bg-gray-50 hover:bg-gray-100 rounded-xl p-4 transition-all border border-gray-200 hover:border-gray-300"
                  >
                    <div className="flex items-start gap-4">
                      {/* Number Badge */}
                      <div className="flex-shrink-0 w-8 h-8 bg-white rounded-lg flex items-center justify-center font-bold text-gray-700 border border-gray-300 group-hover:border-gray-400 transition-colors">
                        {index + 1}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <h4 className="font-semibold text-gray-900 group-hover:text-gray-950">
                            {item.title}
                          </h4>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${priorityConfig.color} border`}>
                              {priorityConfig.label}
                            </span>
                            <span className="px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-lg border border-blue-200">
                              {item.estimated_time_minutes} min
                            </span>
                          </div>
                        </div>

                        {item.description && (
                          <p className="text-sm text-gray-600 mb-2">{item.description}</p>
                        )}

                        <div className="flex items-center gap-3 text-xs text-gray-500">
                          <div className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            <span className="capitalize">{item.responsible_role}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}

          {/* Edit Button at Bottom */}
          {template && (
            <div className="border-t border-gray-200 p-4 bg-gray-50">
              <button
                onClick={() => handleEditTemplate(template, items)}
                className={`w-full flex items-center justify-center gap-2 px-4 py-3 ${color.replace('border', 'bg').replace('200', '500')} hover:${color.replace('border', 'bg').replace('200', '600')} text-white rounded-xl font-semibold transition-all shadow-md hover:shadow-lg`}
              >
                <Edit className="w-5 h-5" />
                Edit Checklist Template
              </button>
            </div>
          )}
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading checklists...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <ClipboardCheck className="w-8 h-8 text-blue-600" />
                Checklist Management
              </h1>
              <p className="text-gray-600 mt-1">
                Manage and track examination checklists for <span className="font-semibold capitalize">{activeBranch}</span>
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowHistoryModal(true)}
                className="flex items-center gap-2 px-5 py-3 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors font-medium"
              >
                <History className="w-5 h-5" />
                View History
              </button>

              <button
                onClick={() => setShowCreateCustomModal(true)}
                className="flex items-center gap-2 px-5 py-3 bg-yellow-400 hover:bg-yellow-500 text-black rounded-xl transition-colors font-semibold shadow-lg"
              >
                <Plus className="w-5 h-5" />
                Custom Checklist
              </button>
            </div>
          </div>

          {/* Stats Dashboard */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-xs font-medium text-blue-700">Completed Today</p>
                  <p className="text-2xl font-bold text-blue-900">{stats.total_completed_today}</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                  <ClipboardList className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-xs font-medium text-green-700">Pre-Exam Done</p>
                  <p className="text-2xl font-bold text-green-900">{stats.pre_exam_completed}</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
                  <ClipboardCheck className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-xs font-medium text-purple-700">Post-Exam Done</p>
                  <p className="text-2xl font-bold text-purple-900">{stats.post_exam_completed}</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4 border border-orange-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
                  <Circle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-xs font-medium text-orange-700">Pending</p>
                  <p className="text-2xl font-bold text-orange-900">{stats.pending_checklists}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content - Pre-Exam and Post-Exam Side by Side */}
        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          {/* Pre-Exam Checklist */}
          {renderChecklistCard(
            'Pre-Exam Checklist',
            preExamTemplate,
            preExamItems,
            'border-green-200',
            ClipboardList
          )}

          {/* Post-Exam Checklist */}
          {renderChecklistCard(
            'Post-Exam Checklist',
            postExamTemplate,
            postExamItems,
            'border-purple-200',
            ClipboardCheck
          )}
        </div>

        {/* Custom Checklists Section */}
        {customTemplates.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Sparkles className="w-6 h-6 text-yellow-500" />
                <h2 className="text-2xl font-bold text-gray-900">Custom Checklists</h2>
              </div>
              <span className="px-3 py-1 bg-yellow-100 text-yellow-700 text-sm font-semibold rounded-full">
                {customTemplates.length} Active
              </span>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {customTemplates.map((template) => (
                <motion.div
                  key={template.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-5 border border-gray-200 hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-semibold text-gray-900">{template.name}</h3>
                    {template.is_active && (
                      <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">
                        Active
                      </span>
                    )}
                  </div>

                  {template.description && (
                    <p className="text-sm text-gray-600 mb-4">{template.description}</p>
                  )}

                  <div className="flex gap-2">
                    <button
                      onClick={() => toast('Custom checklist fill feature coming soon')}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
                    >
                      <Play className="w-4 h-4" />
                      Fill
                    </button>
                    <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-white rounded-lg transition-colors">
                      <Edit className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Fill Checklist Modal */}
      <AnimatePresence>
        {showFillModal && selectedTemplate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden"
            >
              <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-500 to-blue-600">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                      <ClipboardCheck className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white">{selectedTemplate.name}</h2>
                      <p className="text-blue-100 text-sm">Complete all tasks and submit</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowFillModal(false)}
                    className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-white" />
                  </button>
                </div>
              </div>

              <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Exam Date *
                  </label>
                  <input
                    type="date"
                    value={fillData.exam_date}
                    onChange={(e) => setFillData(prev => ({ ...prev, exam_date: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="space-y-3">
                  {selectedTemplateItems.map((item, index) => (
                    <div
                      key={item.id}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        fillData.items[item.id]
                          ? 'bg-green-50 border-green-300'
                          : 'bg-white border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <label className="flex items-start gap-4 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={fillData.items[item.id] || false}
                          onChange={(e) => setFillData(prev => ({
                            ...prev,
                            items: { ...prev.items, [item.id]: e.target.checked }
                          }))}
                          className="mt-1 w-5 h-5 rounded border-gray-300 text-green-600 focus:ring-green-500"
                        />
                        <div className="flex-1">
                          <div className="flex items-start justify-between gap-3 mb-1">
                            <h4 className="font-semibold text-gray-900">
                              {index + 1}. {item.title}
                            </h4>
                            <span className={`px-2 py-1 rounded-lg text-xs font-bold ${PRIORITY_CONFIG[item.priority].color}`}>
                              {PRIORITY_CONFIG[item.priority].label}
                            </span>
                          </div>
                          {item.description && (
                            <p className="text-sm text-gray-600">{item.description}</p>
                          )}
                        </div>
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-6 border-t border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    <span className="font-semibold">
                      {Object.values(fillData.items).filter(Boolean).length} / {selectedTemplateItems.length}
                    </span> tasks completed
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowFillModal(false)}
                      className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-xl font-semibold transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={submitChecklist}
                      className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-colors flex items-center gap-2"
                    >
                      <CheckCircle2 className="w-5 h-5" />
                      Submit Checklist
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* History Modal */}
      <AnimatePresence>
        {showHistoryModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowHistoryModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[80vh] overflow-hidden"
            >
              <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-gray-700 to-gray-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                      <History className="w-5 h-5 text-white" />
                    </div>
                    <h2 className="text-xl font-semibold text-white">Checklist History</h2>
                  </div>
                  <button
                    onClick={() => setShowHistoryModal(false)}
                    className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-white" />
                  </button>
                </div>
              </div>

              <div className="p-6 overflow-y-auto max-h-[calc(80vh-100px)]">
                {instances.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 font-medium">No checklist history found</p>
                    <p className="text-sm text-gray-400 mt-1">Filled checklists will appear here</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {instances.map((instance) => (
                      <div
                        key={instance.id}
                        className="flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors border border-gray-200"
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                            instance.completed_at ? 'bg-green-100' : 'bg-orange-100'
                          }`}>
                            {instance.completed_at ? (
                              <CheckCircle2 className="w-6 h-6 text-green-600" />
                            ) : (
                              <Circle className="w-6 h-6 text-orange-600" />
                            )}
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900">{instance.name}</h4>
                            <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {new Date(instance.exam_date).toLocaleDateString()}
                              </span>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                <span className="capitalize">{instance.branch_location}</span>
                              </span>
                              <span>•</span>
                              <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                                instance.completed_at
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-orange-100 text-orange-700'
                              }`}>
                                {instance.completed_at ? 'Completed' : 'Pending'}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleViewInstance(instance)}
                            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-white rounded-lg transition-colors"
                            title="View details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-white rounded-lg transition-colors">
                            <Download className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Template Modal */}
      <AnimatePresence>
        {showEditModal && editingTemplate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
            >
              <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-yellow-400 to-yellow-500">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-black/10 rounded-xl flex items-center justify-center">
                      <Edit className="w-6 h-6 text-black" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-black">Edit {editingTemplate.name}</h2>
                      <p className="text-black/70 text-sm">Add, edit, or remove checklist questions</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowEditModal(false)}
                    className="p-2 hover:bg-black/10 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-black" />
                  </button>
                </div>
              </div>

              <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">Checklist Questions</h3>
                  <button
                    onClick={addQuestionToTemplate}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors font-medium"
                  >
                    <Plus className="w-4 h-4" />
                    Add Question
                  </button>
                </div>

                <div className="space-y-4">
                  {editingItems.map((item, index) => (
                    <div key={item.id} className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                      <div className="flex items-start justify-between mb-3">
                        <h4 className="font-semibold text-gray-900">Question {index + 1}</h4>
                        <button
                          onClick={() => deleteQuestion(item.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                          <input
                            type="text"
                            value={item.title}
                            onChange={(e) => updateQuestion(item.id, { title: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                            placeholder="e.g., Check all workstations are powered on"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                          <textarea
                            value={item.description || ''}
                            onChange={(e) => updateQuestion(item.id, { description: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent resize-none"
                            rows={2}
                            placeholder="Additional details or instructions..."
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Question Type</label>
                            <select
                              value={item.question_type || 'checkbox'}
                              onChange={(e) => updateQuestion(item.id, { question_type: e.target.value as any })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400"
                            >
                              <option value="checkbox">Checkbox</option>
                              <option value="text">Text Input</option>
                              <option value="number">Number Input</option>
                              <option value="dropdown">Dropdown</option>
                              <option value="date">Date Picker</option>
                              <option value="time">Time Picker</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                            <select
                              value={item.priority}
                              onChange={(e) => updateQuestion(item.id, { priority: e.target.value as any })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400"
                            >
                              <option value="low">Low</option>
                              <option value="medium">Medium</option>
                              <option value="high">High</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Time (min)</label>
                            <input
                              type="number"
                              value={item.estimated_time_minutes}
                              onChange={(e) => updateQuestion(item.id, { estimated_time_minutes: parseInt(e.target.value) || 5 })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400"
                              min="1"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                            <select
                              value={item.responsible_role}
                              onChange={(e) => updateQuestion(item.id, { responsible_role: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400"
                            >
                              <option value="staff">Staff</option>
                              <option value="admin">Admin</option>
                              <option value="technical">Technical</option>
                            </select>
                          </div>
                        </div>

                        {/* Dropdown options - only show when question type is dropdown */}
                        {(item.question_type === 'dropdown') && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Dropdown Options (comma-separated)</label>
                            <input
                              type="text"
                              value={(item.dropdown_options || []).join(', ')}
                              onChange={(e) => updateQuestion(item.id, {
                                dropdown_options: e.target.value.split(',').map(opt => opt.trim()).filter(opt => opt)
                              })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400"
                              placeholder="e.g., Option 1, Option 2, Option 3"
                            />
                            <p className="text-xs text-gray-500 mt-1">Separate options with commas</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  {editingItems.length === 0 && (
                    <div className="text-center py-12 bg-gray-50 rounded-xl">
                      <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-600">No questions yet. Click "Add Question" to get started.</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-6 border-t border-gray-200 bg-gray-50 flex justify-between">
                <p className="text-sm text-gray-600 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-2" />
                  Template cannot be deleted, only questions can be modified
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowEditModal(false)}
                    className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-xl font-semibold transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveTemplateChanges}
                    className="px-6 py-3 bg-yellow-400 hover:bg-yellow-500 text-black rounded-xl font-semibold transition-colors flex items-center gap-2"
                  >
                    <Save className="w-5 h-5" />
                    Save Changes
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create Custom Checklist Modal */}
      <AnimatePresence>
        {showCreateCustomModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
            >
              <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-yellow-400 to-yellow-500">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-black/10 rounded-xl flex items-center justify-center">
                      <Sparkles className="w-6 h-6 text-black" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-black">Create Custom Checklist</h2>
                      <p className="text-black/70 text-sm">Design your own checklist template</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowCreateCustomModal(false)}
                    className="p-2 hover:bg-black/10 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-black" />
                  </button>
                </div>
              </div>

              <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Checklist Name *</label>
                      <input
                        type="text"
                        value={customChecklistData.name}
                        onChange={(e) => setCustomChecklistData(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                        placeholder="e.g., Weekend Checklist"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                      <input
                        type="text"
                        value={customChecklistData.description}
                        onChange={(e) => setCustomChecklistData(prev => ({ ...prev, description: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                        placeholder="Brief description of this checklist"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">Questions</h3>
                    <button
                      onClick={addCustomQuestion}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors font-medium"
                    >
                      <Plus className="w-4 h-4" />
                      Add Question
                    </button>
                  </div>

                  <div className="space-y-4">
                    {customChecklistData.questions.map((question, index) => (
                      <div key={question.id} className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                        <div className="flex items-start justify-between mb-3">
                          <h4 className="font-semibold text-gray-900">Question {index + 1}</h4>
                          <button
                            onClick={() => deleteCustomQuestion(question.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="space-y-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                            <input
                              type="text"
                              value={question.title}
                              onChange={(e) => updateCustomQuestion(question.id, { title: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                              placeholder="Enter question text"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                            <textarea
                              value={question.description}
                              onChange={(e) => updateCustomQuestion(question.id, { description: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent resize-none"
                              rows={2}
                              placeholder="Additional details..."
                            />
                          </div>

                          <div className="grid grid-cols-3 gap-3">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Question Type</label>
                              <select
                                value={question.question_type}
                                onChange={(e) => updateCustomQuestion(question.id, { question_type: e.target.value as any })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400"
                              >
                                <option value="checkbox">Checkbox</option>
                                <option value="text">Text Input</option>
                                <option value="number">Number Input</option>
                                <option value="dropdown">Dropdown</option>
                                <option value="date">Date Picker</option>
                                <option value="time">Time Picker</option>
                              </select>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                              <select
                                value={question.priority}
                                onChange={(e) => updateCustomQuestion(question.id, { priority: e.target.value as any })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400"
                              >
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                              </select>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Est. Time (min)</label>
                              <input
                                type="number"
                                value={question.estimated_time_minutes}
                                onChange={(e) => updateCustomQuestion(question.id, { estimated_time_minutes: parseInt(e.target.value) || 5 })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400"
                                min="1"
                              />
                            </div>
                          </div>

                          {/* Dropdown options - only show when question type is dropdown */}
                          {question.question_type === 'dropdown' && (
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Dropdown Options (comma-separated)</label>
                              <input
                                type="text"
                                value={question.dropdown_options.join(', ')}
                                onChange={(e) => updateCustomQuestion(question.id, {
                                  dropdown_options: e.target.value.split(',').map(opt => opt.trim()).filter(opt => opt)
                                })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400"
                                placeholder="e.g., Option 1, Option 2, Option 3"
                              />
                              <p className="text-xs text-gray-500 mt-1">Separate options with commas</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}

                    {customChecklistData.questions.length === 0 && (
                      <div className="text-center py-12 bg-gray-50 rounded-xl">
                        <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                        <p className="text-gray-600">No questions added yet. Click "Add Question" to start building your checklist.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
                <button
                  onClick={() => setShowCreateCustomModal(false)}
                  className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-xl font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={createCustomChecklist}
                  className="px-6 py-3 bg-yellow-400 hover:bg-yellow-500 text-black rounded-xl font-semibold transition-colors flex items-center gap-2"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  Create Checklist
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* View Instance Modal */}
      <AnimatePresence>
        {showViewModal && viewingInstance && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowViewModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-500 to-blue-600">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                      <Eye className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white">{viewingInstance.name}</h2>
                      <p className="text-white/80 text-sm">
                        Submitted on {new Date(viewingInstance.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowViewModal(false)}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-white" />
                  </button>
                </div>

                {/* Status and metadata */}
                <div className="mt-4 flex items-center gap-4 text-sm text-white/90">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    <span className="capitalize">{viewingInstance.branch_location}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>Exam: {new Date(viewingInstance.exam_date).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="w-4 h-4" />
                    <span className="capitalize">{viewingInstance.category}</span>
                  </div>
                  {viewingInstance.completed_at && (
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Completed</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Checklist items */}
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-250px)]">
                <div className="space-y-3">
                  {viewingInstanceItems.length === 0 ? (
                    <div className="text-center py-12">
                      <ClipboardList className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">No items found in this checklist</p>
                    </div>
                  ) : (
                    viewingInstanceItems.map((item, index) => (
                      <div
                        key={item.id}
                        className={`p-4 rounded-xl border-2 transition-all ${
                          item.is_completed
                            ? 'bg-green-50 border-green-200'
                            : 'bg-gray-50 border-gray-200'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 mt-1">
                            {item.is_completed ? (
                              <CheckCircle2 className="w-5 h-5 text-green-600" />
                            ) : (
                              <Circle className="w-5 h-5 text-gray-400" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1">
                                <h4 className="font-medium text-gray-900 mb-1">
                                  {index + 1}. {item.title}
                                </h4>
                                {item.description && (
                                  <p className="text-sm text-gray-600 mb-2">{item.description}</p>
                                )}

                                {/* Show answer for non-checkbox questions */}
                                {item.notes && (
                                  <div className="mt-2 p-3 bg-white rounded-lg border border-gray-200">
                                    <p className="text-xs font-medium text-gray-500 mb-1">Answer:</p>
                                    <p className="text-sm text-gray-900">{item.notes}</p>
                                  </div>
                                )}
                              </div>

                              {item.priority && (
                                <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium border ${
                                  PRIORITY_CONFIG[item.priority as keyof typeof PRIORITY_CONFIG]?.color || 'bg-gray-100 text-gray-700 border-gray-200'
                                }`}>
                                  <span className={`w-1.5 h-1.5 rounded-full ${
                                    PRIORITY_CONFIG[item.priority as keyof typeof PRIORITY_CONFIG]?.dot || 'bg-gray-500'
                                  }`}></span>
                                  {PRIORITY_CONFIG[item.priority as keyof typeof PRIORITY_CONFIG]?.label || item.priority}
                                </span>
                              )}
                            </div>

                            {item.completed_at && (
                              <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                                <Clock className="w-3 h-3" />
                                <span>Completed at {new Date(item.completed_at).toLocaleString()}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="p-6 border-t border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    <span className="font-semibold">
                      {viewingInstanceItems.filter(item => item.is_completed).length} / {viewingInstanceItems.length}
                    </span> tasks completed
                  </div>
                  <button
                    onClick={() => setShowViewModal(false)}
                    className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-semibold transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
