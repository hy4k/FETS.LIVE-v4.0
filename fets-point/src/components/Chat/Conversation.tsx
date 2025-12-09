import React, { useEffect, useRef } from 'react';
import { useMessages, useSendMessage } from '../../hooks/useChat';
import { useAuth } from '../../hooks/useAuth';
import Message from './Message';
import MessageInput from './MessageInput';
import { supabase } from '../../lib/supabase';
import { useQueryClient } from '@tanstack/react-query';
import { Conversation as ConversationType } from '../../types';

interface ConversationProps {
  conversation: ConversationType;
}

const Conversation: React.FC<ConversationProps> = ({ conversation }) => {
  const { user } = useAuth();
  const { data: messages, isLoading } = useMessages(conversation.id);
  const sendMessage = useSendMessage();
  const messagesEndRef = useRef(null);
  const queryClient = useQueryClient();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const channel = supabase
      .channel(`messages:${conversation.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversation.id}` },
        (payload: any) => {
          queryClient.setQueryData(['messages', conversation.id], (oldData: any) => [...(oldData || []), payload.new]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversation.id, queryClient]);

  const handleSendMessage = (content: string) => {
    if (user?.id) {
      sendMessage.mutate({ conversationId: conversation.id, senderId: user.id, content });
    }
  };

  if (isLoading) {
    return <div>Loading messages...</div>;
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 p-4 overflow-y-auto">
        {messages.map((msg) => (
          <Message key={msg.id} message={msg} />
        ))}
        <div ref={messagesEndRef} />
      </div>
      <MessageInput onSendMessage={handleSendMessage} />
    </div>
  );
};

export default Conversation as React.FC<ConversationProps>;
