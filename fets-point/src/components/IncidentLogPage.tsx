import React from 'react'
import { motion } from 'framer-motion'
import { AlertTriangle, Shield } from 'lucide-react'
import IncidentManager from './IncidentManager'

/**
 * IncidentLogPage - A dedicated, standalone page for the Incident Log.
 * This component wraps the IncidentManager with its own header and layout,
 * separating it from the FETS Intelligence page.
 */
export function IncidentLogPage() {
  return (
    <div className="min-h-screen pt-8 pb-12 px-4 md:px-8 bg-[#EEF2F9] font-['Montserrat']">
      <div className="max-w-[1600px] mx-auto">

        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="p-4 bg-gradient-to-br from-rose-500 to-rose-600 rounded-2xl shadow-lg shadow-rose-200 text-white">
              <AlertTriangle size={32} />
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <div className="h-0.5 w-10 bg-rose-500 rounded-full"></div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Operational Safety</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-black text-slate-800 tracking-tight uppercase">
                Incident <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-amber-500">Log</span>
              </h1>
            </div>
          </div>
          <p className="text-slate-500 font-medium text-lg max-w-3xl pl-20">
            Track, document, and resolve operational incidents across all branches. 
            All entries are logged with timestamps and audit trails for compliance.
          </p>
        </motion.div>

        {/* Main Content Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden"
        >
          {/* Content Header Bar */}
          <div className="px-8 py-5 border-b border-slate-100 bg-gradient-to-r from-rose-50 to-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-rose-100 rounded-xl text-rose-600">
                <Shield size={20} />
              </div>
              <h2 className="text-lg font-black text-slate-700 uppercase tracking-tight">Active Incident Register</h2>
            </div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Real-time Sync Enabled
            </div>
          </div>

          {/* Incident Manager Component */}
          <div className="p-0">
            <IncidentManager />
          </div>
        </motion.div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.3em]">
            Protected by FETS Secure Ledger Protocol
          </p>
        </div>
      </div>
    </div>
  )
}

export default IncidentLogPage
