# Forgot Password Feature Documentation

## Overview
The Forgot Password feature allows users to reset their password by receiving a password reset email through Supabase Auth.

## Features Implemented

### 1. Password Reset API Function
- **resetPasswordWithSupabase**: Sends password reset email using Supabase Auth
- **Deep Link Support**: Configured with `voluntree://reset-password` redirect
- **Error Handling**: Comprehensive error messages for different scenarios

### 2. Forgot Password Modal Component
- **Responsive Design**: Works on both iPhone and iPad
- **Email Validation**: Basic email format validation
- **Loading States**: Shows loading indicator during email sending
- **User Feedback**: Success and error alerts with Hebrew text

### 3. Login Screen Integration
- **Forgot Password Link**: Added "שכחת סיסמה?" link below login form
- **Modal Integration**: Opens forgot password modal when clicked
- **Disabled During Auto-login**: Link is disabled during auto-login process

## File Structure

```
app/
├── components/
│   └── ForgotPasswordModal.tsx    # New modal component for password reset
├── screens/
│   └── LoginScreen.tsx            # Enhanced with forgot password link
└── db/
    └── supabaseApi.ts             # Added resetPasswordWithSupabase function
```

## API Reference

### resetPasswordWithSupabase(email: string): Promise<boolean>
Sends a password reset email to the specified email address.

**Parameters:**
- `email`: The user's email address

**Returns:**
- `Promise<boolean>`: True if email was sent successfully

**Throws:**
- Various Supabase Auth errors (invalid email, user not found, rate limit, etc.)

### ForgotPasswordModal Props
```typescript
interface ForgotPasswordModalProps {
  visible: boolean;
  onClose: () => void;
}
```

## User Experience Flow

### 1. Access Forgot Password
1. User opens the app and sees the login screen
2. User clicks "שכחת סיסמה?" link below the password field
3. Forgot password modal opens

### 2. Request Password Reset
1. User enters their email address
2. User clicks "שלח קישור לאיפוס" (Send Reset Link)
3. System validates email format
4. System sends password reset email via Supabase
5. User sees success message: "נשלח לך קישור לאיפוס סיסמה לכתובת האימייל שלך"

### 3. Complete Password Reset
1. User checks their email (including spam folder)
2. User clicks the reset link in the email
3. User is redirected to Supabase's password reset page
4. User enters new password and confirms
5. User returns to the app and logs in with new password

## Error Handling

The system provides specific error messages for different scenarios:

- **Invalid Email Format**: "נא להזין כתובת אימייל תקינה"
- **Empty Email**: "נא להזין כתובת אימייל"
- **User Not Found**: "לא נמצא משתמש עם כתובת אימייל זו"
- **Rate Limit Exceeded**: "נשלחו יותר מדי אימיילים. אנא נסה שוב מאוחר יותר"
- **General Error**: "אירעה שגיאה בשליחת אימייל איפוס הסיסמה"

## Security Features

### 1. Email Validation
- Basic format validation using regex
- Trimming whitespace to prevent errors

### 2. Rate Limiting
- Supabase automatically handles rate limiting
- Prevents spam and abuse

### 3. Secure Reset Links
- Uses Supabase's built-in secure token system
- Links expire after a set time period
- Deep link integration for mobile app

## Responsive Design

### iPhone
- Modal takes 90% of screen width
- Standard font sizes and padding
- Optimized for single-handed use

### iPad
- Modal has maximum width of 500px
- Larger font sizes (1.2x multiplier)
- Increased padding for better touch targets

## Integration with Existing Features

### 1. Remember Me Feature
- Forgot password works independently
- Doesn't affect stored credentials
- Users can still use remember me after password reset

### 2. Auto-login
- Forgot password link is disabled during auto-login
- Prevents interference with automatic login process

### 3. Existing UI/UX
- Maintains consistent design language
- Uses same color scheme and typography
- Follows Hebrew RTL text direction

## Technical Implementation

### 1. Supabase Configuration
```typescript
const { error } = await supabase.auth.resetPasswordForEmail(email, {
  redirectTo: 'voluntree://reset-password',
});
```

### 2. Modal State Management
```typescript
const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
```

### 3. Error Handling Pattern
```typescript
try {
  await resetPasswordWithSupabase(email.trim());
  // Success handling
} catch (error: any) {
  // Specific error message mapping
  let errorMessage = 'אירעה שגיאה בשליחת אימייל איפוס הסיסמה';
  if (error.message?.includes('Invalid email')) {
    errorMessage = 'כתובת האימייל לא תקינה';
  }
  // Show error alert
}
```

## Testing Checklist

- ✅ Modal opens when "שכחת סיסמה?" is clicked
- ✅ Email validation works correctly
- ✅ Success message appears after email is sent
- ✅ Error messages display for various scenarios
- ✅ Loading state shows during email sending
- ✅ Modal closes properly after success
- ✅ Responsive design works on iPad
- ✅ Link is disabled during auto-login
- ✅ Integration with existing login flow

## Future Enhancements

1. **Custom Reset Page**: Create a custom password reset page instead of using Supabase's default
2. **Biometric Reset**: Allow password reset using biometric authentication
3. **SMS Reset**: Add SMS-based password reset option
4. **Reset History**: Track password reset attempts for security
5. **Multi-language Support**: Add support for multiple languages
6. **Offline Support**: Handle password reset requests when offline

## Troubleshooting

### Common Issues

1. **Email Not Received**
   - Check spam/junk folder
   - Verify email address is correct
   - Check if Supabase email settings are configured

2. **Reset Link Not Working**
   - Ensure deep link is properly configured
   - Check if link has expired
   - Verify Supabase redirect URL settings

3. **Rate Limit Errors**
   - Wait before trying again
   - Check Supabase rate limit settings
   - Consider implementing client-side rate limiting

### Configuration Requirements

1. **Supabase Email Settings**
   - Configure SMTP settings in Supabase dashboard
   - Set up email templates
   - Configure redirect URLs

2. **Deep Link Configuration**
   - Ensure `voluntree://reset-password` is registered
   - Test deep link functionality
   - Handle deep link in app navigation 