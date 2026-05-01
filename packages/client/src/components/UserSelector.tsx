import { useUserContext } from '../contexts/UserContext.js';

export default function UserSelector() {
  const { users, selectedUserId, setSelectedUserId } = useUserContext();

  if (users.length === 0) return null;

  return (
    <div className="flex items-center gap-1 mb-4">
      <button
        onClick={() => setSelectedUserId(null)}
        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
          selectedUserId === null
            ? 'bg-gray-800 text-white'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        }`}
      >
        All
      </button>
      {users.map((user) => (
        <button
          key={user.id}
          onClick={() => setSelectedUserId(user.id)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
            selectedUserId === user.id
              ? 'bg-gray-800 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <span
            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
            style={{ backgroundColor: user.color || '#9E9E9E' }}
          />
          {user.name}
        </button>
      ))}
    </div>
  );
}
