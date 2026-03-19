import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  ReactNode,
} from 'react';

import {authService} from '../../services/apis/authService';
import {storage} from '../../services/storage/MMKV/storage.service';

type AuthData = {
  jwt: string;
  phone: string;
  empId: string;
};

type AuthContextData = {
  authData?: AuthData;
  loading: boolean;
  sendOtp(phoneNumber: string): Promise<string>;
  verifyOtp(
    phoneNumber: string,
    otp: string,
    verificationId: string,
  ): Promise<void>;
  signOut(): void;

  setAuthData(authData: AuthData): void;
};

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

type AuthProviderProps = {
  children: ReactNode;
};

const AuthProvider: React.FC<AuthProviderProps> = ({children}) => {
  const [authData, setAuthData] = useState<AuthData | undefined>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStorageData = async () => {
      try {
        const storedAuthData = storage.getString('@AuthData');
        if (storedAuthData) {
          const parsedAuthData = JSON.parse(storedAuthData);
          setAuthData(parsedAuthData);
        }
      } catch (error) {
        console.error('Failed to load auth data from storage', error);
      } finally {
        setLoading(false);
      }
    };

    loadStorageData();
  }, []);

  const sendOtp = async (phoneNumber: string): Promise<string> => {
    console.log('phoneNumber', phoneNumber);
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
    console.log('OTP verification response', response);
    const token = response?.session?.token;
    const phone = response?.session?.phoneNumber;
    const empId = response?.session?.empId;

    if (token && phone) {
      const authDataObj = {
        jwt: token,
        phone: phone,
        empId: empId,
      };
      setAuthData(authDataObj);
      storage.set('@AuthData', JSON.stringify(authDataObj));
    }
  };

  const signOut = async (): Promise<void> => {
    setAuthData(undefined);
    storage.clearAll();
  };

  return (
    <AuthContext.Provider
      value={{
        authData,
        loading,
        sendOtp,
        verifyOtp,
        signOut,

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
