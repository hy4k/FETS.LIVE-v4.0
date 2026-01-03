import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    CheckCircle2,
    Circle,
    Trash2,
    Edit3,
    Plus,
    AlertCircle,
    Clock,
    Zap,
    Check,
    ListTodo,
    ArrowRight
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'

interface TodoTask {
    id: string
    content: string
    is_completed: boolean
    quadrant: 'must' | 'should' | 'could' | 'time'
    created_at: string
}

const quadrantConfigs = {
    must: {
        id: 'must',
        title: 'DO FIRST',
        subtitle: 'Critical & Urgent',
        bg: 'bg-rose-500/5',
        border: 'border-rose-500/20',
        text: 'text-rose-400',
        placeholder: 'text-rose-500/30',
        icon: Zap,
        glow: 'shadow-[0_0_20px_rgba(244,63,94,0.1)]'
    },
    should: {
        id: 'should',
        title: 'SCHEDULE',
        subtitle: 'Important, Not Urgent',
        bg: 'bg-[#ffbf00]/5',
        border: 'border-[#ffbf00]/20',
        text: 'text-[#ffbf00]',
        placeholder: 'text-[#ffbf00]/30',
        icon: ListTodo,
        glow: 'shadow-[0_0_20px_rgba(255,191,0,0.1)]'
    },
    could: {
        id: 'could',
        title: 'DELEGATE',
        subtitle: 'Urgent, Not Important',
        bg: 'bg-blue-500/5',
        border: 'border-blue-500/20',
        text: 'text-blue-400',
        placeholder: 'text-blue-500/30',
        icon: Clock,
        glow: 'shadow-[0_0_20px_rgba(59,130,246,0.1)]'
    },
    time: {
        id: 'time',
        title: 'ELIMINATE',
        subtitle: 'Neither Urgent nor Important',
        bg: 'bg-slate-500/5',
        border: 'border-slate-500/20',
        text: 'text-slate-400',
        placeholder: 'text-slate-500/30',
        icon: AlertCircle,
        glow: 'shadow-[0_0_20px_rgba(148,163,184,0.1)]'
    }
}

