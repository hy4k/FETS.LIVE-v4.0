import React from 'react'
import IncidentManager from './IncidentManager'

/**
 * RaiseACasePage - Minimal wrapper for the redesigned Raise A Case feature.
 * The IncidentManager now contains the full colorful UI with brand header.
 * Theme: Mystical teal with red accents
 */
export function IncidentLogPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-teal-950 to-slate-900 font-['Montserrat']">
      <IncidentManager />
    </div>
  )
}

export default IncidentLogPage
