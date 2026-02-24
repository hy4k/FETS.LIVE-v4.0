import React from "react";

const UserSearch = ({ setSearchQuery }) => {
  return (
    <div className="p-4 bg-white">
      <input
        type="text"
        placeholder="Search users..."
        className="w-full p-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
        onChange={(e) => setSearchQuery(e.target.value)}
      />
    </div>
  );
};

export default UserSearch;