export function ToDoMatrix() {
    const { user } = useAuth()
    const [tasks, setTasks] = useState<TodoTask[]>([])
    const [loading, setLoading] = useState(true)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [editValue, setEditValue] = useState('')
    // Input states for each quadrant
    const [inputs, setInputs] = useState({
        must: '',
        should: '',
        could: '',
        time: ''
    })

    useEffect(() => {
        if (user) {
            fetchTasks()
        }
    }, [user])

    const fetchTasks = async () => {
        try {
            setLoading(true)
            const { data, error } = await supabase
                .from('user_todo_matrix')
                .select('*')
                .eq('user_id', user?.id)
                .order('created_at', { ascending: true })

            if (error) {
                if (error.code === '42P01') {
                    console.warn('Backend table missing')
                    return
                }
                throw error
            }
            if (data) setTasks(data)
        } catch (err) {
            console.error('Error fetching tasks:', err)
        } finally {
            setLoading(false)
        }
    }

    const addTask = async (quadrant: 'must' | 'should' | 'could' | 'time') => {
        const content = inputs[quadrant].trim()
        if (!content) return

        const tempId = Math.random().toString(36).substr(2, 9)
        const newTaskObj: TodoTask = {
            id: tempId,
            content,
            is_completed: false,
            quadrant,
            created_at: new Date().toISOString()
        }

        setTasks(prev => [...prev, newTaskObj])
        setInputs(prev => ({ ...prev, [quadrant]: '' }))

        try {
            const { data, error } = await supabase
                .from('user_todo_matrix')
                .insert([{
                    user_id: user?.id,
                    content,
                    quadrant,
                    is_completed: false
                }])
                .select()

            if (error) throw error
            if (data?.[0]) {
                setTasks(prev => prev.map(t => t.id === tempId ? data[0] : t))
            }
        } catch (err) {
            console.error('Error adding task:', err)
        }
    }

    const toggleTask = async (task: TodoTask) => {
        const updatedStatus = !task.is_completed
        setTasks(prev => prev.map(t => t.id === task.id ? { ...t, is_completed: updatedStatus } : t))
        try {
            await supabase
                .from('user_todo_matrix')
                .update({ is_completed: updatedStatus })
                .eq('id', task.id)
        } catch (err) { console.error(err) }
    }

    const deleteTask = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation()
        setTasks(prev => prev.filter(t => t.id !== id))
        try {
            await supabase.from('user_todo_matrix').delete().eq('id', id)
        } catch (err) { console.error(err) }
    }

    const startEditing = (task: TodoTask) => {
        setEditingId(task.id)
        setEditValue(task.content)
    }

    const saveEdit = async (id: string) => {
        if (!editValue.trim()) return
        setTasks(prev => prev.map(t => t.id === id ? { ...t, content: editValue } : t))
        setEditingId(null)
        try {
            await supabase.from('user_todo_matrix').update({ content: editValue }).eq('id', id)
        } catch (err) { console.error(err) }
    }

    const renderQuadrant = (quad: 'must' | 'should' | 'could' | 'time') => {
        const config = quadrantConfigs[quad]
        const quadTasks = tasks.filter(t => t.quadrant === quad)
        const Icon = config.icon

        return (
            <div className={`
                relative flex flex-col h-full
                ${config.bg}
                backdrop-blur-sm
                border border-white/5
                group/panel
                transition-all duration-500
                hover:bg-white/[0.07]
            `}>
                {/* Header - Styled like a premium notebook label */}
                <div className={`
                    p-4 flex items-center justify-between
                    border-b border-white/5
                `}>
                    <div className="flex items-center gap-3">
                        <div className={`
                            p-2 rounded-lg bg-white/5 
                            ${config.text} border border-white/5
                            shadow-inner
                        `}>
                            <Icon size={14} strokeWidth={2.5} />
                        </div>
                        <div>
                            <h3 className={`text-[11px] font-black uppercase tracking-[0.2em] ${config.text}`}>
                                {config.title}
                            </h3>
                            <p className="text-[9px] font-bold text-white/30 uppercase tracking-widest mt-0.5">
                                {config.subtitle}
                            </p>
                        </div>
                    </div>
                    <div className="text-[10px] font-mono font-bold text-white/20">
                        {String(quadTasks.length).padStart(2, '0')}
                    </div>
                </div>

                {/* Notebook Body */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-0 relative">
                    {/* Background Lines Effect */}
                    <div
                        className="absolute inset-0 pointer-events-none opacity-[0.03]"
                        style={{
                            backgroundImage: 'linear-gradient(transparent 95%, #ffffff 95%)',
                            backgroundSize: '100% 40px'
                        }}
                    />

                    {/* Task List */}
                    <div className="flex flex-col">
                        <AnimatePresence initial={false}>
                            {quadTasks.map(task => (
                                <motion.div
                                    layout
                                    key={task.id}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="group/task relative border-b border-white/5 hover:bg-white/5 transition-colors"
                                >
                                    <div className="flex items-start gap-3 p-3 min-h-[40px]">
                                        <button
                                            onClick={() => toggleTask(task)}
                                            className={`mt-0.5 flex-shrink-0 transition-colors ${task.is_completed ? 'text-emerald-400' : 'text-white/20 hover:text-white/40'}`}
                                        >
                                            {task.is_completed ? <CheckCircle2 size={16} /> : <Circle size={16} />}
                                        </button>

                                        {editingId === task.id ? (
                                            <input
                                                autoFocus
                                                type="text"
                                                value={editValue}
                                                onChange={(e) => setEditValue(e.target.value)}
                                                onBlur={() => saveEdit(task.id)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') saveEdit(task.id)
                                                    if (e.key === 'Escape') setEditingId(null)
                                                }}
                                                className="flex-1 bg-transparent border-none outline-none text-xs font-bold text-white uppercase tracking-wide px-0 py-0"
                                            />
                                        ) : (
                                            <span
                                                onDoubleClick={() => startEditing(task)}
                                                className={`
                                                    flex-1 text-xs font-bold uppercase tracking-wide leading-relaxed cursor-text
                                                    ${task.is_completed ? 'text-white/20 line-through' : 'text-white/80'}
                                                `}
                                            >
                                                {task.content}
                                            </span>
                                        )}

                                        <div className="opacity-0 group-hover/task:opacity-100 flex items-center gap-1 transition-opacity">
                                            <button
                                                onClick={() => startEditing(task)}
                                                className="p-1 text-white/30 hover:text-blue-400 transition-colors"
                                            >
                                                <Edit3 size={12} />
                                            </button>
                                            <button
                                                onClick={(e) => deleteTask(task.id, e)}
                                                className="p-1 text-white/30 hover:text-rose-400 transition-colors"
                                            >
                                                <Trash2 size={12} />
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>

                        {/* Immediate Input Line - "Notebook Line" style */}
                        <div className="relative border-b border-white/5 group/input">
                            <div className="flex items-center gap-3 p-3">
                                <Plus size={16} className={`flex-shrink-0 ${config.text} opacity-30`} />
                                <input
                                    type="text"
                                    value={inputs[quad]}
                                    onChange={(e) => setInputs({ ...inputs, [quad]: e.target.value })}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') addTask(quad)
                                    }}
                                    placeholder="Write new task..."
                                    className={`
                                        flex-1 bg-transparent border-none outline-none 
                                        text-xs font-bold uppercase tracking-wide 
                                        text-white placeholder:text-white/10
                                        focus:placeholder:text-white/20
                                    `}
                                />
                                {inputs[quad] && (
                                    <motion.button
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        onClick={() => addTask(quad)}
                                        className="text-emerald-400"
                                    >
                                        <ArrowRight size={14} strokeWidth={3} />
                                    </motion.button>
                                )}
                            </div>
                            {/* Accent Line on Focus */}
                            <div className={`absolute bottom-0 left-0 h-[2px] bg-gradient-to-r ${config.bg.replace('/5', '')} to-transparent w-0 group-focus-within/input:w-full transition-all duration-500`} />
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    if (loading && tasks.length === 0) {
        return (
            <div className="h-full flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
            </div>
        )
    }

    return (
        <div className="h-full flex flex-col">
            {/* Header */}
            <div className="mb-4 flex items-center justify-between px-2">
                <h2 className="text-xs font-black text-white/50 uppercase tracking-[0.2em] flex items-center gap-2">
                    <ListTodo size={14} className="text-[#ffbf00]" />
                    Priority Matrix
                </h2>
                <div className="flex gap-4">
                    <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-rose-500 box-shadow-[0_0_8px_rgba(244,63,94,0.5)]" />
                        <span className="text-[9px] font-bold text-white/30 uppercase tracking-widest">Urgent</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#ffbf00] box-shadow-[0_0_8px_rgba(255,191,0,0.5)]" />
                        <span className="text-[9px] font-bold text-white/30 uppercase tracking-widest">Important</span>
                    </div>
                </div>
            </div>

            {/* Matrix Grid - Dark Glass Theme */}
            <div className="flex-1 grid grid-cols-2 gap-px bg-white/5 border border-white/10 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-xl">
                {renderQuadrant('must')}
                {renderQuadrant('should')}
                {renderQuadrant('could')}
                {renderQuadrant('time')}
            </div>
        </div>
    )
}
