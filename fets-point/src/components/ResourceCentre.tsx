import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, Filter, Plus, AlertTriangle, Phone, Copy, ExternalLink, FolderLock,
  Pin, Share2, BookOpen, FileText, Zap, Clock, Tag, Star,
  X, ChevronRight, Download, Eye, Edit, Trash2, Bookmark,
  Shield, Wifi, Database, Settings, Users, Activity, Layers,
  CheckCircle, TrendingUp
} from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import { toast } from 'react-hot-toast'

interface VaultCategory {
  id: string
  name: string
  icon: string
  color: string
  description?: string
  display_order: number
}

interface VaultItem {
  id: string
  title: string
  description: string
  content: string
  category: string
  type: string
  file_url: string
  priority: string
  tags: string[]
  is_confidential: boolean
  is_deleted: boolean
  category_id: string
  author_id: string
  created_at: string
  updated_at: string
}

interface ItemPin {
  id: string
  item_id: string
  user_id: string
  created_at: string
}

const PRIORITY_CONFIG = {
  high: { color: 'bg-red-50 text-red-700 border-red-200', dot: 'bg-red-500', label: 'High Priority', gradient: 'from-red-500 to-red-600' },
  normal: { color: 'bg-blue-50 text-blue-700 border-blue-200', dot: 'bg-blue-500', label: 'Normal', gradient: 'from-blue-500 to-blue-600' },
  low: { color: 'bg-gray-50 text-gray-700 border-gray-200', dot: 'bg-gray-500', label: 'Low Priority', gradient: 'from-gray-500 to-gray-600' }
}

const TYPE_CONFIG = {
  sop: { icon: BookOpen, color: 'bg-purple-500', label: 'SOP', gradient: 'from-purple-500 to-purple-600' },
  contact: { icon: Phone, color: 'bg-green-500', label: 'Contact', gradient: 'from-green-500 to-green-600' },
  document: { icon: FileText, color: 'bg-blue-500', label: 'Document', gradient: 'from-blue-500 to-blue-600' },
  procedure: { icon: Settings, color: 'bg-orange-500', label: 'Procedure', gradient: 'from-orange-500 to-orange-600' },
  emergency: { icon: AlertTriangle, color: 'bg-red-500', label: 'Emergency', gradient: 'from-red-500 to-red-600' }
}

