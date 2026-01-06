import React, { createContext, useContext, useState, ReactNode } from 'react';
import { StaffProfile } from '../types/shared';

interface ChatContextType {
    isDetached: boolean;
    setIsDetached: (value: boolean) => void;
    activeUser: StaffProfile | null;
    setActiveUser: (user: StaffProfile | null) => void;
    toggleDetach: () => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: ReactNode }) {
    const [isDetached, setIsDetached] = useState(false);
    const [activeUser, setActiveUser] = useState<StaffProfile | null>(null);

    const toggleDetach = () => setIsDetached(prev => !prev);

    return (
        <ChatContext.Provider value={{ isDetached, setIsDetached, activeUser, setActiveUser, toggleDetach }}>
            {children}
        </ChatContext.Provider>
    );
}

export function useChat() {
    const context = useContext(ChatContext);
    if (context === undefined) {
        throw new Error('useChat must be used within a ChatProvider');
    }
    return context;
}
