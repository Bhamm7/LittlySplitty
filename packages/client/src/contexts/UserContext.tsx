import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { useUsers } from '../hooks/useUsers.js';
import type { User } from '@littysplitty/shared';

interface UserContextValue {
  users: User[];
  selectedUserId: string | null; // null = "All"
  setSelectedUserId: (id: string | null) => void;
  isLoading: boolean;
}

const UserContext = createContext<UserContextValue>({
  users: [],
  selectedUserId: null,
  setSelectedUserId: () => {},
  isLoading: true,
});

export function UserProvider({ children }: { children: ReactNode }) {
  const { data: users = [], isLoading } = useUsers();
  const [selectedUserId, setSelectedUserId] = useState<string | null>(() => {
    return localStorage.getItem('littysplitty_selected_user') || null;
  });

  // Once users load, default to first user if no selection persisted
  useEffect(() => {
    if (!isLoading && users.length > 0 && selectedUserId === null) {
      const stored = localStorage.getItem('littysplitty_selected_user');
      if (!stored || !users.find((u) => u.id === stored)) {
        setSelectedUserId(users[0].id);
      }
    }
  }, [isLoading, users, selectedUserId]);

  function handleSelect(id: string | null) {
    setSelectedUserId(id);
    if (id) {
      localStorage.setItem('littysplitty_selected_user', id);
    } else {
      localStorage.removeItem('littysplitty_selected_user');
    }
  }

  return (
    <UserContext.Provider value={{ users, selectedUserId, setSelectedUserId: handleSelect, isLoading }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUserContext() {
  return useContext(UserContext);
}
