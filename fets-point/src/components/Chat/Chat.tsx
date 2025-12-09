import React, { useState } from 'react';
import ConversationList from './ConversationList';
import UserList from './UserList';
import Conversation from './Conversation';
import { usePushNotifications } from '../../hooks/usePushNotifications';
import { Conversation as ConversationType } from '../../types';

const Chat: React.FC = () => {
  const [selectedConversation, setSelectedConversation] = useState<ConversationType | null>(null);
  const { subscribe } = usePushNotifications();

  return (
    <div className="flex h-full">
      <div className="w-1/4 bg-gray-100 p-4">
        <h2 className="text-lg font-bold mb-4">Conversations</h2>
        <ConversationList setSelectedConversation={setSelectedConversation} />
      </div>
      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <Conversation conversation={selectedConversation} />
        ) : (
          <div className="flex-1 p-4 flex items-center justify-center">
            <h2 className="text-lg font-bold mb-4">Select a conversation to start chatting</h2>
          </div>
        )}
      </div>
      <div className="w-1/4 bg-gray-100 p-4">
        <button
          className="p-2 bg-blue-500 text-white rounded-md mb-4 w-full"
          onClick={() => subscribe()}
        >
          Enable Push Notifications
        </button>
        <h2 className="text-lg font-bold mb-4">Users</h2>
        <UserList />
      </div>
    </div>
  );
};

export default Chat;
