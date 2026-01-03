import React from 'react'
import { FileText } from 'lucide-react'

export const DailyLog = () => {
    return (
        <div className="h-full flex flex-col items-center justify-center text-white/50 p-8">
            <div className="p-4 bg-white/5 rounded-full mb-4 animate-pulse">
                <FileText size={48} className="text-[#ffbf00]" />
            </div>
            <h2 className="text-2xl font-black uppercase tracking-widest text-white mb-2">Daily Log</h2>
            <p className="text-sm font-bold uppercase tracking-wider opacity-60">Module Under Construction</p>
            <p className="text-xs text-center max-w-md mt-4 opacity-40">
                This feature is currently being implemented. Check back soon for updates.
            </p>
        </div>
    )
}
