# 🔔 מדריך מערכת התראות Push

## 📋 **סקירה כללית**

המערכת מוכנה לשלוח התראות push למשתמשים ברגע שנוצר אירוע התנדבות חדש, מסונן לפי ישובים.

## ✅ **מה הושלם**

### **1. מערכת Push Notifications**
- ✅ קובץ `app/utils/pushNotifications.ts` - מערכת התראות מלאה
- ✅ רישום אוטומטי להתראות בעת התחברות למשתמש
- ✅ שליחת התראות מסוננות לפי ישוב
- ✅ תמיכה ב-iOS ו-Android

### **2. אינטגרציה עם יצירת אירועים**
- ✅ עדכון `createVolunteerEvent` לשלוח התראות
- ✅ פילטור אוטומטי לפי `location` של האירוע
- ✅ שליחה רק למשתמשים באותו ישוב

### **3. הגדרות האפליקציה**
- ✅ הוספת plugin `expo-notifications` ל-`app.json`
- ✅ הגדרות iOS `UIBackgroundModes`
- ✅ EAS Project ID מוגדר נכון

### **4. מסד נתונים**
- ✅ טבלת `notification_tokens` מוכנה
- ✅ פילטור משתמשים לפי ישובים פועל
- ✅ קישור לטבלת `users`

## 🚀 **איך לבדוק את המערכת**

### **שלב 1: הכנת המערכת**
```bash
# בדיקת המערכת
node test-push-notifications.js
```

### **שלב 2: רישום משתמשים להתראות**
1. **התחבר לאפליקציה** - כל התחברות רושמת אוטומטית להתראות
2. **בדוק בלוגים**:
   ```
   🔔 [LoginScreen] Registering for push notifications...
   ✅ [LoginScreen] Push notification registration successful
   ```

### **שלב 3: יצירת אירוע והתראה**
1. **התחבר כאדמין** (משתמש עם `isadmin = true`)
2. **צור אירוע התנדבות חדש**
3. **בדוק בלוגים**:
   ```
   📢 [Supabase] Sending push notifications for new event...
   ✅ [Supabase] Push notifications sent successfully
   ```

## 📊 **מצב נוכחי במסד הנתונים**

### **משתמשים לפי ישובים:**
- **ניר-עם**: 14 משתמשים (4 אדמינים, 10 משתמשים רגילים)
- **כפר עזה**: 1 משתמש
- **גבים**: 1 משתמש  
- **יכיני**: 1 משתמש

### **אירועים פעילים:**
- "עזרה בתפעול אירוע לצעירי ניר-עם" בניר-עם

## 🔧 **איך המערכת עובדת**

### **1. רישום להתראות (בהתחברות)**
```typescript
// LoginScreen.tsx
const pushToken = await registerForPushNotifications(user.id);
// שומר את הטוקן בטבלת notification_tokens
```

### **2. יצירת אירוע ושליחת התראות**
```typescript
// supabaseApi.ts - createVolunteerEvent
await sendNewEventNotification(eventData, eventLocation);
// שולח התראות לכל המשתמשים באותו ישוב
```

### **3. פילטור לפי ישובים**
```sql
-- שליפת משתמשים באותו ישוב
SELECT * FROM users 
WHERE settlement = 'ניר-עם' 
AND isadmin = false
```

## 🎯 **תרחיש בדיקה מלא**

### **הכנה:**
1. **התחבר כמשתמש רגיל** מישוב "ניר-עם"
2. **וודא שהתקבלה הודעה**: "Push notification registration successful"

### **יצירת אירוע:**
1. **התחבר כאדמין** מישוב "ניר-עם" 
2. **צור אירוע חדש** עם `location = "ניר-עם"`
3. **בדוק בלוגים** שההתראות נשלחו

### **תוצאה צפויה:**
- המשתמש הרגיל יקבל התראה push
- משתמשים מישובים אחרים לא יקבלו התראה

## 🐛 **פתרון בעיות**

### **אין התראות?**
1. **בדוק שהמשתמש רשום**:
   ```bash
   node test-push-notifications.js
   ```
2. **בדוק הרשאות** במכשיר
3. **בדוק שהאירוע נוצר** באותו ישוב

### **התראות לא מגיעות למכשיר?**
1. **Expo Go לא תומך** ב-push notifications בSDK 53+
2. **צריך development build**:
   ```bash
   eas build --profile development --platform android
   ```

### **שגיאות במסד נתונים?**
1. **בדוק טבלת notification_tokens**
2. **בדוק foreign keys**
3. **בדוק RLS policies**

## 📱 **בדיקה במכשיר אמיתי**

### **Android Development Build:**
```bash
# בניית APK לבדיקה
eas build --profile development --platform android

# התקנה
# הורד את ה-APK מהקישור שיתקבל
# התקן במכשיר Android
```

### **iOS Development Build:**
```bash
# בניית IPA לבדיקה  
eas build --profile development --platform ios

# התקנה דרך TestFlight או Xcode
```

## 🎉 **המערכת מוכנה!**

כל הקוד מוכן ופועל. צריך רק:
1. **משתמשים יתחברו** כדי לרשום להתראות
2. **אדמינים יצרו אירועים** כדי לשלוח התראות
3. **בדיקה במכשיר אמיתי** עם development build

---

**הערה**: Expo Go לא תומך ב-push notifications, אז צריך development build לבדיקה מלאה. 