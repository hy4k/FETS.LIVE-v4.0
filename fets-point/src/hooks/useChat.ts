import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';

// =====================================================
// CONVERSATIONS
// =====================================================

// Fetch all conversations for the current user
export const useConversations = (userId: string) => {
  return useQuery({
    queryKey: ['conversations', userId],
    queryFn: async () => {
      // First get conversation IDs where user is a member
      const { data: memberData, error: memberError } = await supabase
        .from('conversation_members')
        .select('conversation_id')
        .eq('user_id', userId);

      if (memberError) throw new Error(memberError.message);

      const conversationIds = memberData?.map(m => m.conversation_id) || [];

      if (conversationIds.length === 0) {
        return [];
      }

      // Then get conversations with full details
      const { data, error } = await supabase
        .from('conversations')
        .select(`
          *,
          members:conversation_members(
            *,
            user:staff_profiles(id, full_name, avatar_url, role, department)
          )
        `)
        .in('id', conversationIds)
        .order('last_message_at', { ascending: false, nullsFirst: false });

      if (error) throw new Error(error.message);
      return data || [];
    },
    enabled: !!userId,
  });
};

// Fetch a single conversation by ID
export const useConversation = (conversationId: string) => {
  return useQuery({
    queryKey: ['conversation', conversationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('conversations')
        .select(`
          *,
          members:conversation_members(
            id,
            user_id,
            is_admin,
            user:staff_profiles(id, full_name, avatar_url, role)
          )
        `)
        .eq('id', conversationId)
        .single();

      if (error) throw new Error(error.message);
      return data;
    },
    enabled: !!conversationId,
  });
};

// =====================================================
// MESSAGES
// =====================================================

// Fetch messages for a specific conversation
export const useMessages = (conversationId: string) => {
  return useQuery({
    queryKey: ['messages', conversationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:staff_profiles(id, full_name, avatar_url),
          read_receipts:message_read_receipts(
            *,
            user:staff_profiles(id, full_name)
          )
        `)
        .eq('conversation_id', conversationId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: true });

      if (error) throw new Error(error.message);
      return data || [];
    },
    enabled: !!conversationId,
  });
};

// Send a new message
export const useSendMessage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      conversationId,
      senderId,
      content
    }: {
      conversationId: string;
      senderId: string;
      content: string;
    }) => {
      // Insert the message
      const { data, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: senderId,
          content
        })
        .select()
        .single();

      if (error) throw new Error(error.message);

      // Update conversation's last_message_at and preview
      await supabase
        .from('conversations')
        .update({
          last_message_at: new Date().toISOString(),
          last_message_preview: content.substring(0, 100)
        })
        .eq('id', conversationId);

      return data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['messages', variables.conversationId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      queryClient.invalidateQueries({ queryKey: ['conversation', variables.conversationId] });
    },
    onError: (error: Error) => {
      toast.error(`Failed to send message: ${error.message}`);
    },
  });
};

// Update (edit) a message
export const useUpdateMessage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      messageId,
      content,
      conversationId
    }: {
      messageId: string;
      content: string;
      conversationId: string;
    }) => {
      const { data, error } = await supabase
        .from('messages')
        .update({
          content,
          is_edited: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', messageId)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['messages', variables.conversationId] });
      toast.success('Message updated!');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update message: ${error.message}`);
    },
  });
};

// Delete a message (soft delete)
export const useDeleteMessage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      messageId,
      conversationId
    }: {
      messageId: string;
      conversationId: string;
    }) => {
      const { data, error } = await supabase
        .from('messages')
        .update({ is_deleted: true })
        .eq('id', messageId)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['messages', variables.conversationId] });
      toast.success('Message deleted!');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete message: ${error.message}`);
    },
  });
};

// =====================================================
// CONVERSATION MANAGEMENT
// =====================================================

// Create or get 1:1 direct message conversation
export const useGetOrCreateDM = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId1,
      userId2
    }: {
      userId1: string;
      userId2: string;
    }) => {
      // Check if conversation already exists using RPC function
      const { data: existing, error: searchError } = await supabase
        .rpc('get_direct_conversation' as any, {
          user1_id: userId1,
          user2_id: userId2
        });

      if (searchError) {
        console.error('Error searching for DM:', searchError);
        // If RPC doesn't exist, create conversation directly
      }

      if (existing && existing.length > 0) {
        return existing[0];
      }

      // Create new 1:1 conversation
      const { data: conversation, error: convError } = await supabase
        .from('conversations')
        .insert({
          is_group: false,
          created_by: userId1,
        })
        .select()
        .single();

      if (convError) throw new Error(convError.message);

      // Add both members
      const { error: membersError } = await supabase
        .from('conversation_members')
        .insert([
          { conversation_id: conversation.id, user_id: userId1 },
          { conversation_id: conversation.id, user_id: userId2 }
        ]);

      if (membersError) throw new Error(membersError.message);

      return conversation;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
    onError: (error: Error) => {
      toast.error(`Failed to create conversation: ${error.message}`);
    },
  });
};

// Create a new group conversation
export const useCreateGroupConversation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      name,
      memberIds,
      createdBy
    }: {
      name: string;
      memberIds: string[];
      createdBy: string;
    }) => {
      // Create the group conversation
      const { data: conversation, error: convError } = await supabase
        .from('conversations')
        .insert({
          name,
          is_group: true,
          created_by: createdBy
        })
        .select()
        .single();

      if (convError) throw new Error(convError.message);

      // Add all members (including creator)
      const uniqueMemberIds = Array.from(new Set([createdBy, ...memberIds]));
      const members = uniqueMemberIds.map((userId, index) => ({
        conversation_id: conversation.id,
        user_id: userId,
        is_admin: userId === createdBy // Creator is admin
      }));

      const { error: membersError } = await supabase
        .from('conversation_members')
        .insert(members);

      if (membersError) throw new Error(membersError.message);

      return conversation;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      toast.success('Group chat created!');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create group: ${error.message}`);
    },
  });
};

