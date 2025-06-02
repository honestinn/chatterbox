import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';
import { apiClient } from '@/services/apiClient';
import { Platform } from 'react-native';
import { ENDPOINTS } from '@/constants/Api';

interface User {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateUserProfile: (updates: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  signIn: async () => {},
  signUp: async () => {},
  signOut: async () => {},
  updateUserProfile: async () => {},
});

// For web, use localStorage instead of SecureStore
const saveToken = async (token: string) => {
  if (Platform.OS === 'web') {
    localStorage.setItem('auth_token', token);
  } else {
    await SecureStore.setItemAsync('auth_token', token);
  }
};

const getToken = async () => {
  if (Platform.OS === 'web') {
    return localStorage.getItem('auth_token');
  } else {
    return await SecureStore.getItemAsync('auth_token');
  }
};

const removeToken = async () => {
  if (Platform.OS === 'web') {
    localStorage.removeItem('auth_token');
  } else {
    await SecureStore.deleteItemAsync('auth_token');
  }
};

// Store user data
const saveUser = async (userData: User) => {
  const userString = JSON.stringify(userData);
  if (Platform.OS === 'web') {
    localStorage.setItem('user_data', userString);
  } else {
    await SecureStore.setItemAsync('user_data', userString);
  }
};

const getUser = async (): Promise<User | null> => {
  try {
    if (Platform.OS === 'web') {
      const userString = localStorage.getItem('user_data');
      return userString ? JSON.parse(userString) : null;
    } else {
      const userString = await SecureStore.getItemAsync('user_data');
      return userString ? JSON.parse(userString) : null;
    }
  } catch (error) {
    console.error('Error parsing user data:', error);
    return null;
  }
};

const removeUser = async () => {
  if (Platform.OS === 'web') {
    localStorage.removeItem('user_data');
  } else {
    await SecureStore.deleteItemAsync('user_data');
  }
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check if user is already logged in
  useEffect(() => {
    const loadUser = async () => {
      try {
        const token = await getToken();
        if (token) {
          const userData = await getUser();
          if (userData) {
            setUser(userData);
          } else {
            // If we have a token but no user data, try to fetch user data
            try {
              const response = await apiClient.get('/users/me');
              setUser(response.data);
              await saveUser(response.data);
            } catch (err) {
              console.error('Error fetching user data:', err);
              // If fetching user data fails, remove token
              await removeToken();
            }
          }
        }
      } catch (err) {
        console.error('Error loading user:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const response = await apiClient.post(ENDPOINTS.LOGIN, { email, password });
      const { token, user: userData } = response.data;
      
      await saveToken(token);
      await saveUser(userData);
      
      setUser(userData);
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  };

  const signUp = async (name: string, email: string, password: string) => {
    try {
      const response = await apiClient.post(ENDPOINTS.REGISTER, { name, email, password });
      const { token, user: userData } = response.data;
      
      await saveToken(token);
      await saveUser(userData);
      
      setUser(userData);
    } catch (error) {
      console.error('Sign up error:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await removeToken();
      await removeUser();
      setUser(null);
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  };

  const updateUserProfile = async (updates: Partial<User>) => {
    if (!user) return;
    
    try {
      // In a real app, you would send these updates to the server
      // For now, we'll just update the local state
      const updatedUser = { ...user, ...updates };
      await saveUser(updatedUser);
      setUser(updatedUser);
    } catch (error) {
      console.error('Update user profile error:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      isLoading,
      signIn,
      signUp,
      signOut,
      updateUserProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);