export default function ResourceCentre() {
  const { profile } = useAuth()

  const [categories, setCategories] = useState<VaultCategory[]>([])
  const [items, setItems] = useState<VaultItem[]>([])
  const [pins, setPins] = useState<ItemPin[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedItem, setSelectedItem] = useState<VaultItem | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showCategoryModal, setShowCategoryModal] = useState(false)
  const [loading, setLoading] = useState(true)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // Add Resource Form State
  const [newResource, setNewResource] = useState({
    title: '',
    description: '',
    content: '',
    type: 'document',
    priority: 'normal',
    category_id: '',
    file_url: '',
    is_confidential: false
  })

  // Edit Resource State
  const [editResource, setEditResource] = useState<VaultItem | null>(null)

  // Category Management State
  const [categoryForm, setCategoryForm] = useState({
    id: '',
    name: '',
    icon: '',
    color: '#3B82F6',
    description: ''
  })

  const loadCategories = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('vault_categories')
        .select('*')
        .order('display_order', { ascending: true })

      if (error) throw error
      setCategories(data || [])
    } catch (error) {
      console.error('Error loading categories:', error)
      toast.error('Failed to load categories')
    }
  }, [])

  const loadItems = useCallback(async () => {
    try {
      if (!profile) return

      const { data: userProfile, error: profileError } = await supabase
        .from('staff_profiles')
        .select('role')
        .eq('user_id', profile.user_id)
        .single()

      if (profileError) {
        console.error('Profile error:', profileError)
      }
      setUserRole(userProfile?.role || null)

      let query = supabase
        .from('vault')
        .select('*')
        .eq('is_deleted', false)
        .order('priority', { ascending: false })
        .order('updated_at', { ascending: false })

      if (selectedCategory) {
        query = query.eq('category_id', selectedCategory)
      }

      if (searchQuery) {
        query = query.or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%,content.ilike.%${searchQuery}%`)
      }

      const { data, error } = await query
      if (error) {
        throw new Error(`Failed to load resources: ${error.message}`)
      }

      setItems(data || [])
    } catch (error: any) {
      console.error('Error loading items:', error)
      toast.error(error?.message || 'Failed to load resources')
    }
  }, [profile, selectedCategory, searchQuery])

  const loadPins = useCallback(async () => {
    if (!profile?.id) return

    try {
      const { data, error } = await supabase
        .from('vault_item_pins')
        .select('*')
        .eq('user_id', profile.id)

      if (error) {
        throw new Error(`Failed to load pins: ${error.message}`)
      }
      setPins(data || [])
    } catch (error: any) {
      console.error('Error loading pins:', error)
    }
  }, [profile])

  // Load all data
  const loadAllData = useCallback(async () => {
    setLoading(true)
    try {
      await Promise.all([loadCategories(), loadPins()])
      await loadItems()
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }, [loadCategories, loadPins, loadItems])

  useEffect(() => {
    loadAllData()
  }, [selectedCategory, searchQuery])

  const pinnedItems = useMemo(() => {
    const pinnedIds = pins.map(p => p.item_id)
    return items.filter(item => pinnedIds.includes(item.id))
  }, [items, pins])

  const togglePin = async (itemId: string) => {
    if (!profile?.id) return

    try {
      const existingPin = pins.find(p => p.item_id === itemId)

      if (existingPin) {
        await supabase.from('vault_item_pins').delete().eq('id', existingPin.id)
        setPins(pins.filter(p => p.id !== existingPin.id))
        toast.success('Unpinned from Quick Access')
      } else {
        const { data, error } = await supabase
          .from('vault_item_pins')
          .insert({ item_id: itemId, user_id: profile.id })
          .select()
          .single()

        if (error) throw error
        setPins([...pins, data])
        toast.success('Pinned to Quick Access')
      }
    } catch (error) {
      console.error('Error toggling pin:', error)
      toast.error('Failed to update pin')
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Copied to clipboard!')
  }

  const viewDetails = (item: VaultItem) => {
    setSelectedItem(item)
    setShowDetailModal(true)
  }

  const createResource = async () => {
    if (!profile?.id) {
      toast.error('You must be logged in to create a resource')
      return
    }

    if (!newResource.title.trim()) {
      toast.error('Title is required')
      return
    }

    if (!newResource.content.trim()) {
      toast.error('Content is required')
      return
    }

    setSubmitting(true)
    try {
      const { error } = await supabase
        .from('vault')
        .insert({
          title: newResource.title,
          description: newResource.description,
          content: newResource.content,
          type: newResource.type,
          priority: newResource.priority,
          category_id: newResource.category_id || categories[0]?.id,
          file_url: newResource.file_url,
          tags: [],
          is_confidential: newResource.is_confidential,
          author_id: profile.id,
          category: categories.find(c => c.id === newResource.category_id)?.name || 'General'
        })
        .select()
        .single()

      if (error) throw error

      toast.success('Resource created successfully!')
      setShowAddModal(false)
      setNewResource({
        title: '',
        description: '',
        content: '',
        type: 'document',
        priority: 'normal',
        category_id: '',
        file_url: '',
        is_confidential: false
      })
      loadAllData()
    } catch (error: any) {
      console.error('Error creating resource:', error)
      toast.error(error?.message || 'Failed to create resource')
    } finally {
      setSubmitting(false)
    }
  }

  const updateResource = async () => {
    if (!editResource || !profile?.id) return

    setSubmitting(true)
    try {
      const { error } = await supabase
        .from('vault')
        .update({
          title: editResource.title,
          description: editResource.description,
          content: editResource.content,
          type: editResource.type,
          priority: editResource.priority,
          category_id: editResource.category_id,
          file_url: editResource.file_url,
          is_confidential: editResource.is_confidential,
          updated_at: new Date().toISOString()
        })
        .eq('id', editResource.id)

      if (error) throw error

      toast.success('Resource updated successfully!')
      setShowEditModal(false)
      setEditResource(null)
      loadAllData()
    } catch (error: any) {
      console.error('Error updating resource:', error)
      toast.error(error?.message || 'Failed to update resource')
    } finally {
      setSubmitting(false)
    }
  }

  const deleteResource = async (resourceId: string) => {
    if (!window.confirm('Are you sure you want to delete this resource? This action cannot be undone.')) return

    try {
      const { error } = await supabase
        .from('vault')
        .update({
          is_deleted: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', resourceId)

      if (error) throw error

      toast.success('Resource deleted successfully!')
      setShowDetailModal(false)
      setShowEditModal(false)
      loadAllData()
    } catch (error: any) {
      console.error('Error deleting resource:', error)
      toast.error(`Failed to delete resource: ${error.message || 'Unknown error'}`)
    }
  }

  const saveCategory = async () => {
    if (!categoryForm.name.trim()) {
      toast.error('Category name is required')
      return
    }

    setSubmitting(true)
    try {
      if (categoryForm.id) {
        const { error } = await supabase
          .from('vault_categories')
          .update({
            name: categoryForm.name,
            icon: categoryForm.icon,
            color: categoryForm.color,
            description: categoryForm.description
          })
          .eq('id', categoryForm.id)

        if (error) throw error
        toast.success('Category updated successfully!')
      } else {
        const { error } = await supabase
          .from('vault_categories')
          .insert({
            name: categoryForm.name,
            icon: categoryForm.icon,
            color: categoryForm.color,
            description: categoryForm.description,
            display_order: categories.length,
            created_by: profile?.id
          })

        if (error) throw error
        toast.success('Category created successfully!')
      }

      setShowCategoryModal(false)
      setCategoryForm({ id: '', name: '', icon: '', color: '#3B82F6', description: '' })
      loadCategories()
    } catch (error: any) {
      console.error('Error saving category:', error)
      toast.error(error?.message || 'Failed to save category')
    } finally {
      setSubmitting(false)
    }
  }

  const deleteCategory = async (categoryId: string) => {
    if (!window.confirm('Are you sure you want to delete this category? Resources in this category will not be affected.')) return

    try {
      const { error } = await supabase
        .from('vault_categories')
        .delete()
        .eq('id', categoryId)

      if (error) throw error

      toast.success('Category deleted successfully!')
      setShowCategoryModal(false)
      loadCategories()
    } catch (error: any) {
      console.error('Error deleting category:', error)
      toast.error(error?.message || 'Failed to delete category')
    }
  }

  const handleEditResource = (item: VaultItem) => {
    setEditResource({ ...item })
    setShowEditModal(true)
  }

  const isAdmin = userRole === 'admin' || userRole === 'super_admin'

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-2 uppercase text-gold-gradient">Resource Centre</h1>
          <p className="text-gray-500 mt-1">Central repository for training, SOPs, and credentials.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search resources..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 w-full md:w-64 transition-all shadow-sm"
            />
          </div>
          {isAdmin && (
            <button
              onClick={() => setShowAddModal(true)}
              className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
              title="Add New Resource"
            >
              <Plus className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar Categories */}
        <div className="w-full lg:w-64 flex-shrink-0 space-y-1">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${selectedCategory === null
              ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-gray-200'
              : 'text-gray-600 hover:bg-gray-100'
              }`}
          >
            <Layers className="w-4 h-4" />
            All Resources
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${selectedCategory === cat.id
                ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-gray-200'
                : 'text-gray-600 hover:bg-gray-100'
                }`}
            >
              <FolderLock className="w-4 h-4" />
              {cat.name}
            </button>
          ))}

          {isAdmin && (
            <button
              onClick={() => setShowCategoryModal(true)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-gray-400 hover:text-gray-600 hover:bg-gray-50 mt-4 border-t border-gray-100 transition-colors"
            >
              <Settings className="w-4 h-4" />
              Manage Categories
            </button>
          )}
        </div>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {/* Quick Access Section */}
          {pinnedItems.length > 0 && !searchQuery && !selectedCategory && (
            <div className="mb-8">
              <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Pin className="w-3 h-3" /> Quick Access
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {pinnedItems.map(item => {
                  const typeConfig = TYPE_CONFIG[item.type as keyof typeof TYPE_CONFIG] || TYPE_CONFIG.document
                  const TypeIcon = typeConfig.icon
                  const colorClass = typeConfig.color.split('-')[1] // e.g., 'purple' from 'bg-purple-500'

                  return (
                    <div
                      key={item.id}
                      onClick={() => viewDetails(item)}
                      className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all cursor-pointer group relative"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className={`p-2 rounded-lg ${typeConfig.color} bg-opacity-10 text-${colorClass}-600`}>
                          <TypeIcon size={18} />
                        </div>
                        <Pin className="w-4 h-4 text-amber-400 fill-amber-400" />
                      </div>
                      <h3 className="font-semibold text-gray-900 truncate pr-6">{item.title}</h3>
                      <p className="text-xs text-gray-500 mt-1 line-clamp-1">{item.description}</p>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Resources List */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">
                {selectedCategory ? categories.find(c => c.id === selectedCategory)?.name : 'Library'}
              </h2>
              <span className="text-sm text-gray-500">{items.length} items</span>
            </div>

            {items.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-xl border border-gray-200 border-dashed">
                <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Search className="w-5 h-5 text-gray-400" />
                </div>
                <p className="text-gray-900 font-medium">No resources found</p>
                <p className="text-sm text-gray-500 mt-1">
                  {searchQuery ? 'Try adjusting your search terms' : 'Select a different category or add a new resource'}
                </p>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="divide-y divide-gray-100">
                  {items.map(item => {
                    const typeConfig = TYPE_CONFIG[item.type as keyof typeof TYPE_CONFIG] || TYPE_CONFIG.document
                    const TypeIcon = typeConfig.icon
                    const colorClass = typeConfig.color.split('-')[1]
                    const isPinned = pins.some(p => p.item_id === item.id)

                    return (
                      <div
                        key={item.id}
                        onClick={() => viewDetails(item)}
                        className="p-4 hover:bg-gray-50 transition-colors cursor-pointer flex items-center gap-4 group"
                      >
                        <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${typeConfig.color} bg-opacity-10`}>
                          <TypeIcon size={20} className={`text-${colorClass}-600`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium text-gray-900 truncate">{item.title}</h3>
                            {item.is_confidential && (
                              <div className="flex-shrink-0" title="Confidential">
                                <Shield className="w-3 h-3 text-red-500" />
                              </div>
                            )}
                            {item.priority === 'high' && (
                              <span className="px-1.5 py-0.5 bg-red-100 text-red-700 text-[10px] font-bold uppercase rounded">
                                High
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-500 truncate">{item.description}</p>
                        </div>
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => { e.stopPropagation(); togglePin(item.id); }}
                            className={`p-2 rounded-full hover:bg-gray-200 transition-colors ${isPinned ? 'text-amber-500' : 'text-gray-400'}`}
                            title={isPinned ? "Unpin" : "Pin to Quick Access"}
                          >
                            <Pin className={`w-4 h-4 ${isPinned ? 'fill-amber-500' : ''}`} />
                          </button>
                          <ChevronRight className="w-4 h-4 text-gray-300" />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Resource Modal */}
      {showAddModal && (
        <ResourceFormModal
          title="Add New Resource"
          categories={categories}
          resource={newResource}
          setResource={setNewResource}
          onSave={createResource}
          onClose={() => {
            setShowAddModal(false)
            setNewResource({
              title: '',
              description: '',
              content: '',
              type: 'document',
              priority: 'normal',
              category_id: '',
              file_url: '',
              is_confidential: false
            })
          }}
          submitting={submitting}
        />
      )}

      {/* Edit Resource Modal */}
      {showEditModal && editResource && (
        <ResourceFormModal
          title="Edit Resource"
          categories={categories}
          resource={editResource}
          setResource={setEditResource}
          onSave={updateResource}
          onClose={() => {
            setShowEditModal(false)
            setEditResource(null)
          }}
          submitting={submitting}
          onDelete={() => deleteResource(editResource.id)}
        />
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedItem && (
        <ResourceDetailModal
          item={selectedItem}
          onClose={() => {
            setShowDetailModal(false)
            setSelectedItem(null)
          }}
          onEdit={() => {
            setShowDetailModal(false)
            handleEditResource(selectedItem)
          }}
          onPin={() => togglePin(selectedItem.id)}
          isPinned={pins.some(p => p.item_id === selectedItem.id)}
          copyToClipboard={copyToClipboard}
          typeConfig={TYPE_CONFIG[selectedItem.type as keyof typeof TYPE_CONFIG] || TYPE_CONFIG.document}
          priorityConfig={PRIORITY_CONFIG[selectedItem.priority as keyof typeof PRIORITY_CONFIG] || PRIORITY_CONFIG.normal}
          isAdmin={isAdmin}
        />
      )}
      {/* Category Modal */}
      {showCategoryModal && (
        <CategoryFormModal
          category={categoryForm}
          setCategory={setCategoryForm}
          onSave={saveCategory}
          onClose={() => setShowCategoryModal(false)}
          submitting={submitting}
          onDelete={categoryForm.id ? () => deleteCategory(categoryForm.id) : undefined}
        />
      )}
    </div>
  )
}

// Resource Form Modal Component
function ResourceFormModal({ title, categories, resource, setResource, onSave, onClose, submitting, onDelete }: any) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden"
      >
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-indigo-500 to-purple-600">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white">{title}</h2>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/20 transition-colors">
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4 max-h-[calc(90vh-180px)] overflow-y-auto">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Title *</label>
            <input
              type="text"
              value={resource.title}
              onChange={(e) => setResource({ ...resource, title: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all"
              placeholder="Resource title"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
            <textarea
              value={resource.description}
              onChange={(e) => setResource({ ...resource, description: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 resize-none transition-all"
              rows={2}
              placeholder="Brief description"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Content *</label>
            <textarea
              value={resource.content}
              onChange={(e) => setResource({ ...resource, content: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 resize-none transition-all"
              rows={6}
              placeholder="Full content, instructions, or details..."
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Category *</label>
              <select
                value={resource.category_id}
                onChange={(e) => setResource({ ...resource, category_id: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all"
                required
              >
                <option value="">Select category</option>
                {categories.map((cat: any) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Type *</label>
              <select
                value={resource.type}
                onChange={(e) => setResource({ ...resource, type: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all"
                required
              >
                <option value="document">Document</option>
                <option value="sop">SOP</option>
                <option value="contact">Contact</option>
                <option value="procedure">Procedure</option>
                <option value="emergency">Emergency</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Priority *</label>
              <select
                value={resource.priority}
                onChange={(e) => setResource({ ...resource, priority: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all"
                required
              >
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">File URL (optional)</label>
            <input
              type="url"
              value={resource.file_url}
              onChange={(e) => setResource({ ...resource, file_url: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all"
              placeholder="https://..."
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="is_confidential"
              checked={resource.is_confidential}
              onChange={(e) => setResource({ ...resource, is_confidential: e.target.checked })}
              className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <label htmlFor="is_confidential" className="ml-2 text-sm font-medium text-gray-700">
              Mark as confidential (restricted access)
            </label>
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 flex items-center justify-between">
          <div>
            {onDelete && (
              <button
                onClick={onDelete}
                className="px-6 py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-all font-semibold flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-all font-semibold"
            >
              Cancel
            </button>
            <button
              onClick={onSave}
              disabled={submitting}
              className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl hover:from-indigo-600 hover:to-purple-700 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Save
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

// Resource Detail Modal Component
function ResourceDetailModal({ item, onClose, onEdit, onPin, isPinned, copyToClipboard, typeConfig, priorityConfig, isAdmin }: any) {
  const TypeIcon = typeConfig.icon

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
      >
        <div className={`p-6 border-b border-gray-200 bg-gradient-to-r ${typeConfig.gradient}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                <TypeIcon className="w-7 h-7 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">{item.title}</h2>
                <p className="text-white/90 text-sm mt-1">{typeConfig.label}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={onPin}
                className="p-2.5 rounded-lg bg-white/20 hover:bg-white/30 transition-colors"
                title={isPinned ? "Unpin" : "Pin to Quick Access"}
              >
                <Pin className={`w-5 h-5 ${isPinned ? 'text-yellow-300 fill-yellow-300' : 'text-white'}`} />
              </button>
              {isAdmin && (
                <button
                  onClick={onEdit}
                  className="p-2.5 rounded-lg bg-white/20 hover:bg-white/30 transition-colors"
                  title="Edit resource"
                >
                  <Edit className="w-5 h-5 text-white" />
                </button>
              )}
              <button
                onClick={onClose}
                className="p-2.5 rounded-lg bg-white/20 hover:bg-white/30 transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>
        </div>

        <div className="p-6 max-h-[calc(90vh-180px)] overflow-y-auto space-y-6">
          {item.description && (
            <div>
              <h3 className="font-bold text-gray-900 mb-2">Description</h3>
              <p className="text-gray-700">{item.description}</p>
            </div>
          )}

          <div>
            <h3 className="font-bold text-gray-900 mb-2">Content</h3>
            <div className="bg-gray-50 rounded-xl p-4 whitespace-pre-wrap text-gray-700 leading-relaxed">
              {item.content}
            </div>
            <button
              onClick={() => copyToClipboard(item.content)}
              className="mt-3 flex items-center gap-2 px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition-all text-sm font-medium"
            >
              <Copy className="w-4 h-4" />
              Copy Content
            </button>
          </div>

          {item.file_url && (
            <div>
              <h3 className="font-bold text-gray-900 mb-2">Attached File</h3>
              <a
                href={item.file_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-all text-sm font-medium w-fit"
              >
                <ExternalLink className="w-4 h-4" />
                Open File
              </a>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-xl p-4">
              <h4 className="font-semibold text-gray-900 mb-2 text-sm">Priority</h4>
              <span className={`px-4 py-2 rounded-lg text-sm font-semibold ${priorityConfig.color} border inline-block`}>
                {priorityConfig.label}
              </span>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <h4 className="font-semibold text-gray-900 mb-2 text-sm">Type</h4>
              <span className="px-4 py-2 rounded-lg text-sm font-semibold bg-white border border-gray-200 inline-block">
                {typeConfig.label}
              </span>
            </div>
          </div>

          {item.is_confidential && (
            <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 flex items-center gap-3">
              <Shield className="w-5 h-5 text-red-600" />
              <span className="text-sm font-semibold text-red-700">Confidential - Restricted Access</span>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-all font-semibold"
          >
            Close
          </button>
        </div>
      </motion.div>
    </div>
  )
}

// Category Form Modal Component
function CategoryFormModal({ category, setCategory, onSave, onClose, submitting, onDelete }: any) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
      >
        <div className="p-6 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900">{category.id ? 'Edit Category' : 'New Category'}</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-200 transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Name *</label>
            <input
              type="text"
              value={category.name}
              onChange={(e) => setCategory({ ...category, name: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all"
              placeholder="e.g. Training, SOPs"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
            <textarea
              value={category.description}
              onChange={(e) => setCategory({ ...category, description: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 resize-none transition-all"
              rows={3}
              placeholder="Optional description"
            />
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 flex items-center justify-between">
          <div>
            {onDelete && (
              <button
                onClick={onDelete}
                className="text-red-600 hover:text-red-700 font-medium text-sm flex items-center gap-1"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all font-medium"
            >
              Cancel
            </button>
            <button
              onClick={onSave}
              disabled={submitting}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all font-medium disabled:opacity-50 flex items-center gap-2"
            >
              {submitting ? 'Saving...' : 'Save Category'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