// Add member to group conversation
export const useAddMemberToConversation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      conversationId,
      userId
    }: {
      conversationId: string;
      userId: string;
    }) => {
      const { data, error } = await supabase
        .from('conversation_members')
        .insert({
          conversation_id: conversationId,
          user_id: userId
        })
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['conversation', variables.conversationId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      toast.success('Member added!');
    },
    onError: (error: Error) => {
      toast.error(`Failed to add member: ${error.message}`);
    },
  });
};

// =====================================================
// READ RECEIPTS
// =====================================================

// Mark message(s) as read
export const useMarkMessagesAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      messageIds,
      userId,
      conversationId
    }: {
      messageIds: string[];
      userId: string;
      conversationId: string;
    }) => {
      // Insert read receipts for messages that don't have them
      const receipts = messageIds.map(msgId => ({
        message_id: msgId,
        user_id: userId
      }));

      const { error } = await supabase
        .from('message_read_receipts')
        .upsert(receipts, { onConflict: 'message_id,user_id', ignoreDuplicates: true });

      if (error) throw new Error(error.message);

      // Update last_read_at for this user in conversation_members
      await supabase
        .from('conversation_members')
        .update({ last_read_at: new Date().toISOString() })
        .eq('conversation_id', conversationId)
        .eq('user_id', userId);
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['messages', variables.conversationId] });
    },
  });
};

// =====================================================
// REAL-TIME PRESENCE
// =====================================================

// Track online users in a conversation
export const usePresence = (conversationId: string, currentUserId: string) => {
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);

  useEffect(() => {
    if (!conversationId || !currentUserId) return;

    const channel = supabase.channel(`presence:${conversationId}`, {
      config: {
        presence: {
          key: currentUserId,
        },
      },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const presenceState = channel.presenceState();
        const users = Object.keys(presenceState).map(key => {
          const presence = presenceState[key];
          return (presence[0] as any)?.user_id;
        }).filter(Boolean);
        setOnlineUsers(users);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          // Get current user session
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            await channel.track({
              user_id: currentUserId,
              online_at: new Date().toISOString()
            });
          }
        }
      });

    return () => {
      channel.unsubscribe();
    };
  }, [conversationId, currentUserId]);

  return onlineUsers;
};

// =====================================================
// REAL-TIME MESSAGES SUBSCRIPTION
// =====================================================

// Subscribe to new messages in a conversation
export const useMessagesSubscription = (
  conversationId: string,
  onNewMessage?: (message: any) => void
) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!conversationId) return;

    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        (payload) => {
          queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
          queryClient.invalidateQueries({ queryKey: ['conversations'] });
          if (onNewMessage) {
            onNewMessage(payload.new);
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [conversationId, queryClient, onNewMessage]);
};

// =====================================================
// TYPING INDICATORS
// =====================================================

// Set typing indicator
export const useSetTyping = () => {
  return useMutation({
    mutationFn: async ({
      conversationId,
      userId
    }: {
      conversationId: string;
      userId: string;
    }) => {
      const { error } = await supabase
        .from('typing_indicators')
        .upsert({
          conversation_id: conversationId,
          user_id: userId,
          started_at: new Date().toISOString()
        }, { onConflict: 'conversation_id,user_id' });

      if (error) throw new Error(error.message);
    },
  });
};

// Clear typing indicator
export const useClearTyping = () => {
  return useMutation({
    mutationFn: async ({
      conversationId,
      userId
    }: {
      conversationId: string;
      userId: string;
    }) => {
      const { error } = await supabase
        .from('typing_indicators')
        .delete()
        .eq('conversation_id', conversationId)
        .eq('user_id', userId);

      if (error) throw new Error(error.message);
    },
  });
};

// Subscribe to typing indicators
export const useTypingIndicators = (conversationId: string, currentUserId: string) => {
  const [typingUsers, setTypingUsers] = useState<string[]>([]);

  useEffect(() => {
    if (!conversationId) return;

    const channel = supabase
      .channel(`typing:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'typing_indicators',
          filter: `conversation_id=eq.${conversationId}`
        },
        async (payload) => {
          // Fetch all typing indicators for this conversation
          const { data } = await supabase
            .from('typing_indicators')
            .select('user_id, started_at')
            .eq('conversation_id', conversationId);

          if (data) {
            // Filter out old indicators (>5 seconds) and current user
            const now = new Date().getTime();
            const activeTyping = data
              .filter(t => {
                const startTime = new Date(t.started_at).getTime();
                const isRecent = (now - startTime) < 5000;
                const isNotCurrentUser = t.user_id !== currentUserId;
                return isRecent && isNotCurrentUser;
              })
              .map(t => t.user_id);

            setTypingUsers(activeTyping);
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [conversationId, currentUserId]);

  return typingUsers;
};
