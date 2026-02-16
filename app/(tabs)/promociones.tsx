import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions,
  Alert,
  Platform,
  Share,
  ActivityIndicator,
  TouchableWithoutFeedback,
} from 'react-native';
import { Share2, Download, Plus, Trash2 } from 'lucide-react-native';
import * as Sharing from 'expo-sharing';
import { useAuth } from '@/contexts/AuthContext';
import { COLORS, SPACING } from '@/constants/theme';
import { File as ExpoFile, Paths } from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const getResponsiveSize = (baseSize: number) => {
  const scale = SCREEN_WIDTH / 375;
  return Math.round(baseSize * Math.min(Math.max(scale, 0.8), 1.2));
};

const ICON_SIZE = getResponsiveSize(50);

interface Promocion {
  id: string;
  url: string;
}

const MOCK_PROMOCIONES: Promocion[] = [
  {
    id: '1',
    url: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&q=80',
  },
  {
    id: '2',
    url: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800&q=80',
  },
  {
    id: '3',
    url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80',
  },
];

export default function PromocionesScreen() {
  const { isAdmin } = useAuth();
  const insets = useSafeAreaInsets();
  const [promociones, setPromociones] = useState<Promocion[]>(MOCK_PROMOCIONES);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [downloading, setDownloading] = useState<boolean>(false);

  const handleShare = async (url: string) => {
    try {
      const message = 'Encontré esta súper promoción de Macroviajes, para más información escríbenos al https://wa.me/+573016814323';
      
      if (Platform.OS === 'web') {
        const response = await fetch(url);
        const blob = await response.blob();
        const file = new File([blob], 'promocion.jpg', { type: 'image/jpeg' });
        
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            text: message,
            files: [file],
          });
        } else {
          await navigator.share({
            text: `${message}\n\n${url}`,
          });
        }
      } else {
        const timestamp = Date.now();
        const filename = `macroviajes_share_${timestamp}.jpg`;
        const file = await ExpoFile.downloadFileAsync(url, new ExpoFile(Paths.cache, filename));
        const uri = file.uri;
        
        if (Platform.OS === 'ios') {
          await Share.share({
            message: message,
            url: uri,
          });
        } else {
          const isAvailable = await Sharing.isAvailableAsync();
          if (isAvailable) {
            console.log('Sharing file on Android:', uri);
            await Sharing.shareAsync(uri, {
              dialogTitle: 'Compartir promoción',
              mimeType: 'image/jpeg',
            });
          } else {
            await Share.share({
              message: `${message}\n\n${url}`,
            });
          }
        }
      }
    } catch (error) {
      console.error('Error sharing:', error);
      Alert.alert('Error', 'No se pudo compartir la imagen');
    }
  };

  const handleDownload = async (url: string) => {
    if (downloading) return;
    
    try {
      setDownloading(true);

      if (Platform.OS === 'web') {
        const response = await fetch(url);
        const blob = await response.blob();
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'promocion_macroviajes.jpg';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
        Alert.alert('Éxito', 'Imagen descargada');
        setDownloading(false);
        return;
      }

      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso Denegado', 'Se necesita permiso para guardar imágenes en la galería');
        setDownloading(false);
        return;
      }

      const timestamp = Date.now();
      const filename = `macroviajes_${timestamp}.jpg`;
      const file = await ExpoFile.downloadFileAsync(url, new ExpoFile(Paths.cache, filename));
      
      console.log('Downloaded file:', file.uri);
      const downloadResult = { uri: file.uri };
      console.log('Download result:', downloadResult);
      
      const asset = await MediaLibrary.createAssetAsync(downloadResult.uri);
      console.log('Asset created:', asset);
      
      if (Platform.OS === 'android') {
        Alert.alert('Éxito', 'Imagen guardada en la galería');
      } else {
        try {
          const album = await MediaLibrary.getAlbumAsync('Macroviajes');
          if (album) {
            await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
          } else {
            await MediaLibrary.createAlbumAsync('Macroviajes', asset, false);
          }
          Alert.alert('Éxito', 'Imagen guardada en la galería en el álbum "Macroviajes"');
        } catch (albumError) {
          console.log('Album error (but image saved):', albumError);
          Alert.alert('Éxito', 'Imagen guardada en la galería');
        }
      }
    } catch (error) {
      console.error('Error downloading:', error);
      Alert.alert('Error', 'No se pudo descargar la imagen. Intenta nuevamente.');
    } finally {
      setDownloading(false);
    }
  };

  const handleAddPromocion = () => {
    Alert.alert('Agregar Promoción', 'Funcionalidad de Firebase próximamente');
  };

  const handleDeletePromocion = (id: string) => {
    Alert.alert(
      'Eliminar Promoción',
      '¿Estás seguro que deseas eliminar esta promoción?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            setPromociones(prev => prev.filter(p => p.id !== id));
          },
        },
      ]
    );
  };

  const handleScreenPress = useCallback((event: any) => {
    const touchX = event.nativeEvent.locationX;
    const screenMiddle = SCREEN_WIDTH / 2;

    if (touchX > screenMiddle) {
      setCurrentIndex(prev => (prev + 1) % promociones.length);
    } else {
      setCurrentIndex(prev => (prev - 1 + promociones.length) % promociones.length);
    }
  }, [promociones.length]);



  const currentPromocion = promociones[currentIndex];

  return (
    <View style={styles.container} pointerEvents="box-none">
      {promociones.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No hay promociones disponibles</Text>
        </View>
      ) : (
        <TouchableWithoutFeedback onPress={handleScreenPress}>
          <View style={styles.promocionContainer} pointerEvents="auto">
            <Image source={{ uri: currentPromocion.url }} style={styles.image} resizeMode="contain" />
          </View>
        </TouchableWithoutFeedback>
      )}

      <View style={[styles.actionsOverlay, { bottom: 100 + insets.bottom }]} pointerEvents="box-none">
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleShare(currentPromocion.url)}
          disabled={downloading}
        >
          <View style={[styles.iconCircle, { width: ICON_SIZE, height: ICON_SIZE, borderRadius: ICON_SIZE / 2 }]}>
            <Share2 size={getResponsiveSize(24)} color={COLORS.white} />
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleDownload(currentPromocion.url)}
          disabled={downloading}
        >
          <View style={[styles.iconCircle, { width: ICON_SIZE, height: ICON_SIZE, borderRadius: ICON_SIZE / 2 }]}>
            {downloading ? (
              <ActivityIndicator size="small" color={COLORS.white} />
            ) : (
              <Download size={getResponsiveSize(24)} color={COLORS.white} />
            )}
          </View>
        </TouchableOpacity>

        {isAdmin && (
          <>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleDeletePromocion(currentPromocion.id)}
              disabled={downloading}
            >
              <View style={[styles.iconCircle, { width: ICON_SIZE, height: ICON_SIZE, borderRadius: ICON_SIZE / 2, backgroundColor: COLORS.error }]}>
                <Trash2 size={getResponsiveSize(24)} color={COLORS.white} />
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionButton} 
              onPress={handleAddPromocion}
            >
              <View style={[styles.iconCircle, { width: ICON_SIZE, height: ICON_SIZE, borderRadius: ICON_SIZE / 2 }]}>
                <Plus size={getResponsiveSize(28)} color={COLORS.white} />
              </View>
            </TouchableOpacity>
          </>
        )}

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.black,
  },
  promocionContainer: {
    flex: 1,
    width: SCREEN_WIDTH,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: Platform.OS === 'ios' ? 88 : 85,
  },
  image: {
    width: SCREEN_WIDTH,
    height: '100%',
  },
  actionsOverlay: {
    position: 'absolute',
    right: SPACING.md,
    flexDirection: 'column',
    alignItems: 'center',
    gap: SPACING.md,
    zIndex: 100,
  },
  actionButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircle: {
    backgroundColor: 'rgba(19, 145, 203, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.white,
  },

});
