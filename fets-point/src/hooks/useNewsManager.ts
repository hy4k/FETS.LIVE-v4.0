import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { toast } from 'react-hot-toast'

const fetchNews = async () => {
  const { data, error } = await (supabase as any)
    .from('news_ticker')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data || []
}

export const useNews = () => {
  return useQuery({
    queryKey: ['news'],
    queryFn: fetchNews,
  })
}

export const useNewsMutations = () => {
  const queryClient = useQueryClient()

  const invalidateNews = () => {
    queryClient.invalidateQueries({ queryKey: ['news'] })
  }

  const addNewsItem = useMutation({
    mutationFn: async (newItem: any) => {
      const { error } = await (supabase as any).from('news_ticker').insert(newItem)
      if (error) throw error
    },
    onSuccess: () => {
      toast.success('News item created!')
      invalidateNews()
    },
    onError: (err: Error) => toast.error(`Error: ${err.message}`),
  })

  const updateNewsItem = useMutation({
    mutationFn: async (updatedItem: any) => {
      const { error } = await (supabase as any).from('news_ticker').update(updatedItem).eq('id', updatedItem.id)
      if (error) throw error
    },
    onSuccess: () => {
      toast.success('News item updated!')
      invalidateNews()
    },
    onError: (err: Error) => toast.error(`Error: ${err.message}`),
  })

  const deleteNewsItem = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from('news_ticker').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      toast.success('News item deleted!')
      invalidateNews()
    },
    onError: (err: Error) => toast.error(`Error: ${err.message}`),
  })

  return {
    addNewsItem: addNewsItem.mutateAsync,
    isAdding: addNewsItem.isPending,
    updateNewsItem: updateNewsItem.mutateAsync,
    isUpdating: updateNewsItem.isPending,
    deleteNewsItem: deleteNewsItem.mutateAsync,
    isDeleting: deleteNewsItem.isPending,
  }
}