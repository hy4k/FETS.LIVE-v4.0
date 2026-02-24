import React, { useState } from "react";
import { Send } from "lucide-react";

const MessageInput = ({ onSendMessage }) => {
  const [content, setContent] = useState("");

  const handleSend = () => {
    if (content.trim()) {
      onSendMessage(content);
      setContent("");
    }
  };

  return (
    <div className="p-4 bg-white border-t">
      <div className="relative">
        <input
          type="text"
          placeholder="Type a message..."
          className="w-full p-3 pr-12 border rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
        />
        <button
          className="absolute top-1/2 right-3 -translate-y-1/2 p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600"
          onClick={handleSend}
        >
          <Send className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default MessageInput;
