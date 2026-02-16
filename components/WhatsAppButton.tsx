import React from 'react';
import { TouchableOpacity, StyleSheet, Alert, Linking, Dimensions } from 'react-native';
import { MessageCircle } from 'lucide-react-native';
import { COLORS } from '@/constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePathname } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const getResponsiveSize = (baseSize: number) => {
  const scale = SCREEN_WIDTH / 375;
  return Math.round(baseSize * Math.min(Math.max(scale, 0.8), 1.2));
};

const WHATSAPP_SIZE = getResponsiveSize(50);

export default function WhatsAppButton() {
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const { user } = useAuth();
  
  const isPromocionesView = pathname === '/promociones';
  const isDocumentosView = pathname === '/documentos';
  const isJuegosView = pathname === '/juegos';
  const isVendedor = user?.tipo === 'vendedor';
  
  if (isVendedor && (isDocumentosView || isJuegosView)) {
    return null;
  }
  
  const bottomOffset = isPromocionesView ? 100 : 85;

  const handleWhatsAppPress = async () => {
    const phoneNumber = '573016814323';
    const message = 'Hola, vi la aplicación de Macroviajes y me gustaría obtener más información';
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
    <TouchableOpacity 
      style={[
        styles.whatsappButton,
        {
          bottom: bottomOffset + insets.bottom,
          width: WHATSAPP_SIZE,
          height: WHATSAPP_SIZE,
          borderRadius: WHATSAPP_SIZE / 2,
        }
      ]}
      onPress={handleWhatsAppPress}
      activeOpacity={0.8}
    >
      <MessageCircle size={getResponsiveSize(24)} color={COLORS.white} fill={COLORS.white} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  whatsappButton: {
    position: 'absolute',
    right: 16,
    backgroundColor: '#25D366',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 8,
    zIndex: 1000,
  },
});
