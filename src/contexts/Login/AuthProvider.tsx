import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  ReactNode,
} from 'react';

import {authService} from '../../services/apis/authService';
import {storage} from '../../services/storage/MMKV/storage.service';

type AuthContextData = {
  authData?: string;
  loading: boolean;
  sendOtp(phoneNumber: string): Promise<string>;
  verifyOtp(
    phoneNumber: string,
    otp: string,
    verificationId: string,
  ): Promise<void>;
  signOut(): void;
  signUp(
    fullName: string,
    campusId: string,
    email: string,
    dob: string,
  ): Promise<void>;
  setAuthData(token: string): void;
};

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

type AuthProviderProps = {
  children: ReactNode;
};

const AuthProvider: React.FC<AuthProviderProps> = ({children}) => {
  const [authData, setAuthData] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStorageData = async () => {
      try {
        const storedToken = storage.getString('@AuthData');
        if (storedToken) {
          setAuthData(storedToken);
        }
      } catch (error) {
        console.error('Failed to load auth data from storage', error);
      } finally {
        setLoading(false);
      }
    };

    loadStorageData();
  });

  const sendOtp = async (phoneNumber: string): Promise<string> => {
    return await authService.sendOtp(phoneNumber);
  };

  const verifyOtp = async (
    phoneNumber: string,
    otp: string,
    verificationId: string,
  ): Promise<void> => {
    const response = await authService.verifyOtp(
      phoneNumber,
      otp,
      verificationId,
    );
    const token = response?.session?.token;

    if (token) {
      setAuthData(token);
      storage.set('@AuthData', token);
    }
  };

  const signUp = async (
    fullName: string,
    campusId: string,
    email: string,
    dob: string,
  ): Promise<void> => {
    await authService.signUp(fullName, dob, campusId, email);
  };

  const signOut = (): void => {
    // authService.signOut().catch(console.error);
    setAuthData(undefined);
    storage.delete('@AuthData');
    storage.delete('@selectedCampus');
  };

  return (
    <AuthContext.Provider
      value={{
        authData,
        loading,
        sendOtp,
        verifyOtp,
        signOut,
        signUp,
        setAuthData,
      }}>
      {children}
    </AuthContext.Provider>
  );
};

function useAuth(): AuthContextData {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export {AuthProvider, useAuth};
