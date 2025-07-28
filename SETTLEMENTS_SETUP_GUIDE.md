# מדריך יצירת טבלת הישובים ב-Supabase

## שלב 1: כניסה ל-Supabase Dashboard

1. היכנס ל-[Supabase Dashboard](https://supabase.com/dashboard)
2. בחר את הפרויקט שלך: `oomibleqeelsswfbkjou`
3. עבור לטאב **SQL Editor**

## שלב 2: יצירת טבלת הישובים

העתק והדבק את הקוד הבא ב-SQL Editor:

```sql
-- יצירת טבלת ישובים
CREATE TABLE IF NOT EXISTS settlements (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- הכנסת ישובים קיימים
INSERT INTO settlements (name) VALUES 
('ניר-עם'),
('כפר עזה'),
('ארז'),
('יכיני'),
('אור-הנר'),
('נחל עוז'),
('ברור-חיל'),
('גבים'),
('דורות'),
('מפלסים'),
('רוחמה')
ON CONFLICT (name) DO NOTHING;
```

## שלב 3: הרצת הקוד

1. לחץ על כפתור **Run** או **Ctrl+Enter**
2. ודא שהקוד רץ בהצלחה ללא שגיאות

## שלב 4: בדיקת הטבלה

לאחר יצירת הטבלה, תוכל לבדוק אותה על ידי הרצת:

```sql
SELECT * FROM settlements ORDER BY name;
```

## שלב 5: עדכון האפליקציה

האפליקציה מעודכנת לקרוא את הישובים מה-Supabase רק בדף האדמינים:

### דף ההרשמה (SignupScreen.tsx)
- ✅ משתמש בישובים קשיחים (לא קורא מה-Supabase)
- ✅ רשימת הישובים קבועה ופשוטה

### דף יצירת התנדבויות (AdminUsersScreen.tsx)
- ✅ קורא ישובים מה-Supabase באמצעות `getAllSettlements()`
- ✅ כולל אפשרות "כללי" בנוסף לישובים
- ✅ יש fallback לישובים קשיחים אם Supabase לא זמין

## פונקציות API שנוספו

בקובץ `app/db/supabaseApi.ts` נוספו הפונקציות הבאות:

```typescript
// קבלת כל הישובים
export async function getAllSettlements()

// הוספת ישוב חדש
export async function addSettlement(name: string)

// מחיקת ישוב
export async function deleteSettlement(id: number)
```

## בדיקת הפעולה

לאחר יצירת הטבלה, תוכל לבדוק שהכל עובד:

1. הרץ את האפליקציה
2. עבור לדף ההרשמה - הישובים קבועים (לא משתנים)
3. עבור לדף האדמינים - הישובים אמורים להיטען מה-Supabase + אפשרות "כללי"

## הוספת ישובים חדשים

כדי להוסיף ישובים חדשים, תוכל להשתמש ב-SQL Editor:

```sql
INSERT INTO settlements (name) VALUES ('שם הישוב החדש') ON CONFLICT (name) DO NOTHING;
```

או להשתמש בפונקציה `addSettlement()` מהאפליקציה. 