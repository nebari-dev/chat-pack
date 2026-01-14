import {
  createContext,
  useContext,
  useState,
  useEffect 
} from 'react'

import {
  pb
} from '@/api'

import type {
  RecordModel
} from 'pocketbase';

import * as api from '@/api'

export
type UserLoginOptions = {
  /**
   * username for the login
   */
  readonly email: string;
  /**
   * password for the login
   */
  readonly password: string;
}

export
type AuthConfig = {
  /**
   * User Login status
   */
  readonly isAuthenticated: boolean;

  /**
   * Logged in User
   */
  readonly user: RecordModel | null;

  /**
   * A callback for the login
   */
  readonly login: (options: UserLoginOptions) => Promise<RecordModel | null>;

  /**
   * A callback for the login
   */
  readonly logout: () => void;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState(pb.authStore.record);
  const isAuthenticated = user !== null;

  // Sync user state with PocketBase auth store
  useEffect(() => {
    return pb.authStore.onChange((_token, record) => {
      setUser(record);
    });
  }, []);

  /**
   * login using Pocketbase authentication
   * 
   * @param options (email, password)
   * @returns PocketBase (RecordModel) type object
   */
  const login = async (options: UserLoginOptions) => {
    const data = await api.login(options);
    setUser(data.record);

    return user;
  }

  /**
   * Clear the PocketBase auth store
   */  
  const logout = () => {
    pb.authStore.clear();
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

/**
 * Auth context provider
 */
export
const AuthContext = createContext<AuthConfig | undefined>(undefined)

// return auth context
export function useAuth(): AuthConfig {

  const config = useContext(AuthContext)

  if (config === undefined) {
    throw new Error('missing `AuthContext`')
  }

  return config
}

