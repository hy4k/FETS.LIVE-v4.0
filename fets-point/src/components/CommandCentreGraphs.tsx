import { useCandidateTrend, useUpcomingSchedule } from '../hooks/useCommandCentre'
import { motion } from 'framer-motion'
import { Users, Calendar, TrendingUp, PieChart } from 'lucide-react'

const COLORS = ['#FFD700', '#FDB931', '#F59E0B', '#D97706', '#B45309']

export function CommandCentreGraphs() {
    const { data: candidateTrend, isLoading: isLoadingTrend } = useCandidateTrend()
    const { data: upcomingSchedule, isLoading: isLoadingSchedule } = useUpcomingSchedule()

    // Process Upcoming Schedule for Visualization (e.g., Sessions by Client)
    const clientDistribution = (upcomingSchedule || []).reduce((acc: any, session: any) => {
        const client = session.client_name || 'Others'
        acc[client] = (acc[client] || 0) + 1
        return acc
    }, {})

    const clientData = Object.entries(clientDistribution).map(([name, count]: any) => ({ name, count }))
        .sort((a: any, b: any) => b.count - a.count)

    const maxTrendValue = Math.max(...(candidateTrend?.map((d: any) => d.count) || [0]), 5) // Min cap to avoid div by zero
    const maxClientValue = Math.max(...(clientData.map((d: any) => d.count) || [0]), 5)

    if (isLoadingTrend || isLoadingSchedule) {
        return <div className="p-8 text-center text-gray-500">Loading analytics...</div>
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">

            {/* Candidate Trend Graph */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="neomorphic-card p-8"
            >
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#e0e5ec] shadow-[inset_2px_2px_5px_#bec3c9,inset_-2px_-2px_5px_#ffffff] flex items-center justify-center">
                            <TrendingUp className="text-yellow-600 w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-gray-700">Candidate Registrations</h3>
                            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Last 7 Days Activity</p>
                        </div>
                    </div>
                </div>

                {/* Bar Chart Container */}
                <div className="h-64 flex items-end justify-between gap-2 md:gap-4 px-2">
                    {candidateTrend?.map((item: any, index: number) => {
                        const heightPercentage = (item.count / maxTrendValue) * 100
                        return (
                            <div key={index} className="flex flex-col items-center justify-end w-full group">
                                <div className="relative w-full flex justify-center">
                                    {/* Tooltip */}
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        whileHover={{ opacity: 1, y: 0 }}
                                        className="absolute -top-10 bg-gray-800 text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10"
                                    >
                                        {item.count} Candidates
                                    </motion.div>

                                    {/* Bar */}
                                    <motion.div
                                        initial={{ height: 0 }}
                                        animate={{ height: `${heightPercentage}%` }}
                                        transition={{ duration: 1, delay: index * 0.1, type: "spring" }}
                                        className="w-full max-w-[40px] bg-gradient-to-t from-yellow-600 to-yellow-400 rounded-t-lg shadow-md relative overflow-hidden"
                                    >
                                        <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                    </motion.div>
                                </div>
                                <div className="mt-3 text-[10px] md:text-xs font-bold text-gray-500 uppercase tracking-wider text-center">
                                    {new Date(item.date).toLocaleDateString('en-US', { weekday: 'short' })}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </motion.div>


            {/* FETS Calendar / Client Distribution Graph */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="neomorphic-card p-8"
            >
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#e0e5ec] shadow-[inset_2px_2px_5px_#bec3c9,inset_-2px_-2px_5px_#ffffff] flex items-center justify-center">
                            <PieChart className="text-yellow-600 w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-gray-700">Upcoming Session Mix</h3>
                            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Next 7 Days by Client</p>
                        </div>
                    </div>
                </div>

                {/* Horizontal Bar Chart */}
                <div className="space-y-5 h-64 overflow-y-auto pr-2 custom-scrollbar">
                    {clientData.length > 0 ? clientData.map((item: any, index: number) => {
                        const widthPercentage = (item.count / maxClientValue) * 100
                        return (
                            <div key={index} className="group">
                                <div className="flex justify-between text-xs font-bold text-gray-600 mb-1 uppercase tracking-wide">
                                    <span>{item.name}</span>
                                    <span>{item.count} Sessions</span>
                                </div>
                                <div className="h-4 w-full bg-gray-200/50 rounded-full overflow-hidden shadow-inner">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${widthPercentage}%` }}
                                        transition={{ duration: 1.2, delay: index * 0.1, ease: "easeOut" }}
                                        className="h-full rounded-full relative"
                                        style={{ background: `linear-gradient(90deg, ${COLORS[index % COLORS.length]} 0%, #FFD700 100%)` }}
                                    >
                                        <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                    </motion.div>
                                </div>
                            </div>
                        )
                    }) : (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400">
                            <Calendar className="w-12 h-12 mb-2 opacity-20" />
                            <p className="text-sm">No upcoming sessions scheduled</p>
                        </div>
                    )}
                </div>
            </motion.div>

        </div>
    )
}
