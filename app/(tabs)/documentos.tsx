import { db, storage } from '@/config/firebase';
import { COLORS, SPACING } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { addDoc, collection, deleteDoc, doc, getDocs, serverTimestamp } from 'firebase/firestore';
import { deleteObject, getDownloadURL, ref as storageRef, uploadBytes } from 'firebase/storage';
import { Download, Edit, FileText, Plus, Trash2, Upload, X } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
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

  // Load usuarios and documentos from Firestore when user changes
  useEffect(() => {
    loadUsuarios();
    loadDocumentos();
  }, [user]);

  const loadUsuarios = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'usuarios'));
      const usuariosData: Usuario[] = [];
      querySnapshot.forEach((doc) => {
        usuariosData.push({
          cedula: doc.data().cedula,
          nombre: doc.data().nombre,
          tipo: doc.data().tipo,
        });
      });

      // Filter vendedores and clientes
      const vendedoresList = usuariosData.filter(u => u.tipo === 'vendedor');
      const clientesList = usuariosData.filter(u => u.tipo === 'cliente');

      setVendedores(vendedoresList);
      setClientes(clientesList);
    } catch (error) {
      console.error('Error loading usuarios:', error);
      // Keep empty arrays on error
    }
  };

  const loadDocumentos = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'documentos'));
      const all: Documento[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        all.push({
          id: doc.id,
          nombre: data.nombre,
          tipo_archivo: data.tipo_archivo,
          cedula: data.cedula,
          ref_vendedor: data.ref_vendedor,
          url: data.url,
          storagePath: data.storagePath,
        });
      });

      // apply role filtering
      let filtered = all;
      if (!isAdmin) {
        if (isVendedor) {
          filtered = all.filter(d => d.ref_vendedor === user?.cedula);
        } else {
          filtered = all.filter(d => d.cedula === user?.cedula);
        }
      }

      setDocumentos(filtered);
    } catch (error) {
      console.error('Error loading documentos:', error);
    }
  };

  const filteredDocumentos = isAdmin
    ? documentos
    : isVendedor
    ? documentos.filter(doc => doc.ref_vendedor === user?.cedula)
    : documentos.filter(doc => doc.cedula === user?.cedula);

  const handleDownload = (doc: Documento) => {
    setSelectedDoc(doc);
    setShowCedulaModal(true);
  };

  const confirmDownload = async () => {
    if (!selectedDoc) return;

    if (cedulaInput.trim() !== selectedDoc.cedula) {
      Alert.alert('Error', 'La cédula ingresada no coincide');
      return;
    }

    setIsDownloading(true);

    try {
      const fileName = `${selectedDoc.nombre.replace(/\s+/g, '_')}_${Date.now()}`;
      const fileExtension = selectedDoc.url.split('.').pop() || 'pdf';
      const destination = new File(Paths.cache, `${fileName}.${fileExtension}`);

      console.log('Descargando documento desde:', selectedDoc.url);
      console.log('Guardando en:', destination.uri);

      const downloadResult = await File.downloadFileAsync(
        selectedDoc.url,
        destination
      );

      console.log('Documento descargado:', downloadResult.uri);

      setShowCedulaModal(false);
      setCedulaInput('');
      setSelectedDoc(null);
      setIsDownloading(false);

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
                await Sharing.shareAsync(downloadResult.uri, {
                  UTI: 'public.item',
                  mimeType: 'application/pdf',
                });
              } catch (openError) {
                console.error('Error abriendo documento:', openError);
                Alert.alert('Error', 'No se pudo abrir el documento');
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
        'No se pudo descargar el documento. Verifica la conexión a internet.'
      );
    }
  };

  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setSelectedFile(result.assets[0]);
        Alert.alert('Archivo seleccionado', result.assets[0].name);
      }
    } catch (error) {
      console.error('Error picking document:', error);
      Alert.alert('Error', 'No se pudo seleccionar el archivo');
    }
  };

  const handleAddDocumento = () => {
    setUploadNombre('');
    setUploadCedula('');
    setUploadTipoArchivo('pasaporte');
    if (isVendedor) {
      setUploadRefVendedor(user?.cedula || '');
    } else {
      setUploadRefVendedor('');
    }
    setSelectedFile(null);
    setShowUploadModal(true);
  };

const handleUploadSubmit = async () => {
    if (!uploadNombre || !uploadCedula || !uploadTipoArchivo || !selectedFile || !uploadRefVendedor) {
      Alert.alert('Error', 'Todos los campos son obligatorios y debes seleccionar un archivo');
      return;
    }

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
        createdAt: serverTimestamp(),
      });

      // refresh list
      await loadDocumentos();

      setShowUploadModal(false);
      Alert.alert('Éxito', 'Documento subido correctamente');
    } catch (error) {
      console.error('Error al subir documento:', error);
      Alert.alert('Error', 'No se pudo subir el documento. Intenta nuevamente.');
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
              const docToDelete = documentos.find(d => d.id === id);
              if (docToDelete && (docToDelete as any).storagePath) {
                const sRef = storageRef(storage, (docToDelete as any).storagePath);
                await deleteObject(sRef);
              }
              await deleteDoc(doc(db, 'documentos', id));
              await loadDocumentos();
              Alert.alert('Éxito', 'Documento eliminado correctamente');
            } catch (error) {
              console.error('Error deleting documento:', error);
              Alert.alert('Error', 'No se pudo eliminar el documento');
            }
          },
        },
      ]
    );
  };

  const renderDocumento = ({ item }: { item: Documento }) => (
    <View style={styles.documentCard}>
      <View style={styles.iconContainer}>
        <FileText size={getResponsiveSize(32)} color={COLORS.primary} />
      </View>
      
      <View style={styles.documentInfo}>
        <Text style={styles.documentName}>{item.nombre}</Text>
        <Text style={styles.documentType}>{item.tipo_archivo.toUpperCase()}</Text>
        {(isAdmin || isVendedor) && (
          <Text style={styles.documentCedula}>Cédula: {item.cedula}</Text>
        )}
        {isAdmin && item.ref_vendedor && (
          <Text style={styles.documentCedula}>Ref. Vendedor: {item.ref_vendedor}</Text>
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
            onPress={() => Alert.alert('Editar', 'Funcionalidad próximamente')}
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
      {filteredDocumentos.length === 0 ? (
        <View style={styles.emptyContainer}>
          <FileText size={getResponsiveSize(64)} color={COLORS.textLight} />
          <Text style={styles.emptyText}>No hay documentos disponibles</Text>
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

              <TouchableOpacity style={styles.modalButton} onPress={handleUploadSubmit}>
                <Text style={styles.modalButtonText}>SUBIR DOCUMENTO</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
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
    backgroundColor: COLORS.primary,
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
    backgroundColor: COLORS.primary,
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
