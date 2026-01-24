import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

export interface Client {
    id: string
    name: string
    color: string
    logo_url?: string
}

export interface ClientExam {
    id: string
    client_id: string
    name: string
    locations: string[]
}

// Fetch all clients
async function fetchClients(): Promise<Client[]> {
    const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('name')
    
    if (error) throw error
    return data || []
}

// Fetch all exams
async function fetchExams(): Promise<ClientExam[]> {
    const { data, error } = await supabase
        .from('client_exams')
        .select('*')
        .order('name')
    
    if (error) throw error
    return data || []
}

// Hook to get all clients
export function useClients() {
    return useQuery({
        queryKey: ['clients'],
        queryFn: fetchClients,
        staleTime: 5 * 60 * 1000, // 5 minutes
    })
}

// Hook to get all exams
export function useClientExams() {
    return useQuery({
        queryKey: ['client_exams'],
        queryFn: fetchExams,
        staleTime: 5 * 60 * 1000, // 5 minutes
    })
}

// Hook to get exams for a specific client
export function useExamsByClient(clientId: string | null) {
    const { data: allExams = [] } = useClientExams()
    return allExams.filter(exam => exam.client_id === clientId)
}

// Hook to get combined clients with their exams
export function useClientsWithExams() {
    const { data: clients = [], isLoading: clientsLoading } = useClients()
    const { data: exams = [], isLoading: examsLoading } = useClientExams()
    
    const clientsWithExams = clients.map(client => ({
        ...client,
        exams: exams.filter(exam => exam.client_id === client.id)
    }))
    
    return {
        data: clientsWithExams,
        isLoading: clientsLoading || examsLoading,
        clients,
        exams
    }
}

// Helper function to get client name options for dropdowns
export function useClientOptions() {
    const { data: clients = [] } = useClients()
    return clients.map(c => ({ value: c.name, label: c.name, color: c.color }))
}

// Helper function to get exam options for a given client name
export function useExamOptions(clientName: string | null) {
    const { data: clients = [] } = useClients()
    const { data: exams = [] } = useClientExams()
    
    if (!clientName) return []
    
    const client = clients.find(c => c.name.toLowerCase() === clientName.toLowerCase())
    if (!client) return []
    
    return exams
        .filter(exam => exam.client_id === client.id)
        .map(e => ({ value: e.name, label: e.name }))
}

// Normalize client name to match stored format (uppercase)
export function normalizeClientName(name: string): string {
    if (!name) return ''
    const upper = name.toUpperCase().trim()
    
    // Common mappings
    if (upper.includes('PEARSON') || upper.includes('VUE')) return 'PEARSON VUE'
    if (upper.includes('PROMETRIC')) return 'PROMETRIC'
    if (upper.includes('PSI')) return 'PSI'
    if (upper.includes('ITTS')) return 'ITTS'
    
    return upper
}
