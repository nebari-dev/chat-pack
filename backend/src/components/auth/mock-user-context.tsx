/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import {
  createContext,
  useContext,
  useMemo,
  useState,
  useEffect,
  type ReactNode,
} from 'react';


/**
 * The supported user roles in the mock login.
 */
export type UserRole = 'student' | 'teacher' | 'counselor' | 'principal' | 'test';


/**
 * The mock user definition.
 */
export type MockUser = {
  readonly id: string;
  readonly name: string;
  readonly persona: string;
  readonly role: UserRole;
  readonly username: string;
};


/**
 * The static list of mock users exposed in the UI.
 */
export type CredentialRecord = MockUser & { readonly password: string };

export const MOCK_USERS: readonly CredentialRecord[] = [
  { id: 'alex', name: 'Alex', persona: 'Student', role: 'student', username: 'alex', password: 'alex123' },
  { id: 'ms-rivera', name: 'Ms. Rivera', persona: 'Counselor', role: 'counselor', username: 'rivera', password: 'counselor123' },
  { id: 'mr-holmes', name: 'Mr. Holmes', persona: 'Teacher', role: 'teacher', username: 'holmes', password: 'teacher123' },
  { id: 'principal-taylor', name: 'Principal Taylor', persona: 'Principal', role: 'principal', username: 'taylor', password: 'principal123' },
  { id: 'test-user', name: 'Test User', persona: 'Full Access / Legacy UI', role: 'test', username: 'test', password: 'letmein' },
] as const;

function sanitizeRecord(record: CredentialRecord): MockUser {
  const { password: _password, ...rest } = record;
  return rest;
}

/**
 * The shape of the mock user context.
 */
type MockUserContextValue = {
  readonly user: MockUser | undefined;
  readonly authenticate: (username: string, password: string) => MockUser | undefined;
  readonly logout: () => void;
};


const STORAGE_KEY = 'chatpp.active-user';


/**
 * The underlying React context instance.
 */
const MockUserContext = createContext<MockUserContextValue | undefined>(undefined);


/**
 * A helper for loading the initial user id from local storage (if available).
 */
function readInitialUserId(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }

  return window.localStorage.getItem(STORAGE_KEY);
}


/**
 * Provides the currently selected mock user to the component tree.
 */
export function MockUserProvider(props: { readonly children: ReactNode }): ReactNode {
  const { children } = props;
  const [selectedUserId, setSelectedUserId] = useState<string | null>(readInitialUserId);

  const selectedRecord = useMemo(() => (
    selectedUserId ? MOCK_USERS.find(user => user.id === selectedUserId) : undefined
  ), [selectedUserId]);

  const selectedUser = useMemo<MockUser | undefined>(() => (
    selectedRecord ? sanitizeRecord(selectedRecord) : undefined
  ), [selectedRecord]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (selectedRecord) {
        window.localStorage.setItem(STORAGE_KEY, selectedRecord.id);
      } else {
        window.localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, [selectedRecord]);

  const value = useMemo<MockUserContextValue>(() => ({
    user: selectedUser,
    authenticate: (username: string, password: string) => {
      const match = MOCK_USERS.find(user => user.username === username && user.password === password);
      if (!match) {
        return undefined;
      }
      setSelectedUserId(match.id);
      return sanitizeRecord(match);
    },
    logout: () => setSelectedUserId(null),
  }), [selectedUser]);

  return (
    <MockUserContext.Provider value={value}>{children}</MockUserContext.Provider>
  );
}


/**
 * A hook that exposes the mock user context.
 */
export function useMockUser(): MockUserContextValue {
  const context = useContext(MockUserContext);
  if (context === undefined) {
    throw new Error('useMockUser must be used within MockUserProvider');
  }
  return context;
}
