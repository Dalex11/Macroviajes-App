import { db, storage } from '@/config/firebase';
import { COLORS, SPACING } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { addDoc, collection, deleteDoc, doc, getDocs, serverTimestamp, updateDoc, query, where } from 'firebase/firestore';
import { deleteObject, getDownloadURL, ref as storageRef, uploadBytes } from 'firebase/storage';
import { Download, Edit, FileText, Plus, Search, Trash2, Upload, X } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import * as IntentLauncher from 'expo-intent-launcher';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Linking,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const getResponsiveSize = (baseSize: number) => {
  const scale = SCREEN_WIDTH / 375;
  return Math.round(baseSize * Math.min(Math.max(scale, 0.8), 1.2));
};

interface Documento {
  id: string;
  nombre: string;
  tipo_archivo: 'pasaporte' | 'cedula' | 'tiquete ida' | 'tiquete regreso' | 'voucher' | 'check-in' | 'check-ming' | 'otros';
  cedula: string;
  ref_vendedor: string;
  url: string;
  storagePath?: string;
  isLocal?: boolean; // Indica si es descargado localmente
  localPath?: string; // Ruta local del archivo
  nombreCliente?: string; // Nombre del cliente propietario del documento
  referenciaCliente?: string; // Referencia del cliente
  nombreVendedor?: string; // Nombre del vendedor asociado (solo para admin)
}

interface Usuario {
  cedula: string;
  nombre: string;
  tipo: string;
}

const TIPO_ARCHIVO_OPTIONS = [
  'pasaporte',
  'cedula',
  'tiquete ida',
  'tiquete regreso',
  'voucher',
  'check-in',
  'check-ming',
  'otros',
];

