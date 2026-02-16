export const requestNotificationPermissions = async (): Promise<boolean> => {
  console.log('Notifications disabled in Expo Go (SDK 53+). Use development build for notifications.');
  return true;
};

export const scheduleViajeNotifications = async (
  fechaViaje: string,
  nombre: string
): Promise<void> => {
  console.log('Notifications disabled in Expo Go (SDK 53+). Use development build for notifications.');
};

export const cancelAllNotifications = async (): Promise<void> => {
  console.log('Notifications disabled in Expo Go (SDK 53+). Use development build for notifications.');
};
