export interface User {
  id: string;
  username: string;
  tipo: 'admin' | 'cliente' | 'vendedor';
  nombre?: string;
  apellido?: string;
  cedula?: string;
  fecha_viaje?: string;
}

export interface FirebaseUser {
  nombre: string;
  apellido: string;
  cedula: string;
  pasaporte: string;
  fecha_viaje: string;
  tipo: 'admin' | 'cliente' | 'vendedor';
  username: string;
  password: string;
  celular: string;
  correo: string;
  referencia: string;
  createdBy: string;
}
