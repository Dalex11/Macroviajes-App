import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { User } from '@/types/user';
import { db } from '@/config/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

const STORAGE_KEY = '@macroviajes_user';

export const [AuthProvider, useAuth] = createContextHook(() => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        setUser(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading user:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (username: string, password: string): Promise<boolean> => {
    console.log('Attempting login (username):', username);
    console.log('Attempting login (password):', password);
    try {
      const q = query(
        collection(db, 'usuarios'),
        where('username', '==', username),
        where('password', '==', password)
      );
      const querySnapshot = await getDocs(q);
      console.log('querySnapshot:', querySnapshot);

      if (!querySnapshot.empty) {
        const docSnap = querySnapshot.docs[0];
        const data = docSnap.data() as any;

        const foundUser: User = {
          id: docSnap.id,
          username: data.username ?? '',
          tipo: data.tipo ?? 'cliente',
          nombre: data.nombre ?? '',
          apellido: data.apellido ?? '',
          cedula: data.cedula ?? undefined,
          fecha_viaje: data.fecha_viaje ?? undefined,
          ...(data.password ? { password: data.password } : {}),
        } as User;

        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(foundUser));
        setUser(foundUser);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error logging in (Firestore):', error);
      return false;
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
      setUser(null);
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return {
    user,
    isLoading,
    login,
    logout,
    isAuthenticated: !!user,
    isAdmin: user?.tipo === 'admin',
  };
});
