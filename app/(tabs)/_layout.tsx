import { Tabs, useRouter } from "expo-router";
import { TouchableOpacity, View, StyleSheet, Alert, Text, Image, Dimensions, Linking } from "react-native";
import { ImageIcon, FileText, Gamepad2, LogOut, UserPlus } from "lucide-react-native";
import React from "react";
import { useAuth } from '@/contexts/AuthContext';
import { COLORS } from '@/constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import WhatsAppButton from '@/components/WhatsAppButton';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const getResponsiveSize = (baseSize: number) => {
  const scale = SCREEN_WIDTH / 375;
  return Math.round(baseSize * Math.min(Math.max(scale, 0.8), 1.2));
};

export default function TabLayout() {
  const { logout, isAdmin, user } = useAuth();
  const isCliente = user?.tipo === 'cliente';
  const isVendedor = user?.tipo === 'vendedor';
  const showWhatsAppButton = isCliente || isVendedor;
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handleLogout = () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro que deseas cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cerrar Sesión',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/login');
          },
        },
      ]
    );
  };

  const handleLogoPress = async () => {
    const phoneNumber = '573016814323';
    const message = 'Hola Macroviajes, me gustaría obtener más información';
    const url = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Error', 'No se pudo abrir WhatsApp. Asegúrate de tenerlo instalado.');
      }
    } catch (error) {
      console.error('Error opening WhatsApp:', error);
      Alert.alert('Error', 'No se pudo abrir WhatsApp');
    }
  };

  return (
    <>
    <Tabs
      screenOptions={{
        headerShown: true,
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E8E8E8',
          paddingBottom: Math.max(insets.bottom, 10),
          paddingTop: 10,
          height: 60 + Math.max(insets.bottom, 10),
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          position: 'absolute' as const,
          bottom: 0,
          left: 0,
          right: 0,
        },
        tabBarShowLabel: true,
        tabBarActiveTintColor: COLORS.secondary,
        tabBarInactiveTintColor: '#888888',
        tabBarLabelStyle: {
          fontSize: getResponsiveSize(11),
          fontWeight: '600' as const,
          marginTop: 4,
        },
        tabBarIconStyle: {
          marginBottom: 0,
        },
        headerStyle: {
          backgroundColor: COLORS.primary,
          elevation: 4,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.2,
          shadowRadius: 3,
        },
        headerTintColor: COLORS.white,
        headerTitle: '',
        headerRight: () => (
          <View style={styles.headerRightContainer}>
            <TouchableOpacity onPress={handleLogoPress} style={styles.logoContainer} activeOpacity={0.7}>
              <Image 
                source={require('@/assets/images/icon.png')} 
                style={styles.logo}
                resizeMode="contain"
              />
              <Text style={styles.appName}>MACROVIAJES</Text>
            </TouchableOpacity>
          </View>
        ),
        headerLeft: () => (
          <View style={styles.headerLeftContainer}>
            {(isAdmin || isVendedor) && (
              <TouchableOpacity onPress={() => router.push('/crear-usuario')} style={styles.headerButton}>
                <UserPlus size={getResponsiveSize(22)} color={COLORS.white} />
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={handleLogout} style={styles.headerButton}>
              <LogOut size={getResponsiveSize(22)} color={COLORS.white} />
            </TouchableOpacity>
          </View>
        ),
      }}
    >
      <Tabs.Screen
        name="promociones"
        options={{
          tabBarLabel: "Promociones",
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconContainer, focused && styles.iconContainerActive]}>
              <ImageIcon size={getResponsiveSize(24)} color={focused ? COLORS.secondary : '#888888'} strokeWidth={2} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="documentos"
        options={{
          tabBarLabel: "Documentos",
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconContainer, focused && styles.iconContainerActive]}>
              <FileText size={getResponsiveSize(24)} color={focused ? COLORS.secondary : '#888888'} strokeWidth={2} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="juegos"
        options={{
          tabBarLabel: "Juegos",
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconContainer, focused && styles.iconContainerActive]}>
              <Gamepad2 size={getResponsiveSize(24)} color={focused ? COLORS.secondary : '#888888'} strokeWidth={2} />
            </View>
          ),
        }}
      />
    </Tabs>
    {showWhatsAppButton && <WhatsAppButton />}
    </>
  );
}

const styles = StyleSheet.create({
  headerRightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  headerLeftContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 16,
  },
  headerButton: {
    padding: 8,
    marginHorizontal: 4,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    width: getResponsiveSize(32),
    height: getResponsiveSize(32),
    marginRight: 8,
  },
  appName: {
    fontSize: getResponsiveSize(18),
    fontWeight: '700' as const,
    color: COLORS.white,
    letterSpacing: 0.5,
  },
  iconContainer: {
    padding: 6,
    borderRadius: 8,
  },
  iconContainerActive: {
    backgroundColor: 'rgba(236, 111, 53, 0.1)',
  },
});
