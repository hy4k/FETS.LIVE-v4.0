import { useState } from 'react'
import { motion } from 'framer-motion'
import { Calendar, Video, Users, Plus, Clock, MoreVertical, Search, MessageSquare, Phone } from 'lucide-react'
import { format } from 'date-fns'

export const Frame = () => {
    const [activeTab, setActiveTab] = useState<'meet' | 'schedule'>('meet')

    return (
        <div className="h-full flex flex-col bg-[#fdfbf7] rounded-3xl overflow-hidden shadow-2xl font-sans text-gray-800">

            {/* Header */}
            <div className="bg-white border-b-2 border-black p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center text-white border-2 border-black shadow-[2px_2px_0px_0px_black]">
                        <Video size={20} />
                    </div>
                    <div>
                        <h2 className="font-black text-xl uppercase tracking-tight">Frame</h2>
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Collaborative Workspace</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button className="px-4 py-2 bg-black text-white rounded-lg font-bold text-xs uppercase tracking-wider hover:bg-gray-800 transition-colors">
                        New Meeting
                    </button>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Sidebar */}
                <div className="w-64 bg-gray-50 border-r-2 border-black p-4 flex flex-col gap-2">
                    <button
                        onClick={() => setActiveTab('meet')}
                        className={`p-3 rounded-xl flex items-center gap-3 transition-all ${activeTab === 'meet' ? 'bg-white border-2 border-black shadow-[2px_2px_0px_0px_black]' : 'hover:bg-gray-200'}`}
                    >
                        <Video size={18} />
                        <span className="font-bold text-sm">Meet Now</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('schedule')}
                        className={`p-3 rounded-xl flex items-center gap-3 transition-all ${activeTab === 'schedule' ? 'bg-white border-2 border-black shadow-[2px_2px_0px_0px_black]' : 'hover:bg-gray-200'}`}
                    >
                        <Calendar size={18} />
                        <span className="font-bold text-sm">Schedule</span>
                    </button>

                    <div className="mt-8">
                        <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest px-2 mb-2">Recent Groups</h3>
                        <div className="space-y-1">
                            {/* Placeholder Groups */}
                            <div className="p-2 hover:bg-gray-200 rounded-lg cursor-pointer flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                <span className="text-sm font-semibold text-gray-600">Operations Team</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 p-6 overflow-y-auto">
                    {activeTab === 'meet' && (
                        <div className="max-w-4xl mx-auto">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                                <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-6 text-white border-2 border-black shadow-[4px_4px_0px_0px_black] flex flex-col justify-between h-48 cursor-pointer hover:scale-[1.02] transition-transform">
                                    <div className="bg-white/20 w-12 h-12 rounded-xl flex items-center justify-center backdrop-blur-sm">
                                        <Video size={24} />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-black uppercase mb-1">Instant Meeting</h3>
                                        <p className="text-white/80 text-sm font-medium">Start a video session with your team immediately.</p>
                                    </div>
                                </div>

                                <div className="bg-white rounded-2xl p-6 text-gray-800 border-2 border-black shadow-[4px_4px_0px_0px_black] flex flex-col justify-between h-48 cursor-pointer hover:scale-[1.02] transition-transform group">
                                    <div className="bg-gray-100 group-hover:bg-gray-200 w-12 h-12 rounded-xl flex items-center justify-center transition-colors">
                                        <Plus size={24} />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-black uppercase mb-1">Create Group</h3>
                                        <p className="text-gray-500 text-sm font-medium">Set up a permanent group for recurring chats.</p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-2xl border-2 border-black overflow-hidden shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)]">
                                <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
                                    <h3 className="font-black text-sm uppercase tracking-widest text-gray-500">Today's Schedule</h3>
                                    <button className="text-xs font-bold text-indigo-600 hover:underline">View Calendar</button>
                                </div>
                                <div className="divide-y divide-gray-100">
                                    <div className="p-8 text-center text-gray-400 italic">
                                        No meetings scheduled for today.
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'schedule' && (
                        <div className="max-w-2xl mx-auto bg-white rounded-2xl border-2 border-black p-8 shadow-[4px_4px_0px_0px_black]">
                            <h2 className="text-2xl font-black uppercase mb-6">Schedule a Meeting</h2>
                            <div className="space-y-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-black uppercase tracking-widest text-gray-500">Meeting Title</label>
                                    <input type="text" className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl p-3 font-bold focus:border-black outline-none transition-colors" placeholder="e.g., Q3 Strategy Sync" />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-xs font-black uppercase tracking-widest text-gray-500">Date</label>
                                        <input type="date" className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl p-3 font-bold focus:border-black outline-none transition-colors" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-black uppercase tracking-widest text-gray-500">Time</label>
                                        <input type="time" className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl p-3 font-bold focus:border-black outline-none transition-colors" />
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-black uppercase tracking-widest text-gray-500">Attendees</label>
                                    <div className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl p-3 flex flex-wrap gap-2 min-h-[50px]">
                                        <span className="text-gray-400 text-sm font-medium">Select people...</span>
                                    </div>
                                </div>

                                <button className="w-full py-4 bg-black text-white rounded-xl font-black uppercase tracking-widest hover:bg-gray-800 transition-colors shadow-lg mt-4">
                                    Send Invites
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
