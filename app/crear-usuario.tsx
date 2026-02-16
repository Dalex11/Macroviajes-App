import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
  ActivityIndicator,
  Modal,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { COLORS, SPACING } from '@/constants/theme';
import { requestNotificationPermissions, scheduleViajeNotifications } from '@/services/notifications';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Calendar, Search } from 'lucide-react-native';
import { db } from '@/config/firebase';
import { collection, addDoc, getDocs, query, where, updateDoc, doc } from 'firebase/firestore';
import { useAuth } from '@/contexts/AuthContext';
import { FirebaseUser } from '@/types/user';

export default function CrearUsuarioScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const isAdmin = user?.tipo === 'admin';
  const isVendedor = user?.tipo === 'vendedor';
  
  const [mode, setMode] = useState<'crear' | 'editar'>('crear');
  const [nombre, setNombre] = useState<string>('');
  const [apellido, setApellido] = useState<string>('');
  const [cedula, setCedula] = useState<string>('');
  const [fechaViaje, setFechaViaje] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
  const [searchCedula, setSearchCedula] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [userDocId, setUserDocId] = useState<string | null>(null);
  const [foundUser, setFoundUser] = useState<FirebaseUser | null>(null);

  useEffect(() => {
    requestNotificationPermissions();
  }, []);

  const validateDate = (date: Date): boolean => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selectedDate = new Date(date);
    selectedDate.setHours(0, 0, 0, 0);
    return selectedDate >= today;
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (selectedDate) {
      if (validateDate(selectedDate)) {
        setFechaViaje(selectedDate);
      } else {
        Alert.alert('Fecha Inválida', 'La fecha de viaje no puede ser anterior al día de hoy');
      }
    }
  };

  const handleConfirmDate = () => {
    setShowDatePicker(false);
  };

  const formatDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleBuscarUsuario = async () => {
    if (!searchCedula) {
      Alert.alert('Error', 'Ingresa una cédula para buscar');
      return;
    }

    setLoading(true);
    try {
      const q = query(
        collection(db, 'usuarios'),
        where('cedula', '==', searchCedula)
      );
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        Alert.alert('No encontrado', 'No se encontró ningún usuario con esa cédula');
        setFoundUser(null);
        setUserDocId(null);
        setNombre('');
        setApellido('');
        setCedula('');
        setFechaViaje(new Date());
      } else {
        const userDoc = querySnapshot.docs[0];
        const userData = userDoc.data() as FirebaseUser;
        setFoundUser(userData);
        setUserDocId(userDoc.id);
        setNombre(userData.nombre);
        setApellido(userData.apellido);
        setCedula(userData.cedula);
        setFechaViaje(new Date(userData.fecha_viaje));
        Alert.alert('Usuario encontrado', 'Ahora puedes modificar los campos permitidos');
      }
    } catch (error) {
      console.error('Error buscando usuario:', error);
      Alert.alert('Error', 'Ocurrió un error al buscar el usuario');
    } finally {
      setLoading(false);
    }
  };

  const handleCrearUsuario = async () => {
    if (!nombre || !apellido || !cedula) {
      Alert.alert('Error', 'Todos los campos son obligatorios');
      return;
    }

    if (!validateDate(fechaViaje)) {
      Alert.alert('Error', 'La fecha de viaje debe ser igual o posterior al día de hoy');
      return;
    }

    const username = apellido.toLowerCase().replace(/\s+/g, '');
    const password = cedula;
    const fechaFormateada = formatDate(fechaViaje);

    setLoading(true);
    try {
      const nuevoUsuario: FirebaseUser = {
        nombre,
        apellido,
        cedula,
        fecha_viaje: fechaFormateada,
        tipo: 'cliente',
        username,
        password,
      };

      await addDoc(collection(db, 'usuarios'), nuevoUsuario);
      
      try {
        await scheduleViajeNotifications(fechaFormateada, `${nombre} ${apellido}`);
      } catch (notifError) {
        console.error('Error scheduling notifications:', notifError);
      }
      
      Alert.alert(
        'Éxito',
        `Usuario creado correctamente.\n\nUsuario: ${username}\nContraseña: ${password}`,
        [
          { 
            text: 'OK', 
            onPress: () => {
              setNombre('');
              setApellido('');
              setCedula('');
              setFechaViaje(new Date());
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error creando usuario:', error);
      Alert.alert('Error', 'Ocurrió un error al crear el usuario');
    } finally {
      setLoading(false);
    }
  };

  const handleEditarUsuario = async () => {
    if (!userDocId) {
      Alert.alert('Error', 'No hay usuario seleccionado para editar');
      return;
    }

    if (!validateDate(fechaViaje)) {
      Alert.alert('Error', 'La fecha de viaje debe ser igual o posterior al día de hoy');
      return;
    }

    if (isAdmin && (!nombre || !apellido || !cedula)) {
      Alert.alert('Error', 'Todos los campos son obligatorios');
      return;
    }

    setLoading(true);
    try {
      const fechaFormateada = formatDate(fechaViaje);
      const userRef = doc(db, 'usuarios', userDocId);
      
      if (isAdmin) {
        const username = apellido.toLowerCase().replace(/\s+/g, '');
        const password = cedula;
        await updateDoc(userRef, {
          nombre,
          apellido,
          cedula,
          fecha_viaje: fechaFormateada,
          username,
          password,
        });
        Alert.alert('Éxito', 'Usuario actualizado correctamente');
      } else {
        await updateDoc(userRef, {
          fecha_viaje: fechaFormateada,
        });
        Alert.alert('Éxito', 'Fecha de viaje actualizada correctamente');
      }

      try {
        await scheduleViajeNotifications(fechaFormateada, `${nombre} ${apellido}`);
      } catch (notifError) {
        console.error('Error scheduling notifications:', notifError);
      }

      setFoundUser(null);
      setUserDocId(null);
      setSearchCedula('');
      setNombre('');
      setApellido('');
      setCedula('');
      setFechaViaje(new Date());
    } catch (error) {
      console.error('Error actualizando usuario:', error);
      Alert.alert('Error', 'Ocurrió un error al actualizar el usuario');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = () => {
    if (mode === 'crear') {
      handleCrearUsuario();
    } else {
      handleEditarUsuario();
    }
  };

  const canEditField = (field: 'nombre' | 'apellido' | 'cedula') => {
    if (mode === 'crear') return true;
    if (isAdmin) return true;
    return false;
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{isVendedor ? 'Gestión de Usuarios' : 'Crear Usuario Cliente'}</Text>

      <View style={styles.modeSelector}>
        <TouchableOpacity
          style={[styles.modeButton, mode === 'crear' && styles.modeButtonActive]}
          onPress={() => {
            setMode('crear');
            setFoundUser(null);
            setUserDocId(null);
            setSearchCedula('');
            setNombre('');
            setApellido('');
            setCedula('');
            setFechaViaje(new Date());
            setShowDatePicker(false);
          }}
        >
          <Text style={[styles.modeButtonText, mode === 'crear' && styles.modeButtonTextActive]}>
            Crear Usuario
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.modeButton, mode === 'editar' && styles.modeButtonActive]}
          onPress={() => {
            setMode('editar');
            setNombre('');
            setApellido('');
            setCedula('');
            setFechaViaje(new Date());
            setFoundUser(null);
            setUserDocId(null);
            setShowDatePicker(false);
          }}
        >
          <Text style={[styles.modeButtonText, mode === 'editar' && styles.modeButtonTextActive]}>
            Editar Usuario
          </Text>
        </TouchableOpacity>
      </View>

      {mode === 'editar' && (
        <View style={styles.searchContainer}>
          <Text style={styles.label}>Buscar por Cédula</Text>
          <View style={styles.searchRow}>
            <TextInput
              style={styles.searchInput}
              placeholder="Ingresa la cédula"
              value={searchCedula}
              onChangeText={setSearchCedula}
              keyboardType="numeric"
            />
            <TouchableOpacity 
              style={styles.searchButton} 
              onPress={handleBuscarUsuario}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color={COLORS.white} />
              ) : (
                <Search size={20} color={COLORS.white} />
              )}
            </TouchableOpacity>
          </View>
          {foundUser && (
            <View style={styles.foundUserBox}>
              <Text style={styles.foundUserText}>
                Usuario encontrado: {foundUser.nombre} {foundUser.apellido}
              </Text>
            </View>
          )}
        </View>
      )}

      {(mode === 'crear' || (mode === 'editar' && foundUser)) && (
        <>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Nombre</Text>
            <TextInput
              style={[styles.input, !canEditField('nombre') && styles.inputDisabled]}
              placeholder="Ingresa el nombre"
              value={nombre}
              onChangeText={setNombre}
              editable={canEditField('nombre')}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Apellido</Text>
            <TextInput
              style={[styles.input, !canEditField('apellido') && styles.inputDisabled]}
              placeholder="Ingresa el apellido"
              value={apellido}
              onChangeText={setApellido}
              editable={canEditField('apellido')}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Cédula</Text>
            <TextInput
              style={[styles.input, !canEditField('cedula') && styles.inputDisabled]}
              placeholder="Ingresa la cédula"
              value={cedula}
              onChangeText={setCedula}
              keyboardType="numeric"
              editable={canEditField('cedula')}
            />
          </View>
        </>
      )}

      {(mode === 'crear' || (mode === 'editar' && foundUser)) && (
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Fecha de Viaje</Text>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowDatePicker(true)}
          >
            <Calendar size={20} color={COLORS.primary} />
            <Text style={styles.dateButtonText}>{formatDate(fechaViaje)}</Text>
          </TouchableOpacity>
        </View>
      )}

      {Platform.OS === 'ios' ? (
        <Modal
          visible={showDatePicker}
          transparent
          animationType="slide"
          onRequestClose={() => setShowDatePicker(false)}
        >
          <Pressable 
            style={styles.modalOverlay}
            onPress={() => setShowDatePicker(false)}
          >
            <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Selecciona la Fecha de Viaje</Text>
              </View>
              <DateTimePicker
                value={fechaViaje}
                mode="date"
                display="spinner"
                onChange={handleDateChange}
                minimumDate={new Date()}
                style={styles.datePicker}
                textColor={COLORS.text}
              />
              <TouchableOpacity 
                style={styles.confirmButton}
                onPress={handleConfirmDate}
              >
                <Text style={styles.confirmButtonText}>Confirmar</Text>
              </TouchableOpacity>
            </Pressable>
          </Pressable>
        </Modal>
      ) : (
        showDatePicker && (
          <DateTimePicker
            value={fechaViaje}
            mode="date"
            display="default"
            onChange={handleDateChange}
            minimumDate={new Date()}
          />
        )
      )}

      {mode === 'crear' && (
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>El usuario será el apellido y la contraseña será la cédula</Text>
        </View>
      )}

      {mode === 'editar' && foundUser && !isAdmin && (
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>Como vendedor, solo puedes modificar la fecha de viaje</Text>
        </View>
      )}

      {(mode === 'crear' || (mode === 'editar' && foundUser)) && (
        <TouchableOpacity 
          style={styles.button} 
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color={COLORS.white} />
          ) : (
            <Text style={styles.buttonText}>
              {mode === 'crear' ? 'CREAR USUARIO' : 'ACTUALIZAR USUARIO'}
            </Text>
          )}
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: SPACING.lg,
  },
  title: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: COLORS.text,
    marginBottom: SPACING.xl,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: SPACING.lg,
  },
  label: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  input: {
    backgroundColor: COLORS.white,
    borderRadius: 8,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    fontSize: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  dateButton: {
    backgroundColor: COLORS.white,
    borderRadius: 8,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  dateButtonText: {
    fontSize: 16,
    color: COLORS.text,
  },
  button: {
    backgroundColor: COLORS.secondary,
    borderRadius: 12,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    marginTop: SPACING.lg,
  },
  buttonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '700' as const,
  },
  infoBox: {
    backgroundColor: `${COLORS.primary}15`,
    borderRadius: 8,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
  },
  infoText: {
    fontSize: 14,
    color: COLORS.primary,
    textAlign: 'center',
    fontWeight: '600' as const,
  },
  modeSelector: {
    flexDirection: 'row',
    marginBottom: SPACING.xl,
    borderRadius: 8,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  modeButton: {
    flex: 1,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    backgroundColor: COLORS.white,
  },
  modeButtonActive: {
    backgroundColor: COLORS.primary,
  },
  modeButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: COLORS.text,
  },
  modeButtonTextActive: {
    color: COLORS.white,
  },
  searchContainer: {
    marginBottom: SPACING.lg,
  },
  searchRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  searchInput: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 8,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    fontSize: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingHorizontal: SPACING.lg,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 50,
  },
  foundUserBox: {
    backgroundColor: `${COLORS.success}15`,
    borderRadius: 8,
    padding: SPACING.md,
    marginTop: SPACING.sm,
  },
  foundUserText: {
    fontSize: 14,
    color: COLORS.success,
    fontWeight: '600' as const,
  },
  inputDisabled: {
    backgroundColor: '#f5f5f5',
    color: '#999',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 40,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
  },
  modalHeader: {
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: COLORS.text,
    textAlign: 'center',
  },
  datePicker: {
    height: 200,
    marginVertical: SPACING.md,
  },
  confirmButton: {
    backgroundColor: COLORS.primary,
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.md,
    borderRadius: 12,
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '700' as const,
  },
});
