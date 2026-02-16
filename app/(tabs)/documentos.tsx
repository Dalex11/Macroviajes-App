import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
  Platform,
  Dimensions,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { FileText, Download, Plus, Trash2, Edit, X, Upload } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { COLORS, SPACING } from '@/constants/theme';
import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

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
}

interface Usuario {
  cedula: string;
  nombre: string;
  tipo: string;
}

const MOCK_USUARIOS: Usuario[] = [
  { cedula: '987654321', nombre: 'María Vendedora', tipo: 'vendedor' },
  { cedula: '555666777', nombre: 'Carlos Vendedor', tipo: 'vendedor' },
  { cedula: '111222333', nombre: 'Ana Vendedora', tipo: 'vendedor' },
];

const MOCK_CLIENTES: Usuario[] = [
  { cedula: '123456789', nombre: 'Juan Pérez', tipo: 'cliente' },
  { cedula: '222333444', nombre: 'María García', tipo: 'cliente' },
  { cedula: '333444555', nombre: 'Pedro López', tipo: 'cliente' },
];

const MOCK_DOCUMENTOS: Documento[] = [
  {
    id: '1',
    nombre: 'Pasaporte Juan Pérez',
    tipo_archivo: 'pasaporte',
    cedula: '123456789',
    ref_vendedor: '987654321',
    url: 'https://example.com/doc1.pdf',
  },
  {
    id: '2',
    nombre: 'Tiquete de Ida - Miami',
    tipo_archivo: 'tiquete ida',
    cedula: '123456789',
    ref_vendedor: '987654321',
    url: 'https://example.com/doc2.pdf',
  },
];

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
  
  const [documentos, setDocumentos] = useState<Documento[]>(MOCK_DOCUMENTOS);
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
  const [vendedores] = useState<Usuario[]>(MOCK_USUARIOS);
  const [clientes] = useState<Usuario[]>(MOCK_CLIENTES);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);

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

  const handleUploadSubmit = () => {
    if (!uploadNombre || !uploadCedula || !uploadTipoArchivo || !selectedFile || !uploadRefVendedor) {
      Alert.alert('Error', 'Todos los campos son obligatorios y debes seleccionar un archivo');
      return;
    }

    const newDoc: Documento = {
      id: Date.now().toString(),
      nombre: uploadNombre,
      cedula: uploadCedula,
      tipo_archivo: uploadTipoArchivo as any,
      ref_vendedor: uploadRefVendedor,
      url: selectedFile.uri,
    };

    setDocumentos(prev => [...prev, newDoc]);
    setShowUploadModal(false);
    Alert.alert('Éxito', 'Documento agregado correctamente (Firebase próximamente)');
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
          onPress: () => {
            setDocumentos(prev => prev.filter(d => d.id !== id));
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
