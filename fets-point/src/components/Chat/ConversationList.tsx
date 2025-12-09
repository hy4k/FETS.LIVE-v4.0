import React, { useState } from 'react';
import { useConversations } from '../../hooks/useChat';
import { useAuth } from '../../hooks/useAuth';
import CreateGroupChatModal from './CreateGroupChatModal';

const ConversationList = ({ setSelectedConversation }) => {
  const { user } = useAuth();
  const { data: conversations = [], isLoading } = useConversations(user?.id);
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (isLoading) {
    return <div>Loading conversations...</div>;
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        className="p-2 bg-blue-500 text-white rounded-md mb-4"
        onClick={() => setIsModalOpen(true)}
      >
        Create Group Chat
      </button>
      {conversations.map((convo) => (
        <div
          key={convo.id}
          className="flex items-center gap-4 p-2 rounded-lg hover:bg-gray-200 cursor-pointer"
          onClick={() => setSelectedConversation(convo)}
        >
          <img
            src={`https://ui-avatars.com/api/?name=${convo.name}&background=random`}
            alt={convo.name}
            className="w-10 h-10 rounded-full"
          />
          <div className="flex-1">
            <p className="font-semibold">{convo.name}</p>
            <p className="text-sm text-gray-500 truncate">
              {convo.last_message_preview}
            </p>
          </div>
        </div>
      ))}
      {isModalOpen && <CreateGroupChatModal setIsModalOpen={setIsModalOpen} />}
    </div>
  );
};

export default ConversationList;
