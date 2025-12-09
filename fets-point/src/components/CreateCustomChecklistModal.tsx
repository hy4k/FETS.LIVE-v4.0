import React, { useState } from 'react'
import { X, Plus, Trash2, Save } from 'lucide-react'
import { motion } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import toast from 'react-hot-toast'
import { ChecklistPriority } from '../types'

interface CreateCustomChecklistModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

interface CustomItem {
  id: string
  title: string
  description: string
  priority: ChecklistPriority
}

export function CreateCustomChecklistModal({ isOpen, onClose, onSuccess }: CreateCustomChecklistModalProps) {
  const { user } = useAuth()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [items, setItems] = useState<CustomItem[]>([])
  const [saving, setSaving] = useState(false)

  const addItem = () => {
    setItems([...items, {
      id: `item-${Date.now()}`,
      title: '',
      description: '',
      priority: 'medium'
    }])
  }

  const removeItem = (id: string) => {
    setItems(items.filter(item => item.id !== id))
  }

  const updateItem = (id: string, field: keyof CustomItem, value: string) => {
    setItems(items.map(item =>
      item.id === id ? { ...item, [field]: value } : item
    ))
  }

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('Please enter a checklist name')
      return
    }

    if (items.length === 0) {
      toast.error('Please add at least one item')
      return
    }

    if (items.some(item => !item.title.trim())) {
      toast.error('All items must have a title')
      return
    }

    try {
      setSaving(true)

      const { data: template, error: templateError } = await supabase
        .from('checklist_templates')
        .insert({
          name,
          description,
          category: 'custom',
          created_by: user?.id,
          is_active: true
        })
        .select()
        .single()

      if (templateError) throw templateError

      const templateItems = items.map((item, index) => ({
        template_id: template.id,
        title: item.title,
        description: item.description || null,
        priority: item.priority,
        sort_order: index,
        estimated_time_minutes: 5,
        responsible_role: 'staff'
      }))

      const { error: itemsError } = await supabase
        .from('checklist_template_items')
        .insert(templateItems)

      if (itemsError) throw itemsError

      toast.success('Custom checklist created successfully!')
      onSuccess()
      onClose()
      setName('')
      setDescription('')
      setItems([])
    } catch (error: any) {
      toast.error(`Failed to create checklist: ${error.message}`)
    } finally {
      setSaving(false)
    }
  }

  if (!isOpen) return null

  return (
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
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
      >
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-amber-500 to-yellow-600">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">Create Custom Checklist</h2>
            <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg transition-colors">
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Checklist Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Daily Safety Check"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the purpose of this checklist..."
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <label className="block text-sm font-medium text-gray-700">Items *</label>
              <button
                onClick={addItem}
                className="px-3 py-1 bg-amber-100 hover:bg-amber-200 text-amber-700 rounded-lg text-sm font-medium transition-colors flex items-center gap-1"
              >
                <Plus size={16} />
                Add Item
              </button>
            </div>

            {items.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                <p className="text-gray-500 mb-3">No items added yet</p>
                <button
                  onClick={addItem}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-medium transition-colors inline-flex items-center gap-2"
                >
                  <Plus size={16} />
                  Add First Item
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {items.map((item, index) => (
                  <div key={item.id} className="p-4 border border-gray-200 rounded-xl space-y-3">
                    <div className="flex items-start gap-3">
                      <span className="text-sm font-semibold text-gray-500 mt-3">{index + 1}.</span>
                      <div className="flex-1 space-y-3">
                        <input
                          type="text"
                          value={item.title}
                          onChange={(e) => updateItem(item.id, 'title', e.target.value)}
                          placeholder="Item title"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                        />
                        <textarea
                          value={item.description}
                          onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                          placeholder="Item description (optional)"
                          rows={2}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none"
                        />
                        <select
                          value={item.priority}
                          onChange={(e) => updateItem(item.id, 'priority', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                        >
                          <option value="low">Low Priority</option>
                          <option value="medium">Medium Priority</option>
                          <option value="high">High Priority</option>
                        </select>
                      </div>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 bg-gray-50 flex justify-between">
          <button
            onClick={onClose}
            className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-xl font-semibold transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-semibold transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Saving...
              </>
            ) : (
              <>
                <Save size={18} />
                Create Checklist
              </>
            )}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}
