import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';

export interface AppModule {
    id: string;
    name: string;
    is_enabled: boolean;
}

const fetchAppModules = async (): Promise<AppModule[]> => {
    const { data, error } = await supabase
        .from('app_modules')
        .select('*');

    if (error) {
        console.error('Failed to fetch app modules:', error);
        return [];
    }
    return data || [];
};

const updateAppModule = async ({ id, is_enabled }: { id: string; is_enabled: boolean }) => {
    const { data, error } = await supabase
        .from('app_modules')
        .update({ is_enabled })
        .eq('id', id)
        .select()
        .single();

    if (error) throw new Error(error.message);
    return data;
};

export const useAppModules = () => {
    const queryClient = useQueryClient();

    const query = useQuery<AppModule[]>({
        queryKey: ['appModules'],
        queryFn: fetchAppModules,
        staleTime: 5 * 60 * 1000, // 5 mins
    });

    const mutation = useMutation({
        mutationFn: updateAppModule,
        onSuccess: (updatedModule) => {
            queryClient.setQueryData<AppModule[]>(['appModules'], (old) => {
                if (!old) return [];
                return old.map(m => m.id === updatedModule.id ? { ...m, is_enabled: updatedModule.is_enabled } : m);
            });
            toast.success(`${updatedModule.name} is now ${updatedModule.is_enabled ? 'Enabled' : 'Disabled'}`);
        },
        onError: (error) => {
            toast.error(`Failed to update module state: ${error.message}`);
        }
    });

    return {
        modules: query.data || [],
        isLoading: query.isLoading,
        toggleModule: (id: string, is_enabled: boolean) => mutation.mutateAsync({ id, is_enabled }),
        isUpdating: mutation.isPending
    };
};
