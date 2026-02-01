import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';

export interface VaultEntry {
  id: string;
  user_id: string;
  title: string;
  category: string;
  username?: string;
  password?: string;
  url?: string;
  notes?: string;
  tags: string[];
  site_id?: string;
  prof_email?: string;
  prof_email_password?: string;
  other_urls?: string;
  contact_numbers?: string;
  custom_fields?: any;
  created_at: string;
}

export const useVaultEntries = (userId?: string) => {
  return useQuery({
    queryKey: ['vault-entries', userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from('fets_vault')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as VaultEntry[];
    },
    enabled: !!userId,
  });
};

export const useCreateVaultEntry = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (entry: Partial<VaultEntry>) => {
      const { data, error } = await supabase
        .from('fets_vault')
        .insert([entry])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['vault-entries', variables.user_id] });
      toast.success('Asset secured in vault! 🔐');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to secure asset');
    },
  });
};

export const useDeleteVaultEntry = (userId?: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('fets_vault')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vault-entries', userId] });
      toast.success('Asset removed from vault');
    },
  });
};
