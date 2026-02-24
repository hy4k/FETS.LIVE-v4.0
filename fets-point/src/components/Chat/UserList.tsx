import React, { useState } from "react";
import { useAllStaff } from "../../hooks/useFetsConnect";
import { usePresence } from "../../hooks/useChat";
import UserSearch from "./UserSearch";
import { useAuth } from "../../hooks/useAuth";

const UserList = () => {
  const { data: users, isLoading } = useAllStaff();
  const { profile } = useAuth();
  const onlineUsers = usePresence("fets-connect", profile?.id || "");
  const [searchQuery, setSearchQuery] = useState("");

  if (isLoading) {
    return <div>Loading users...</div>;
  }

  const filteredUsers = users.filter((user) =>
    user.full_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div>
      <UserSearch setSearchQuery={setSearchQuery} />
      <div className="flex flex-col gap-2 mt-4">
        {filteredUsers.map((user) => (
          <div
            key={user.id}
            className="flex items-center gap-4 p-2 rounded-lg hover:bg-gray-200 cursor-pointer"
          >
            <div className="relative">
              <img
                src={
                  user.avatar_url ||
                  `https://ui-avatars.com/api/?name=${user.full_name}&background=random`
                }
                alt={user.full_name}
                className="w-10 h-10 rounded-full"
              />
              {onlineUsers.includes(user.id) && (
                <span className="absolute bottom-0 right-0 block h-3 w-3 rounded-full bg-green-500 ring-2 ring-white"></span>
              )}
            </div>
            <div className="flex-1">
              <p className="font-semibold">{user.full_name}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UserList;
