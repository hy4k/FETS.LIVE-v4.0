import React from 'react'
import { X, CheckCircle2 } from 'lucide-react'
import { motion } from 'framer-motion'

interface ChecklistFillModalProps {
  isOpen: boolean
  onClose: () => void
  template: any
  items: any[]
  onSubmit: (data: any) => void
}

export function ChecklistFillModal({ isOpen, onClose, template, items, onSubmit }: ChecklistFillModalProps) {
  const [fillData, setFillData] = React.useState({ exam_date: '', items: {} as { [key: string]: boolean } })

  if (!isOpen || !template) return null

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
        className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden"
      >
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-500 to-blue-600">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">{template.name}</h2>
            <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg transition-colors">
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Exam Date *</label>
            <input
              type="date"
              value={fillData.exam_date}
              onChange={(e) => setFillData(prev => ({ ...prev, exam_date: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="space-y-3">
            {items.map((item, index) => (
              <div key={item.id} className="p-4 rounded-xl border-2 bg-white border-gray-200">
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
                    <h4 className="font-semibold text-gray-900">{index + 1}. {item.title}</h4>
                    {item.description && <p className="text-sm text-gray-600 mt-1">{item.description}</p>}
                  </div>
                </label>
              </div>
            ))}
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 bg-gray-50 flex justify-between">
          <button onClick={onClose} className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-xl font-semibold transition-colors">
            Cancel
          </button>
          <button onClick={() => onSubmit(fillData)} className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-colors flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5" />
            Submit
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}