export default function DocumentosScreen() {
  const { user } = useAuth();
  const isAdmin = user?.tipo === 'admin';
  const isVendedor = user?.tipo === 'vendedor';
  
  const [documentos, setDocumentos] = useState<Documento[]>([]);
  const [showCedulaModal, setShowCedulaModal] = useState<boolean>(false);
  const [cedulaInput, setCedulaInput] = useState<string>('');
  const [selectedDoc, setSelectedDoc] = useState<Documento | null>(null);
  
  const [showUploadModal, setShowUploadModal] = useState<boolean>(false);
  const [uploadNombre, setUploadNombre] = useState<string>('');
  const [uploadCedula, setUploadCedula] = useState<string>('');
  const [uploadTipoArchivo, setUploadTipoArchivo] = useState<string>('pasaporte');
  const [uploadRefVendedor, setUploadRefVendedor] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [showTipoDropdown, setShowTipoDropdown] = useState<boolean>(false);
  const [showVendedorDropdown, setShowVendedorDropdown] = useState<boolean>(false);
  const [showCedulaDropdown, setShowCedulaDropdown] = useState<boolean>(false);
  const [vendedores, setVendedores] = useState<Usuario[]>([]);
  const [clientes, setClientes] = useState<Usuario[]>([]);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [searchText, setSearchText] = useState<string>('');

  // Editar documento
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [editingDoc, setEditingDoc] = useState<Documento | null>(null);
  const [editNombre, setEditNombre] = useState<string>('');
  const [editTipoArchivo, setEditTipoArchivo] = useState<string>('pasaporte');
  const [editSelectedFile, setEditSelectedFile] = useState<any>(null);
  const [showEditTipoDropdown, setShowEditTipoDropdown] = useState<boolean>(false);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Load usuarios and documentos from Firestore when user changes
  useEffect(() => {
    const loadData = async () => {
      await loadUsuarios();
      await loadDocumentos();
    };
    loadData();
  }, [user]);

  const loadUsuarios = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'usuarios'));
      const usuariosData: Usuario[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        usuariosData.push({
          cedula: data.cedula,
          nombre: data.nombre,
          tipo: data.tipo,
          createdBy: data.createdBy,
        } as any);
      });

      // vendedores siempre se cargan completos
      const vendedoresList = usuariosData.filter(u => u.tipo === 'vendedor');

      let clientesList: Usuario[];

      if (isAdmin) {
        // admin ve todos
        clientesList = usuariosData.filter(u => u.tipo === 'cliente');
      } else if (isVendedor) {
        // vendedor solo ve los que creó
        clientesList = usuariosData.filter(
          (u: any) => u.tipo === 'cliente' && u.createdBy === user?.cedula
        );
      } else {
        clientesList = [];
      }

      setVendedores(vendedoresList);
      setClientes(clientesList);
    } catch (error) {
      console.error('Error loading usuarios:', error);
    }
  };

  const loadLocalDocumentos = async (): Promise<Documento[]> => {
    try {
      const localDocsJson = await AsyncStorage.getItem(`documentos_local_${user?.cedula}`);
      if (!localDocsJson) {
        return [];
      }

      const localDocs = JSON.parse(localDocsJson) as Documento[];
      
      // Verificar que los archivos aún existen en el dispositivo
      const validDocs: Documento[] = [];
      for (const doc of localDocs) {
        if (doc.localPath) {
          const fileInfo = await FileSystem.getInfoAsync(doc.localPath);
          if (fileInfo.exists) {
            validDocs.push(doc);
          }
        }
      }

      // Actualizar AsyncStorage con solo los documentos válidos
      if (validDocs.length !== localDocs.length) {
        await AsyncStorage.setItem(`documentos_local_${user?.cedula}`, JSON.stringify(validDocs));
      }

      return validDocs;
    } catch (error) {
      console.error('Error loading local documentos:', error);
      return [];
    }
  };

  const saveLocalDocumento = async (documento: Documento) => {
    try {
      const existingDocs = await loadLocalDocumentos();
      const docExists = existingDocs.find(d => d.id === documento.id);
      
      if (!docExists) {
        existingDocs.push(documento);
        await AsyncStorage.setItem(`documentos_local_${user?.cedula}`, JSON.stringify(existingDocs));
      }
    } catch (error) {
      console.error('Error saving local documento:', error);
    }
  };

  const loadDocumentos = async () => {
    try {
      // Cargar primero documentos locales (offline)
      const localDocs = await loadLocalDocumentos();

      let q;

      if (isAdmin) {
        q = query(collection(db, 'documentos'));
      } 
      else if (isVendedor) {
        q = query(
          collection(db, 'documentos'),
          where('ref_vendedor', '==', user?.cedula)
        );
      } 
      else {
        q = query(
          collection(db, 'documentos'),
          where('cedula', '==', user?.cedula)
        );
      }
      
      // Luego cargar desde Firestore
      const querySnapshot = await getDocs(q);
      const firebaseDocs: Documento[] = [];
      
      // Traer usuarios directamente
      const usuariosSnapshot = await getDocs(collection(db, 'usuarios'));

      const usuariosMap = new Map();

      usuariosSnapshot.forEach((doc) => {
        const data = doc.data();
        usuariosMap.set(data.cedula, {
          nombre: data.nombre,
          referencia: data.referencia,
          tipo: data.tipo,
        });
      });

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const cliente = usuariosMap.get(data.cedula);
        const vendedor = usuariosMap.get(data.ref_vendedor);
        
        firebaseDocs.push({
          id: doc.id,
          nombre: data.nombre,
          tipo_archivo: data.tipo_archivo,
          cedula: data.cedula,
          ref_vendedor: data.ref_vendedor,
          url: data.url,
          storagePath: data.storagePath,
          isLocal: false,
          nombreCliente: cliente?.nombre || 'No disponible',
          referenciaCliente: cliente?.referencia || 'N/A',
          nombreVendedor: vendedor?.nombre || 'No disponible',
        });
      });

      // Combinar documentos: locales primero, luego los de Firebase
      let all = [...localDocs];
      
      // Agregar documentos de Firebase que no están en local
      firebaseDocs.forEach((fbDoc) => {
        const alreadyExists = all.some(d => d.id === fbDoc.id);
        if (!alreadyExists) {
          all.push(fbDoc);
        } else {
          // Actualizar los documentos locales con la info de Firebase
          const index = all.findIndex(d => d.id === fbDoc.id);
          if (index >= 0) {
            all[index] = { ...all[index], ...fbDoc, isLocal: true };
          }
        }
      });

      // apply role filtering
      setDocumentos(all);
    } catch (error) {
      console.error('Error loading documentos:', error);
      // Intentar cargar al menos los locales
      const localDocs = await loadLocalDocumentos();
      setDocumentos(localDocs);
    }
  };

  const filteredDocumentos = isAdmin
    ? documentos.filter(doc => {
        const searchLower = searchText.toLowerCase();
        return (
          doc.nombre.toLowerCase().includes(searchLower) ||
          (doc.nombreCliente?.toLowerCase().includes(searchLower) ?? false) ||
          doc.cedula.toLowerCase().includes(searchLower) ||
          (doc.nombreVendedor?.toLowerCase().includes(searchLower) ?? false)
        );
      })
    : isVendedor
    ? documentos.filter(doc => {
        const searchLower = searchText.toLowerCase();
        return (
          doc.ref_vendedor === user?.cedula &&
          (doc.nombre.toLowerCase().includes(searchLower) ||
            (doc.nombreCliente?.toLowerCase().includes(searchLower) ?? false) ||
            doc.cedula.toLowerCase().includes(searchLower) ||
            (doc.nombreVendedor?.toLowerCase().includes(searchLower) ?? false))
        );
      })
    : documentos.filter(doc => {
        const searchLower = searchText.toLowerCase();
        return (
          doc.cedula === user?.cedula &&
          (doc.nombre.toLowerCase().includes(searchLower) ||
            (doc.nombreCliente?.toLowerCase().includes(searchLower) ?? false) ||
            doc.cedula.toLowerCase().includes(searchLower))
        );
      });

  const handleDownload = (doc: Documento) => {
    setSelectedDoc(doc);
    setShowCedulaModal(true);
  };

  const getMimeType = (path: string) => {
    const ext = path.split('.').pop()?.toLowerCase();

    switch (ext) {
      case 'pdf':
        return 'application/pdf';

      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'webp':
        return 'image/*';

      case 'txt':
        return 'text/plain';

      default:
        return '*/*';
    }
  };

  const openFile = async (path: string) => {
    try {

      if (Platform.OS === 'ios') {
        await Linking.openURL(path);
        return;
      }

      const contentUri = await FileSystem.getContentUriAsync(path);
      const mimeType = getMimeType(path);

      await IntentLauncher.startActivityAsync(
        'android.intent.action.VIEW',
        {
          data: contentUri,
          flags: 1,
          type: mimeType,
        }
      );

    } catch (error) {
      console.error("Error opening file:", error);
      Alert.alert("Información", "No se pudo abrir el archivo");
    }
  };

  const confirmDownload = async () => {
    if (!selectedDoc) return;

    if (cedulaInput.trim() !== selectedDoc.cedula) {
      Alert.alert('Error', 'La cédula ingresada no coincide');
      return;
    }

    setIsDownloading(true);

    try {
      const fileExtension = selectedDoc.url.split('.').pop() || 'pdf';
      const sanitizedName = selectedDoc.nombre.replace(/[^a-zA-Z0-9]/g, '_');
      const fileName = `${sanitizedName}.${fileExtension}`;
      const documentDir = FileSystem.documentDirectory || '';
      const filePath = `${documentDir}${fileName}`;

      // Verificar si el archivo ya existe
      const fileInfo = await FileSystem.getInfoAsync(filePath);
      
      if (fileInfo.exists) {
        console.log('Archivo ya existe localmente:', filePath);
        setShowCedulaModal(false);
        setCedulaInput('');
        setSelectedDoc(null);
        setIsDownloading(false);

        // Abrir el archivo ya descargado
        try {
          await openFile(filePath);
        } catch (error) {
          console.error('Error abriendo archivo:', error);
          Alert.alert('Información', 'El archivo se encuentra guardado en tu dispositivo');
        }
        return;
      }

      // Si el documento tiene localPath, usa ese en lugar de descargar
      if (selectedDoc.isLocal && selectedDoc.localPath) {
        console.log('Abriendo documento desde caché local:', selectedDoc.localPath);
        setShowCedulaModal(false);
        setCedulaInput('');
        setSelectedDoc(null);
        setIsDownloading(false);

        try {
          await openFile(filePath);
        } catch (error) {
          console.error('Error abriendo archivo:', error);
          Alert.alert('Información', 'El archivo se encuentra guardado en tu dispositivo');
        }
        return;
      }

      // Descargar archivo
      console.log('Descargando documento desde:', selectedDoc.url);
      console.log('Guardando en:', filePath);

      const downloadResumable = FileSystem.createDownloadResumable(
        selectedDoc.url,
        filePath,
        {}
      );

      const response = await downloadResumable.downloadAsync();
      
      if (!response) {
        throw new Error('Error en la descarga');
      }

      console.log('Documento descargado:', response.uri);

      // Guardar metadatos del documento descargado
      await saveLocalDocumento({
        ...selectedDoc,
        isLocal: true,
        localPath: response.uri,
      });

      setShowCedulaModal(false);
      setCedulaInput('');
      setSelectedDoc(null);
      setIsDownloading(false);

      // Preguntar si abrir el archivo
      Alert.alert(
        'Descarga completa',
        'El documento se ha descargado correctamente. ¿Deseas abrirlo?',
        [
          {
            text: 'Cancelar',
            style: 'cancel',
          },
          {
            text: 'Abrir',
            onPress: async () => {
              try {
                await openFile(filePath);
              } catch (openError) {
                console.error('Error abriendo documento:', openError);
                Alert.alert('Información', 'El archivo se encuentra guardado en tu dispositivo');
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error descargando documento:', error);
      setIsDownloading(false);
      Alert.alert(
        'Error',
        'No se pudo descargar el documento. Verifica la conexión a internet y que la URL sea válida.'
      );
    }
  };

  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];

        if (!file.name.toLowerCase().endsWith('.pdf')) {
          Alert.alert('Error', 'Solo se permiten archivos PDF');
          return;
        }

        setSelectedFile(file);
        Alert.alert('Archivo seleccionado', file.name);
      }
    } catch (error) {
      console.error('Error picking document:', error);
      Alert.alert('Error', 'No se pudo seleccionar el archivo');
    }
  };

  const handleAddDocumento = async () => {
    setUploadNombre('');
    setUploadCedula('');
    setUploadTipoArchivo('pasaporte');
    if (isVendedor) {
      setUploadRefVendedor(user?.cedula || '');
    } else {
      setUploadRefVendedor('');
    }
    setSelectedFile(null);
    // Cargar usuarios antes de mostrar el modal
    await loadUsuarios();
    setShowUploadModal(true);
  };

const handleUploadSubmit = async () => {
    if (!uploadNombre || !uploadCedula || !uploadTipoArchivo || !selectedFile || !uploadRefVendedor) {
      Alert.alert('Error', 'Todos los campos son obligatorios y debes seleccionar un archivo');
      return;
    }

    if (!selectedFile.name.toLowerCase().endsWith('.pdf')) {
      Alert.alert('Error', 'Solo se permiten archivos PDF');
      return;
    }

    setIsSubmitting(true);

    try {
      // download file blob from uri
      const response = await fetch(selectedFile.uri);
      const blob = await response.blob();
      const ext = selectedFile.name?.split('.').pop() || '';
      const filename = `documentos/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
      const sRef = storageRef(storage, filename);
      await uploadBytes(sRef, blob);
      const downloadURL = await getDownloadURL(sRef);

      // save record in Firestore
      await addDoc(collection(db, 'documentos'), {
        nombre: uploadNombre,
        tipo_archivo: uploadTipoArchivo,
        cedula: uploadCedula,
        ref_vendedor: isVendedor ? user?.cedula : uploadRefVendedor,
        url: downloadURL,
        storagePath: filename,
        mimeType: selectedFile.mimeType,
        createdAt: serverTimestamp(),
      });

      // refresh list
      await loadDocumentos();

      setShowUploadModal(false);
      Alert.alert('Éxito', 'Documento subido correctamente');
    } catch (error) {
      console.error('Error al subir documento:', error);
      Alert.alert('Error', 'No se pudo subir el documento. Intenta nuevamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteDocumento = (id: string) => {
    Alert.alert(
      'Eliminar Documento',
      '¿Estás seguro que deseas eliminar este documento?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsSubmitting(true);
              const docToDelete = documentos.find(d => d.id === id);
              if (docToDelete && (docToDelete as any).storagePath) {
                const sRef = storageRef(storage, (docToDelete as any).storagePath);
                await deleteObject(sRef);
              }

              // Eliminar del almacenamiento local
              if (docToDelete?.localPath) {
                try {
                  await FileSystem.deleteAsync(docToDelete.localPath);
                } catch (error) {
                  console.error('Error deleting local file:', error);
                }
              }

              // Eliminar del caché de AsyncStorage
              const localDocs = await loadLocalDocumentos();
              const filteredDocs = localDocs.filter(d => d.id !== id);
              await AsyncStorage.setItem(`documentos_local_${user?.cedula}`, JSON.stringify(filteredDocs));

              await deleteDoc(doc(db, 'documentos', id));
              await loadDocumentos();
              setIsSubmitting(false);
              Alert.alert('Éxito', 'Documento eliminado correctamente');
            } catch (error) {
              console.error('Error deleting documento:', error);
              setIsSubmitting(false);
              Alert.alert('Error', 'No se pudo eliminar el documento');
            }
          },
        },
      ]
    );
  };

  const handleEditDocumento = (documento: Documento) => {
    setEditingDoc(documento);
    setEditNombre(documento.nombre);
    setEditTipoArchivo(documento.tipo_archivo);
    setEditSelectedFile(null);
    setShowEditModal(true);
  };

  const handlePickEditDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];

        if (!file.name.toLowerCase().endsWith('.pdf')) {
          Alert.alert('Error', 'Solo se permiten archivos PDF');
          return;
        }

        setEditSelectedFile(file);
        Alert.alert('Archivo seleccionado', file.name);
      }
    } catch (error) {
      console.error('Error picking document:', error);
      Alert.alert('Error', 'No se pudo seleccionar el archivo');
    }
  };

  const handleUpdateDocumento = async () => {
    if (!editingDoc || !editNombre || !editTipoArchivo) {
      Alert.alert('Error', 'El nombre y tipo de archivo son obligatorios');
      return;
    }

    setIsUpdating(true);

    try {
      let newDownloadURL = editingDoc.url;
      let newStoragePath = editingDoc.storagePath;

      // Si se seleccionó un nuevo archivo, subir a Storage
      if (editSelectedFile) {
        // Eliminar archivo anterior
        if (editingDoc.storagePath) {
          const oldRef = storageRef(storage, editingDoc.storagePath);
          await deleteObject(oldRef);
        }

        // Subir nuevo archivo
        const response = await fetch(editSelectedFile.uri);
        const blob = await response.blob();
        const ext = editSelectedFile.name?.split('.').pop() || '';
        const filename = `documentos/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
        const sRef = storageRef(storage, filename);
        await uploadBytes(sRef, blob);
        newDownloadURL = await getDownloadURL(sRef);
        newStoragePath = filename;
      }

      // Actualizar documento en Firestore
      await updateDoc(doc(db, 'documentos', editingDoc.id), {
        nombre: editNombre,
        tipo_archivo: editTipoArchivo,
        url: newDownloadURL,
        storagePath: newStoragePath,
        updatedAt: serverTimestamp(),
      });

      // Recargar documentos
      await loadDocumentos();

      setShowEditModal(false);
      setEditingDoc(null);
      Alert.alert('Éxito', 'Documento actualizado correctamente');
    } catch (error) {
      console.error('Error actualizando documento:', error);
      Alert.alert('Error', 'No se pudo actualizar el documento');
    } finally {
      setIsUpdating(false);
    }
  };

  const renderDocumento = ({ item }: { item: Documento }) => (
    <View style={styles.documentCard}>
      <View style={styles.iconContainer}>
        <FileText size={getResponsiveSize(32)} color={COLORS.primary} />
        {item.isLocal && (
          <View style={styles.offlineBadge}>
            <Text style={styles.offlineBadgeText}>✓</Text>
          </View>
        )}
      </View>
      
      <View style={styles.documentInfo}>
        <Text style={styles.documentName}>{item.nombre}</Text>
        <Text style={styles.documentType}>{item.tipo_archivo.toUpperCase()}</Text>
        {item.isLocal && <Text style={styles.offlineIndicator}>📱 Guardado localmente</Text>}
        {(isAdmin || isVendedor) && (
          <Text style={styles.documentCedula}>Nombre: {item.nombreCliente || 'No disponible'}</Text>
        )}
        {(isAdmin || isVendedor) && (
          <Text style={styles.documentCedula}>Cédula: {item.cedula}</Text>
        )}
        {(isAdmin || isVendedor) && (
          <Text style={styles.documentCedula}>Referencia: {item.referenciaCliente}</Text>
        )}
        {isAdmin && item.ref_vendedor && (
          <Text style={styles.documentCedula}>Vendedor: {item.nombreVendedor}</Text>
        )}
      </View>

      <View style={styles.documentActions}>
        <TouchableOpacity
          style={[styles.iconButton, styles.iconButtonFirst]}
          onPress={() => handleDownload(item)}
        >
          <Download size={getResponsiveSize(20)} color={COLORS.primary} />
        </TouchableOpacity>

        {(isAdmin || isVendedor) && (
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => handleEditDocumento(item)}
          >
            <Edit size={getResponsiveSize(20)} color={COLORS.secondary} />
          </TouchableOpacity>
        )}

        {isAdmin && (
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => handleDeleteDocumento(item.id)}
          >
            <Trash2 size={getResponsiveSize(20)} color={COLORS.error} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <View style={styles.container} pointerEvents="box-none">
      <View style={styles.searchContainer}>
        <View style={styles.searchInputWrapper}>
          <Search size={getResponsiveSize(20)} color={COLORS.textLight} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar..."
            value={searchText}
            onChangeText={setSearchText}
            placeholderTextColor={COLORS.textLight}
          />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={() => setSearchText('')}>
              <X size={getResponsiveSize(20)} color={COLORS.textLight} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {filteredDocumentos.length === 0 ? (
        <View style={styles.emptyContainer}>
          <FileText size={getResponsiveSize(64)} color={COLORS.textLight} />
          <Text style={styles.emptyText}>
            {searchText ? 'No hay documentos que coincidan con la búsqueda' : 'No hay documentos disponibles'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredDocumentos}
          renderItem={renderDocumento}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}

      {(isAdmin || isVendedor) && (
        <TouchableOpacity style={styles.fab} onPress={handleAddDocumento} activeOpacity={0.8}>
          <Plus size={getResponsiveSize(28)} color={COLORS.white} />
        </TouchableOpacity>
      )}

      <Modal
        visible={showCedulaModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCedulaModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Validar Identidad</Text>
              <TouchableOpacity onPress={() => setShowCedulaModal(false)}>
                <X size={getResponsiveSize(24)} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalText}>
              Ingresa tu número de cédula para descargar el documento
            </Text>

            <TextInput
              style={styles.modalInput}
              placeholder="Número de cédula"
              value={cedulaInput}
              onChangeText={setCedulaInput}
              keyboardType="numeric"
            />

            <TouchableOpacity 
              style={[styles.modalButton, isDownloading && styles.modalButtonDisabled]} 
              onPress={confirmDownload}
              disabled={isDownloading}
            >
              {isDownloading ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <Text style={styles.modalButtonText}>CONFIRMAR DESCARGA</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showUploadModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowUploadModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.uploadModalContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Subir Documento</Text>
                <TouchableOpacity onPress={() => setShowUploadModal(false)}>
                  <X size={getResponsiveSize(24)} color={COLORS.text} />
                </TouchableOpacity>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Nombre del Archivo</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="Ej: Pasaporte Juan Pérez"
                  value={uploadNombre}
                  onChangeText={setUploadNombre}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Cédula del Pasajero *</Text>
                <TouchableOpacity
                  style={styles.dropdownButton}
                  onPress={() => setShowCedulaDropdown(!showCedulaDropdown)}
                >
                  <Text style={styles.dropdownButtonText}>
                    {uploadCedula ? clientes.find(c => c.cedula === uploadCedula)?.nombre || uploadCedula : 'Seleccionar cliente'}
                  </Text>
                </TouchableOpacity>
                {showCedulaDropdown && (
                  <View style={styles.dropdownList}>
                    <ScrollView style={styles.dropdownScroll} nestedScrollEnabled>
                      {clientes.map((cliente) => (
                        <TouchableOpacity
                          key={cliente.cedula}
                          style={styles.dropdownItem}
                          onPress={() => {
                            setUploadCedula(cliente.cedula);
                            setShowCedulaDropdown(false);
                          }}
                        >
                          <Text style={styles.dropdownItemText}>{cliente.nombre} - {cliente.cedula}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Tipo de Archivo</Text>
                <TouchableOpacity
                  style={styles.dropdownButton}
                  onPress={() => setShowTipoDropdown(!showTipoDropdown)}
                >
                  <Text style={styles.dropdownButtonText}>{uploadTipoArchivo}</Text>
                </TouchableOpacity>
                {showTipoDropdown && (
                  <View style={styles.dropdownList}>
                    <ScrollView style={styles.dropdownScroll} nestedScrollEnabled>
                      {TIPO_ARCHIVO_OPTIONS.map((tipo) => (
                        <TouchableOpacity
                          key={tipo}
                          style={styles.dropdownItem}
                          onPress={() => {
                            setUploadTipoArchivo(tipo);
                            setShowTipoDropdown(false);
                          }}
                        >
                          <Text style={styles.dropdownItemText}>{tipo}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </View>

              {!isVendedor && (
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Ref. Vendedor *</Text>
                  <TouchableOpacity
                    style={styles.dropdownButton}
                    onPress={() => setShowVendedorDropdown(!showVendedorDropdown)}
                  >
                    <Text style={styles.dropdownButtonText}>
                      {uploadRefVendedor ? vendedores.find(v => v.cedula === uploadRefVendedor)?.nombre || uploadRefVendedor : 'Seleccionar vendedor'}
                    </Text>
                  </TouchableOpacity>
                  {showVendedorDropdown && (
                    <View style={styles.dropdownList}>
                      <ScrollView style={styles.dropdownScroll} nestedScrollEnabled>
                        {vendedores.map((vendedor) => (
                          <TouchableOpacity
                            key={vendedor.cedula}
                            style={styles.dropdownItem}
                            onPress={() => {
                              setUploadRefVendedor(vendedor.cedula);
                              setShowVendedorDropdown(false);
                            }}
                          >
                            <Text style={styles.dropdownItemText}>{vendedor.nombre} - {vendedor.cedula}</Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  )}
                </View>
              )}

              <TouchableOpacity style={styles.filePickerButton} onPress={handlePickDocument}>
                <Upload size={getResponsiveSize(20)} color={COLORS.white} />
                <Text style={styles.filePickerButtonText}>
                  {selectedFile ? selectedFile.name : 'Seleccionar Archivo'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.modalButton, isSubmitting && styles.modalButtonDisabled]} 
                onPress={handleUploadSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator color={COLORS.white} />
                ) : (
                  <Text style={styles.modalButtonText}>SUBIR DOCUMENTO</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showEditModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.uploadModalContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Editar Documento</Text>
                <TouchableOpacity onPress={() => setShowEditModal(false)}>
                  <X size={getResponsiveSize(24)} color={COLORS.text} />
                </TouchableOpacity>
              </View>

              {editingDoc && (
                <>
                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>Nombre del Archivo</Text>
                    <TextInput
                      style={styles.modalInput}
                      placeholder="Ej: Pasaporte Juan Pérez"
                      value={editNombre}
                      onChangeText={setEditNombre}
                    />
                  </View>

                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>Cédula del Pasajero</Text>
                    <View style={[styles.dropdownButton, { opacity: 0.6 }]}>
                      <Text style={styles.dropdownButtonText}>{editingDoc.cedula}</Text>
                    </View>
                  </View>

                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>Tipo de Archivo</Text>
                    <TouchableOpacity
                      style={styles.dropdownButton}
                      onPress={() => setShowEditTipoDropdown(!showEditTipoDropdown)}
                    >
                      <Text style={styles.dropdownButtonText}>{editTipoArchivo}</Text>
                    </TouchableOpacity>
                    {showEditTipoDropdown && (
                      <View style={styles.dropdownList}>
                        <ScrollView style={styles.dropdownScroll} nestedScrollEnabled>
                          {TIPO_ARCHIVO_OPTIONS.map((tipo) => (
                            <TouchableOpacity
                              key={tipo}
                              style={styles.dropdownItem}
                              onPress={() => {
                                setEditTipoArchivo(tipo);
                                setShowEditTipoDropdown(false);
                              }}
                            >
                              <Text style={styles.dropdownItemText}>{tipo}</Text>
                            </TouchableOpacity>
                          ))}
                        </ScrollView>
                      </View>
                    )}
                  </View>

                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>Reemplazar Documento (Opcional)</Text>
                    <TouchableOpacity style={styles.filePickerButton} onPress={handlePickEditDocument}>
                      <Upload size={getResponsiveSize(20)} color={COLORS.white} />
                      <Text style={styles.filePickerButtonText}>
                        {editSelectedFile ? editSelectedFile.name : 'Seleccionar Archivo'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}

              <TouchableOpacity 
                style={[styles.modalButton, isUpdating && styles.modalButtonDisabled]} 
                onPress={handleUpdateDocumento}
                disabled={isUpdating}
              >
                {isUpdating ? (
                  <ActivityIndicator color={COLORS.white} />
                ) : (
                  <Text style={styles.modalButtonText}>ACTUALIZAR DOCUMENTO</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {isSubmitting && (
        <View style={styles.loadingOverlay} pointerEvents="auto">
          <View style={styles.loadingContent}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Cargando...</Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  searchContainer: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: 8,
    paddingHorizontal: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: SPACING.sm,
  },
  searchInput: {
    flex: 1,
    paddingVertical: SPACING.sm,
    fontSize: getResponsiveSize(14),
    color: COLORS.text,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 99999,
  },
  loadingContent: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: SPACING.xl,
    alignItems: 'center',
    elevation: 10,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  loadingText: {
    marginTop: SPACING.md,
    fontSize: getResponsiveSize(16),
    fontWeight: '600' as const,
    color: COLORS.text,
  },
  listContainer: {
    padding: SPACING.md,
    paddingBottom: Platform.OS === 'ios' ? 140 : 120,
  },
  documentCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    elevation: 2,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: `${COLORS.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
    position: 'relative',
  },
  offlineBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: COLORS.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  offlineBadgeText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
  documentInfo: {
    flex: 1,
  },
  documentName: {
    fontSize: getResponsiveSize(16),
    fontWeight: '600' as const,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  documentType: {
    fontSize: getResponsiveSize(12),
    color: COLORS.textLight,
    fontWeight: '500' as const,
  },
  documentCedula: {
    fontSize: getResponsiveSize(12),
    color: COLORS.textLight,
    marginTop: SPACING.xs,
  },
  offlineIndicator: {
    fontSize: getResponsiveSize(11),
    color: COLORS.secondary,
    fontWeight: '600' as const,
    marginTop: SPACING.xs,
  },
  documentActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    padding: SPACING.sm,
    marginLeft: SPACING.sm,
  },
  iconButtonFirst: {
    marginLeft: 0,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: getResponsiveSize(16),
    color: COLORS.textLight,
    marginTop: SPACING.md,
  },
  fab: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 150 : 130,
    right: SPACING.xl,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    zIndex: 1000,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1002,
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: SPACING.lg,
    width: '85%',
    maxWidth: 400,
  },
  uploadModalContent: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: SPACING.lg,
    width: '90%',
    maxWidth: 500,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  modalTitle: {
    fontSize: getResponsiveSize(20),
    fontWeight: '700' as const,
    color: COLORS.text,
  },
  modalText: {
    fontSize: getResponsiveSize(14),
    color: COLORS.textLight,
    marginBottom: SPACING.lg,
  },
  inputContainer: {
    marginBottom: SPACING.md,
  },
  label: {
    fontSize: getResponsiveSize(14),
    fontWeight: '600' as const,
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  modalInput: {
    backgroundColor: COLORS.background,
    borderRadius: 8,
    padding: SPACING.md,
    fontSize: getResponsiveSize(16),
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  dropdownButton: {
    backgroundColor: COLORS.background,
    borderRadius: 8,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  dropdownButtonText: {
    fontSize: getResponsiveSize(16),
    color: COLORS.text,
  },
  dropdownList: {
    backgroundColor: COLORS.white,
    borderRadius: 8,
    marginTop: SPACING.xs,
    borderWidth: 1,
    borderColor: COLORS.border,
    maxHeight: 200,
    overflow: 'hidden',
  },
  dropdownScroll: {
    maxHeight: 200,
  },
  dropdownItem: {
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  dropdownItemText: {
    fontSize: getResponsiveSize(14),
    color: COLORS.text,
  },
  filePickerButton: {
    backgroundColor: '#F47C2C',
    borderRadius: 8,
    padding: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
    gap: SPACING.sm,
  },
  filePickerButtonText: {
    color: COLORS.white,
    fontSize: getResponsiveSize(14),
    fontWeight: '600' as const,
  },
  modalButton: {
    backgroundColor: '#F47C2C',
    borderRadius: 8,
    padding: SPACING.md,
    alignItems: 'center',
    marginTop: SPACING.sm,
  },
  modalButtonText: {
    color: COLORS.white,
    fontSize: getResponsiveSize(16),
    fontWeight: '700' as const,
  },
  modalButtonDisabled: {
    opacity: 0.6,
  },
});
