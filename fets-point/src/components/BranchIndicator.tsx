import { useBranch } from '../hooks/useBranch'

interface BranchConfig {
    color: string
    label: string
}

const branchConfig: Record<string, BranchConfig> = {
    calicut: { color: '#e7bb5a', label: 'Calicut' },
    cochin: { color: '#4ade80', label: 'Cochin' },
    kannur: { color: '#f43f5e', label: 'Kannur' },
    global: { color: '#3b82f6', label: 'Global' }
}

export const BranchIndicator = () => {
    const { activeBranch } = useBranch()

    const config = branchConfig[activeBranch] || branchConfig.global

    return (
        <div className="fixed bottom-4 right-4 z-50 opacity-40 hover:opacity-100 transition-opacity duration-300">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/80 backdrop-blur-sm border border-white/20 shadow-lg">
                <div
                    className="w-2 h-2 rounded-full animate-pulse"
                    style={{ background: config.color }}
                />
                <span className="text-xs font-bold uppercase tracking-wider text-gray-700">
                    {config.label}
                </span>
            </div>
        </div>
    )
}
