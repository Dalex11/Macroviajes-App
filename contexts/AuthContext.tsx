import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { User } from '@/types/user';

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
    console.log('Attempting login:', username);
    
    if (username === 'admin' && password === 'admin') {
      const adminUser: User = {
        id: 'admin-1',
        username: 'admin',
        tipo: 'admin',
        nombre: 'Administrador',
        apellido: 'Sistema',
      };
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(adminUser));
      setUser(adminUser);
      return true;
    }
    
    if (username === 'cliente' && password === 'cliente') {
      const clientUser: User = {
        id: 'cliente-1',
        username: 'cliente',
        tipo: 'cliente',
        nombre: 'Cliente',
        apellido: 'Demo',
        cedula: '123456789',
        fecha_viaje: '2026-03-15',
      };
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(clientUser));
      setUser(clientUser);
      return true;
    }
    
    if (username === 'vendedor' && password === 'vendedor') {
      const vendedorUser: User = {
        id: 'vendedor-1',
        username: 'vendedor',
        tipo: 'vendedor',
        nombre: 'Vendedor',
        apellido: 'Demo',
        cedula: '987654321',
      };
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(vendedorUser));
      setUser(vendedorUser);
      return true;
    }

    return false;
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
