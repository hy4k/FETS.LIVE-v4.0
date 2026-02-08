import React, { useState, useEffect } from 'react'
import { X, Trash2, Save, ChevronLeft, Zap, Clock } from 'lucide-react'
import { SHIFT_CODES } from '../types/shared'
import { useIsMobile } from '../hooks/use-mobile'

interface ShiftCellPopupProps {
  isOpen: boolean
  onClose: () => void
  onSave: (shiftData: { shift_code: string; overtime_hours: number }) => void
  onDelete: () => void
  currentShift?: string
  currentOvertimeHours?: number
  staffName: string
  date: string
}

// Apple-inspired shift color scheme - all options including OT
const SHIFT_OPTIONS = {
  'D': SHIFT_CODES.D,
  'E': SHIFT_CODES.E, 
  'HD': SHIFT_CODES.HD,
  'RD': SHIFT_CODES.RD,
  'L': SHIFT_CODES.L,
  'OT': SHIFT_CODES.OT,
  'T': SHIFT_CODES.T
}

export const ShiftCellPopup: React.FC<ShiftCellPopupProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  currentShift = '',
  currentOvertimeHours = 0,
  staffName,
  date
}) => {
  const isMobile = useIsMobile()
  const [selectedShift, setSelectedShift] = useState(currentShift)
  const [overtimeHours, setOvertimeHours] = useState(currentOvertimeHours)

  useEffect(() => {
    setSelectedShift(currentShift)
    setOvertimeHours(currentOvertimeHours)
  }, [currentShift, currentOvertimeHours])

  const handleSave = () => {
    onSave({
      shift_code: selectedShift,
      overtime_hours: overtimeHours
    })
    onClose()
  }

  const handleDelete = () => {
    onDelete()
    onClose()
  }

  const getCellPreview = () => {
    if (!selectedShift) return { bg: '#f3f4f6', text: '#9ca3af', display: '' }
    
    const shiftInfo = SHIFT_OPTIONS[selectedShift as keyof typeof SHIFT_OPTIONS]
    if (!shiftInfo) return { bg: '#f3f4f6', text: '#9ca3af', display: selectedShift }
    
    // Handle D+OT and E+OT combinations
    if (overtimeHours > 0 && (selectedShift === 'D' || selectedShift === 'E')) {
      return {
        bg: SHIFT_CODES.OT.bgColor,
        text: SHIFT_CODES.OT.textColor,
        display: `${selectedShift}+OT`
      }
    }
    
    return {
      bg: shiftInfo.bgColor,
      text: shiftInfo.textColor,
      display: shiftInfo.letter
    }
  }

  if (!isOpen) return null

  const preview = getCellPreview()

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Glassmorphic backdrop */}
      {!isMobile && (
        <div 
          className="absolute inset-0 backdrop-blur-xl bg-black/30"
          onClick={onClose}
        />
      )}
      
      {/* Popup container - Apple-style */}
      <div className={`relative w-full overflow-hidden transform transition-all duration-300 scale-100 ${
        isMobile 
        ? 'h-full bg-white flex flex-col pt-safe' 
        : 'max-w-lg bg-white/95 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/30'
      }`}>
        {/* Header */}
        <div className={`${isMobile ? 'px-6 pt-12 pb-6' : 'px-8 py-6'} bg-gradient-to-r from-gray-50/90 to-gray-100/90 border-b border-gray-200/50 flex-none`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
               {isMobile && (
                 <button onClick={onClose} className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center">
                    <ChevronLeft size={24} />
                 </button>
               )}
               <div>
                  <h3 className="text-xl font-bold text-gray-900 tracking-wide uppercase italic tracking-tighter">{staffName}</h3>
                  <p className="text-xs text-gray-600 font-bold uppercase tracking-widest">
                    {new Date(date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                  </p>
               </div>
            </div>
            {!isMobile && (
              <button
                onClick={onClose}
                className="p-3 hover:bg-gray-200/50 rounded-full transition-all duration-200 hover:scale-110"
              >
                <X className="h-6 w-6 text-gray-500" />
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className={`${isMobile ? 'px-6 py-8' : 'px-8 py-6'} space-y-8 flex-1 overflow-y-auto no-scrollbar`}>
          {/* Shift Selector Grid */}
          <div>
            <label className="block text-[10px] font-black text-slate-400 mb-6 tracking-[0.3em] uppercase italic">Personnel Allocation</label>
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(SHIFT_OPTIONS).map(([code, option]) => (
                <button
                  key={code}
                  onClick={() => setSelectedShift(code)}
                  className={`
                    p-6 rounded-[30px] border-2 transition-all duration-300
                    ${
                      selectedShift === code
                        ? 'border-amber-400 bg-amber-50 shadow-xl shadow-amber-200'
                        : 'border-slate-50 bg-slate-50 text-slate-400'
                    }
                  `}
                >
                  <div className="flex flex-col items-center gap-2">
                    <div className="font-black text-2xl tracking-tighter">{option.letter}</div>
                    <div className="text-[10px] font-black uppercase tracking-widest opacity-60">{option.name}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Overtime Hours */}
          <div>
            <label className="block text-[10px] font-black text-slate-400 mb-4 tracking-[0.3em] uppercase italic">Extra Operational Hours</label>
            <div className="relative">
              <input
                type="number"
                min="0"
                max="12"
                step="0.5"
                value={overtimeHours}
                onChange={(e) => setOvertimeHours(parseFloat(e.target.value) || 0)}
                className="w-full px-8 py-6 bg-slate-50 border-none rounded-[30px] focus:ring-4 focus:ring-amber-100 outline-none transition-all duration-200 text-2xl font-black text-slate-800 shadow-inner"
                placeholder="0"
              />
              <div className="absolute right-8 top-1/2 -translate-y-1/2 text-sm text-slate-300 font-black uppercase tracking-widest">hours</div>
            </div>
          </div>

          {/* Live Preview */}
          <div className="bg-[#3E2723] p-8 rounded-[40px] shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5">
               <Zap size={100} className="text-white" />
            </div>
            <div className="text-[9px] font-black text-amber-500/50 mb-6 tracking-[0.4em] uppercase text-center">Protocol Preview</div>
            <div className="flex flex-col items-center gap-4">
              <div 
                className="w-20 h-20 rounded-[25px] flex items-center justify-center font-black text-2xl shadow-2xl border-4 border-white/10"
                style={{ 
                  background: preview.bg, 
                  color: preview.text,
                }}
              >
                {preview.display || '?'}
              </div>
              {selectedShift && (
                <p className="text-center text-sm text-white font-black uppercase tracking-widest">
                  {SHIFT_OPTIONS[selectedShift as keyof typeof SHIFT_OPTIONS]?.name}
                  {overtimeHours > 0 && <span className="text-amber-500 block mt-1">+{overtimeHours}H OVERTIME</span>}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className={`${isMobile ? 'px-6 py-8 pb-12' : 'px-8 py-6'} bg-white border-t border-slate-50 flex-none`}>
          <div className="flex gap-4">
            <button
              onClick={handleDelete}
              className="w-14 h-14 flex items-center justify-center bg-rose-50 text-rose-500 rounded-2xl active:scale-90 transition-all shadow-sm border border-rose-100"
            >
              <Trash2 size={24} />
            </button>
            
            <button
              onClick={handleSave}
              className="flex-1 flex items-center justify-center gap-3 px-6 h-14 bg-[#F6C845] text-[#3E2723] font-black uppercase tracking-[0.2em] rounded-2xl active:scale-95 transition-all shadow-xl shadow-amber-500/20"
            >
              <Save size={20} />
              <span>Deploy Shift</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
