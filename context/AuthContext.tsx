import { useLoader } from '@/hooks/useLoader';
import { auth } from '@/services/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { createContext, useEffect, useState } from 'react';

interface AuthContextType {
  user: User | null;
  loading: boolean;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: false,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const { showLoader, hideLoader, isLoading } = useLoader();

  useEffect(() => {
    showLoader();
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(null);
      hideLoader();
    });
    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading: isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};
