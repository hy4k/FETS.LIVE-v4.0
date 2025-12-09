import React, { useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { format } from 'date-fns';
import { useInView } from 'react-intersection-observer';
import { useMarkMessagesAsRead } from '../../hooks/useChat';
import { ChatMessage } from '../../types';

interface MessageProps {
  message: ChatMessage & { conversation?: { members: any[] } };
}

const Message: React.FC<MessageProps> = ({ message }) => {
  const { user } = useAuth();
  const { author, content, created_at, id: messageId, read_receipts, conversation_id } = message;
  const isYou = author.id === user.id;
  const markAsRead = useMarkMessagesAsRead();

  const { ref, inView } = useInView({
    threshold: 1,
  });

  useEffect(() => {
    if (inView && !isYou) {
      const isRead = read_receipts.some((receipt) => receipt.user_id === user.id);
      if (!isRead) {
        markAsRead.mutate({ messageIds: [messageId], userId: user.id, conversationId: conversation_id });
      }
    }
  }, [inView, isYou, messageId, user.id, read_receipts, markAsRead, conversation_id]);

  const isReadByAll = read_receipts && message.conversation?.members 
    ? read_receipts.length === message.conversation.members.length - 1 
    : false;

  return (
    <div ref={ref} className={`flex items-start gap-4 my-4 ${isYou ? 'flex-row-reverse' : ''}`}>
      <img
        src={author.avatar_url || `https://ui-avatars.com/api/?name=${author.full_name}&background=random`}
        alt={author.full_name}
        className="w-10 h-10 rounded-full"
      />
      <div className={`flex flex-col gap-1 ${isYou ? 'items-end' : ''}`}>
        <div className="flex items-center gap-2">
          <p className="font-semibold">{isYou ? 'You' : author.full_name}</p>
          <p className="text-xs text-gray-500">{format(new Date(created_at), 'p')}</p>
        </div>
        <div className={`p-3 rounded-lg ${isYou ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}>
          <p>{content}</p>
        </div>
        {isYou && (
          <div className="text-xs text-gray-500">
            {isReadByAll ? 'Read by all' : `Read by ${read_receipts.length}`}
          </div>
        )}
      </div>
    </div>
  );
};

export default Message as React.FC<MessageProps>;
