# Supabase Integration Setup Guide

זה המדריך להגדרת Supabase client ב-React Native Expo App שלך.

## 🚀 התקנה

החבילות הנדרשות כבר הותקנו:
- `@supabase/supabase-js`
- `react-native-url-polyfill`

## ⚙️ הגדרה

### 1. עדכן את הקונפיגורציה ב-environment.ts

ערוך את הקובץ `app/config/environment.ts` והחלף את הפרטים הבאים:

```typescript
export const ENV = {
  // Supabase Configuration
  SUPABASE_URL: __DEV__
    ? 'https://your-project-id.supabase.co'  // החלף עם URL של הפרויקט שלך
    : 'https://your-project-id.supabase.co',
    
  SUPABASE_ANON_KEY: __DEV__
    ? 'your-anon-key-here'  // החלף עם anon key של הפרויקט שלך
    : 'your-anon-key-here',
  
  // Use direct Supabase connection instead of API server
  USE_SUPABASE_DIRECT: true, // Set to true to use direct Supabase connection
};
```

### 2. מבנה הטבלה ב-Supabase

וודא שיש לך טבלת `users` עם השדות הבאים:

```sql
CREATE TABLE users (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  firstname TEXT,
  lastname TEXT,
  coins INTEGER DEFAULT 0,
  taskcompleted INTEGER DEFAULT 0,
  isadmin BOOLEAN DEFAULT FALSE,
  profileimage TEXT,
  settlement TEXT,
  birthdate TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS (Row Level Security)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Enable insert for authenticated users only" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Policy for admin users to view all users
CREATE POLICY "Admin can view all users" ON users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND isadmin = TRUE
    )
  );
```

## 🔌 שימוש ב-Application

### אופציה 1: שימוש ב-Hook (מומלץ)

```typescript
import { useSupabaseAuth } from '../hooks/useSupabaseAuth';

function MyComponent() {
  const { user, loading, signIn, signOut, refreshUser } = useSupabaseAuth();

  const handleLogin = async () => {
    try {
      await signIn('user@example.com', 'password');
      console.log('התחברות בוצעה בהצלחה!');
    } catch (error) {
      console.error('שגיאה בהתחברות:', error);
    }
  };

  if (loading) return <Text>טוען...</Text>;

  return (
    <View>
      {user ? (
        <View>
          <Text>שלום {user.firstName}!</Text>
          {user.isAdmin && <Text>אתה מנהל!</Text>}
          <Button title="התנתק" onPress={signOut} />
        </View>
      ) : (
        <Button title="התחבר" onPress={handleLogin} />
      )}
    </View>
  );
}
```

### אופציה 2: שימוש ב-API Functions ישירות

```typescript
import { 
  loginWithSupabase, 
  getCurrentUserFromSupabase,
  signupWithSupabase 
} from '../db/supabaseApi';

// התחברות
const user = await loginWithSupabase({ 
  email: 'user@example.com', 
  password: 'password' 
});

// קבלת המשתמש הנוכחי
const currentUser = await getCurrentUserFromSupabase();

// הרשמה
await signupWithSupabase({
  email: 'new@example.com',
  password: 'password',
  firstName: 'שם',
  lastName: 'משפחה'
});
```

## 🔧 שימוש בHomeScreen

עדכן את ה-HomeScreen שלך להשתמש ב-Supabase:

```typescript
import { useSupabaseAuth } from '../hooks/useSupabaseAuth';
import { ENV } from '../config/environment';

export default function HomeScreen() {
  const { user, loading, refreshUser } = useSupabaseAuth();

  useEffect(() => {
    if (ENV.USE_SUPABASE_DIRECT && user) {
      console.log('✅ [HomeScreen] Supabase user loaded:', {
        name: user.firstName,
        isAdmin: user.isAdmin
      });
    }
  }, [user]);

  const renderAdminInterface = () => {
    if (!user?.isAdmin) return null;
    return (
      <View>
        <Text>ממשק ניהול</Text>
        {/* Admin interface components */}
      </View>
    );
  };

  if (loading) {
    return <Text>טוען...</Text>;
  }

  return (
    <View>
      <Text>שלום {user?.firstName}!</Text>
      {renderAdminInterface()}
    </View>
  );
}
```

## 🔄 מעבר מ-API Server ל-Supabase Direct

אם אתה רוצה לעבור מהשרת API (localhost:3000) לחיבור ישיר ל-Supabase:

1. **הגדר את הקונפיגורציה**: עדכן את `environment.ts` עם פרטי Supabase
2. **שנה את הקומפוננטים**: השתמש ב-`useSupabaseAuth` hook במקום API calls
3. **בדוק את הטבלאות**: וודא שמבנה הטבלה תואם למה שהקוד מצפה

## 🐛 Debugging

אם יש בעיות, בדוק:

1. **Console logs**: כל הפונקציות מדפיסות logs מפורטים
2. **Network tab**: בדוק requests ל-Supabase
3. **Supabase Dashboard**: בדוק את הטבלאות והמדיניות
4. **Environment configuration**: וודא שה-URL וה-key נכונים

## 🔐 אבטחה

- משתמש ב-Row Level Security (RLS)
- מנהלים יכולים לראות את כל המשתמשים
- משתמשים רגילים יכולים לראות ולעדכן רק את הפרופיל שלהם
- Anon key בטוח לשימוש ב-frontend (לא חושף מידע רגיש)

---

**הערה**: זה הקוד מוכן לשימוש! פשוט עדכן את פרטי Supabase ב-environment.ts ותוכל להתחיל להשתמש בו מיד! ✨ 