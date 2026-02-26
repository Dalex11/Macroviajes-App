import React, { useState, useCallback, useEffect } from 'react';
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
import * as ImagePicker from 'expo-image-picker';
import { db, storage } from '@/config/firebase';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { collection, addDoc, serverTimestamp, getDocs, deleteDoc, doc } from 'firebase/firestore';
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
  storagePath: string;
  createdAt: any; // Timestamp from Firebase
}

// MOCK_PROMOCIONES removed - now loading from Firestore

export default function PromocionesScreen() {
  const { isAdmin } = useAuth();
  const insets = useSafeAreaInsets();
  const [promociones, setPromociones] = useState<Promocion[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [downloading, setDownloading] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    loadPromociones();
  }, []);

  const loadPromociones = async () => {
    try {
      setLoading(true);
      const querySnapshot = await getDocs(collection(db, 'promociones'));
      const loaded: Promocion[] = [];
      querySnapshot.forEach((doc) => {
        loaded.push({
          id: doc.id,
          url: doc.data().url,
          storagePath: doc.data().storagePath,
          createdAt: doc.data().createdAt,
        });
      });
      setPromociones(loaded);
      setCurrentIndex(0);
    } catch (error) {
      console.error('Error loading promociones:', error);
      Alert.alert('Error', 'No se pudo cargar las promociones');
    } finally {
      setLoading(false);
    }
  };

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

  const handleAddPromocion = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permiso Denegado', 'Se necesita permiso para acceder a la galería');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
      });

      // Cancelled selection
      // Newer Expo ImagePicker returns assets array; older returns { cancelled, uri }
      const localUri = (result as any).assets?.[0]?.uri ?? (result as any).uri;
      if (!localUri) return;

      // Fetch the file as a blob
      const response = await fetch(localUri);
      const blob = await response.blob();

      // Upload to Firebase Storage
      const filename = `promociones/${Date.now()}_${Math.random().toString(36).slice(2)}.jpg`;
      const storageRef = ref(storage, filename);
      await uploadBytes(storageRef, blob);
      const downloadURL = await getDownloadURL(storageRef);

      // Save a record in Firestore
      await addDoc(collection(db, 'promociones'), {
        storagePath: filename,
        url: downloadURL,
        createdAt: serverTimestamp(),
      });

      // Reload promociones list
      await loadPromociones();
      Alert.alert('Éxito', 'Promoción subida correctamente');
    } catch (error) {
      console.error('Error al subir promoción:', error);
      Alert.alert('Error', 'No se pudo subir la promoción. Intenta nuevamente.');
    }
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
          onPress: async () => {
            try {
              const promoted = promociones.find(p => p.id === id);
              if (!promoted) return;

              // Delete from Firebase Storage
              const storageRef = ref(storage, promoted.storagePath);
              await deleteObject(storageRef);

              // Delete from Firestore
              await deleteDoc(doc(db, 'promociones', id));

              // Reload list
              await loadPromociones();
              Alert.alert('Éxito', 'Promoción eliminada correctamente');
            } catch (error) {
              console.error('Error deleting promocion:', error);
              Alert.alert('Error', 'No se pudo eliminar la promoción');
            }
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

  if (loading) {
    return (
      <View style={styles.emptyContainer}>
        <ActivityIndicator size="large" color={COLORS.white} />
      </View>
    );
  }

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
