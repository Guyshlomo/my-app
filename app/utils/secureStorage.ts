import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  REMEMBER_ME: 'remember_me',
  USER_EMAIL: 'user_email',
  USER_PASSWORD: 'user_password', // Note: In production, consider using Keychain/Keystore
  USER_TYPE: 'user_type', // 'user' or 'admin'
} as const;

export interface StoredCredentials {
  email: string;
  password: string;
  userType: 'user' | 'admin';
}

/**
 * Save user credentials securely
 */
export const saveCredentials = async (credentials: StoredCredentials): Promise<void> => {
  try {
    await AsyncStorage.multiSet([
      [STORAGE_KEYS.REMEMBER_ME, 'true'],
      [STORAGE_KEYS.USER_EMAIL, credentials.email],
      [STORAGE_KEYS.USER_PASSWORD, credentials.password],
      [STORAGE_KEYS.USER_TYPE, credentials.userType],
    ]);
    console.log('✅ [SecureStorage] Credentials saved successfully');
  } catch (error) {
    console.error('❌ [SecureStorage] Failed to save credentials:', error);
    throw error;
  }
};

/**
 * Get stored credentials
 */
export const getStoredCredentials = async (): Promise<StoredCredentials | null> => {
  try {
    const values = await AsyncStorage.multiGet([
      STORAGE_KEYS.REMEMBER_ME,
      STORAGE_KEYS.USER_EMAIL,
      STORAGE_KEYS.USER_PASSWORD,
      STORAGE_KEYS.USER_TYPE,
    ]);

    const [rememberMe, email, password, userType] = values.map(([, value]) => value);

    if (rememberMe === 'true' && email && password) {
      console.log('✅ [SecureStorage] Credentials found');
      return {
        email,
        password,
        userType: (userType as 'user' | 'admin') || 'user',
      };
    }

    console.log('ℹ️ [SecureStorage] No stored credentials found');
    return null;
  } catch (error) {
    console.error('❌ [SecureStorage] Failed to get credentials:', error);
    return null;
  }
};

/**
 * Check if remember me is enabled
 */
export const isRememberMeEnabled = async (): Promise<boolean> => {
  try {
    const rememberMe = await AsyncStorage.getItem(STORAGE_KEYS.REMEMBER_ME);
    return rememberMe === 'true';
  } catch (error) {
    console.error('❌ [SecureStorage] Failed to check remember me status:', error);
    return false;
  }
};

/**
 * Clear stored credentials
 */
export const clearCredentials = async (): Promise<void> => {
  try {
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.REMEMBER_ME,
      STORAGE_KEYS.USER_EMAIL,
      STORAGE_KEYS.USER_PASSWORD,
      STORAGE_KEYS.USER_TYPE,
    ]);
    console.log('✅ [SecureStorage] Credentials cleared successfully');
  } catch (error) {
    console.error('❌ [SecureStorage] Failed to clear credentials:', error);
    throw error;
  }
};

/**
 * Update remember me preference only
 */
export const setRememberMePreference = async (enabled: boolean): Promise<void> => {
  try {
    if (enabled) {
      await AsyncStorage.setItem(STORAGE_KEYS.REMEMBER_ME, 'true');
    } else {
      await clearCredentials();
    }
    console.log(`✅ [SecureStorage] Remember me preference set to: ${enabled}`);
  } catch (error) {
    console.error('❌ [SecureStorage] Failed to set remember me preference:', error);
    throw error;
  }
}; 