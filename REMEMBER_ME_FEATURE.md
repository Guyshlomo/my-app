# Remember Me Feature Documentation

## Overview
The Remember Me feature allows users to save their login credentials securely on their device for automatic login on subsequent app launches.

## Features Implemented

### 1. Login Screen Enhancement
- **Remember Me Checkbox**: Users can check this option during login to save their credentials
- **Auto-login**: When the app starts, it automatically attempts to log in using stored credentials
- **Visual Feedback**: Shows "מתחבר..." (Connecting...) during auto-login process
- **Error Handling**: Clears stored credentials if auto-login fails

### 2. Secure Storage
- **AsyncStorage Integration**: Uses `@react-native-async-storage/async-storage` for secure storage
- **Credential Management**: Stores email, password, and user type (user/admin)
- **Security Note**: In production, consider using React Native Keychain for enhanced security

### 3. Settings Screen Integration
- **Toggle Switch**: Users can enable/disable Remember Me from the settings
- **Real-time Feedback**: Shows confirmation alerts when toggling the feature
- **Credential Cleanup**: Automatically clears stored credentials when disabled

### 4. Authentication Hook Enhancement
- **Logout Cleanup**: Automatically clears stored credentials when user logs out
- **Session Management**: Integrates with existing Supabase authentication flow

## File Structure

```
app/
├── screens/
│   ├── LoginScreen.tsx          # Enhanced with Remember Me checkbox and auto-login
│   └── SettingsScreen.tsx       # Added Remember Me toggle switch
├── utils/
│   └── secureStorage.ts         # New utility for credential management
└── hooks/
    └── useSupabaseAuth.ts       # Enhanced to clear credentials on logout
```

## API Reference

### secureStorage.ts

#### `saveCredentials(credentials: StoredCredentials): Promise<void>`
Saves user credentials securely to AsyncStorage.

#### `getStoredCredentials(): Promise<StoredCredentials | null>`
Retrieves stored credentials from AsyncStorage.

#### `isRememberMeEnabled(): Promise<boolean>`
Checks if Remember Me feature is enabled.

#### `clearCredentials(): Promise<void>`
Removes all stored credentials from AsyncStorage.

#### `setRememberMePreference(enabled: boolean): Promise<void>`
Updates the Remember Me preference.

### StoredCredentials Interface
```typescript
interface StoredCredentials {
  email: string;
  password: string;
  userType: 'user' | 'admin';
}
```

## User Experience Flow

### First-time Login
1. User enters email and password
2. User checks "זכור אותי" (Remember Me) checkbox
3. User clicks "התחברות לחשבון" (Login)
4. Credentials are saved securely after successful login

### Subsequent App Launches
1. App starts and checks for stored credentials
2. If credentials exist, auto-login begins
3. User sees "מתחבר..." (Connecting...) message
4. On success, user is taken directly to Home screen
5. On failure, credentials are cleared and user sees login form

### Settings Management
1. User opens settings drawer
2. User sees "זכור אותי" toggle with subtitle "שמור פרטי התחברות למכשיר"
3. User can enable/disable the feature
4. Confirmation alerts provide feedback

### Manual Logout
1. User clicks logout in settings
2. Stored credentials are automatically cleared
3. User is redirected to login screen

## Security Considerations

1. **Password Storage**: Currently stored in AsyncStorage (plain text)
   - **Recommendation**: Implement React Native Keychain for production
   - **Alternative**: Use crypto libraries to encrypt stored passwords

2. **Session Management**: Integrates with Supabase Auth tokens
   - Stored credentials are only used for initial authentication
   - Actual session management relies on Supabase tokens

3. **Auto-cleanup**: Credentials are cleared on:
   - Manual logout
   - Failed auto-login attempts
   - User disabling the feature

## Testing

The feature has been tested for:
- ✅ Successful credential storage and retrieval
- ✅ Auto-login functionality
- ✅ Error handling and cleanup
- ✅ Settings integration
- ✅ Logout cleanup
- ✅ iPad responsive design compatibility

## Future Enhancements

1. **Enhanced Security**: Implement React Native Keychain
2. **Biometric Authentication**: Add fingerprint/face ID for stored credentials
3. **Multiple Accounts**: Support storing multiple user credentials
4. **Expiration**: Add credential expiration dates
5. **Audit Trail**: Log authentication attempts for security monitoring 