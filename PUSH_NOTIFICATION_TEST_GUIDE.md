# 🧪 מדריך בדיקת Push Notifications

## 📋 סקירה כללית
מדריך זה יעזור לך לבדוק את push notifications באפליקציה Voluntree.

## 🔧 כלים נדרשים
- **אתר Expo**: https://expo.dev/notifications
- **אסימוני Push**: רשומים למטה
- **אפליקציה מותקנת**: בטלפון או סימולטור

## 📱 אסימוני Push לבדיקה

### 👑 אדמינים (Admin Users)
1. **גבי בר-און** (Admin)
   - Token: `ExponentPushToken[mPJuGIGNDGTuEIDB6uW_nn]`
   - User ID: `d87fdbf6-a84b-411c-83c6-545b11812f10`

2. **חן פרחי כהן** (Admin)
   - Token: `ExponentPushToken[2n24ZDAzMidK4fbUIfzTcG]`
   - User ID: `d1dbf6ae-d6f0-4c71-a4ea-58560bc11868`

3. **גיא שלמה** (Admin)
   - Token: `ExponentPushToken[pUjrg4GXXwn9PAC1jN7D_F]`
   - User ID: `e66f2fc9-4f1a-4541-9a72-a0f04ad4bc7d`

### 👤 משתמשים רגילים (Regular Users)
1. **אמי שלמה**
   - Token: `ExponentPushToken[Bv5POOIQ8kx2Uzjcow23bN]`
   - User ID: `35961a6f-11d1-4aae-bd55-c63fcd282424`

2. **גיא שלמה**
   - Token: `ExponentPushToken[VErVtuK3qx94sEJgYYoLIG]`
   - User ID: `0e9e997d-6871-4357-a721-0dcd5c822d87`

3. **ורד שגיא**
   - Token: `ExponentPushToken[hFPv3EDEzLp5KNXbS89Cav]`
   - User ID: `c12326e6-3b80-49bc-b79e-5bc0ac0b6cc2`

## 🧪 בדיקות מומלצות

### 1. בדיקת הרשמה להתנדבות (Admin Notification)
**מטרה**: לבדוק שאדמין מקבל התראה כאשר מישהו נרשם להתנדבות שלו

**שלבים**:
1. לך ל- https://expo.dev/notifications
2. הכנס אסימון של אדמין ב-"Recipient"
3. מלא את הפרטים:
   - **Title**: `הרשמה חדשה להתנדבות! 🎉`
   - **Body**: `אמי שלמה נרשם להתנדבות "חדר כושר"`
   - **Data**: 
   ```json
   {
     "type": "admin_registration",
     "eventId": "test-event-123",
     "eventTitle": "חדר כושר",
     "registrantName": "אמי שלמה"
   }
   ```
4. לחץ "Send"
5. בדוק שהאדמין מקבל התראה באפליקציה

### 2. בדיקת אישור התנדבות (User Notification)
**מטרה**: לבדוק שמשתמש מקבל התראה כאשר התנדבות שלו מאושרת

**שלבים**:
1. לך ל- https://expo.dev/notifications
2. הכנס אסימון של משתמש רגיל ב-"Recipient"
3. מלא את הפרטים:
   - **Title**: `התנדבות אושרה! 🎉`
   - **Body**: `התנדבות "חדר כושר" אושרה! קיבלת 5 מטבעות`
   - **Data**: 
   ```json
   {
     "type": "volunteer_approved",
     "eventId": "test-event-123",
     "eventTitle": "חדר כושר",
     "coinsReward": 5
   }
   ```
4. לחץ "Send"
5. בדוק שהמשתמש מקבל התראה באפליקציה

### 3. בדיקת ביטול הרשמה (Admin Notification)
**מטרה**: לבדוק שאדמין מקבל התראה כאשר מישהו מבטל הרשמה

**שלבים**:
1. לך ל- https://expo.dev/notifications
2. הכנס אסימון של אדמין ב-"Recipient"
3. מלא את הפרטים:
   - **Title**: `ביטול הרשמה להתנדבות 📝`
   - **Body**: `אמי שלמה ביטל את ההרשמה להתנדבות "חדר כושר"`
   - **Data**: 
   ```json
   {
     "type": "admin_cancellation",
     "eventId": "test-event-123",
     "eventTitle": "חדר כושר",
     "registrantName": "אמי שלמה"
   }
   ```
4. לחץ "Send"
5. בדוק שהאדמין מקבל התראה באפליקציה

## 🔍 בדיקת התנהגות באפליקציה

### כאשר מקבלים התראה:
1. **התראה מופיעה**: בדוק שהתראה מופיעה בחלק העליון של המסך
2. **צליל**: בדוק שיש צליל התראה
3. **ניווט**: בדוק שלחיצה על ההתראה מנווטת למסך הנכון
4. **נתונים**: בדוק שהנתונים נטענים נכון

### בדיקת הגדרות:
1. **הגדרות האפליקציה**: בדוק שההגדרות "התראות הרשמה" ו"התראות אישור" עובדות
2. **הפעלה/כיבוי**: בדוק שאפשר להפעיל ולכבות התראות

## 🐛 פתרון בעיות

### התראה לא מופיעה:
1. בדוק שהאפליקציה מותקנת ופתוחה
2. בדוק שהמכשיר מחובר לאינטרנט
3. בדוק שהרשאות התראות מופעלות
4. בדוק שהאסימון תקף

### התראה לא נשלחת:
1. בדוק שהאסימון נכון
2. בדוק שהפורמט של ההודעה נכון
3. בדוק שהנתונים ב-JSON תקינים

### בעיות בניווט:
1. בדוק שהנתונים ב-"Data" נכונים
2. בדוק שהטיפול בהודעות ב-App.tsx עובד

## 📊 מעקב אחר בדיקות

### רשימת בדיקות:
- [ ] התראה הרשמה לאדמין
- [ ] התראה אישור למשתמש
- [ ] התראה ביטול לאדמין
- [ ] ניווט מהודעות
- [ ] הגדרות התראות
- [ ] צלילי התראה
- [ ] הודעת מטבעות במסך הבית

### תוצאות:
- **✅ עובד**: התראה מופיעה ופועלת כמצופה
- **⚠️ חלקי**: התראה מופיעה אבל יש בעיות קטנות
- **❌ לא עובד**: התראה לא מופיעה או לא פועלת

## 🎯 סיכום
אחרי שתסיים את כל הבדיקות, תוכל לוודא ש-push notifications עובדים כראוי באפליקציה Voluntree. 

## 📱 מדריך מלא לבדיקת Push Notifications ב-Expo Go

### 1. **Recipient (נמען)**
הכנס אחד מהאסימונים הבאים:
```
ExponentPushToken[mPJuGIGNDGTuEIDB6uW_nn]
```
או
```
ExponentPushToken[Bv5POOIQ8kx2Uzjcow23bN]
```

### 2. **Access Token (אסימון גישה)**
**השאר ריק** - לא צריך למלא כלום

### 3. **Message title (כותרת הודעה)**
```
הרשמה חדשה להתנדבות! 🎉
```

### 4. **Message body (גוף הודעה)**
```
אמי שלמה נרשם להתנדבות "חדר כושר"
```

### 5. **Data (JSON string)**
```json
{
  "type": "admin_registration",
  "eventId": "test-event-123",
  "eventTitle": "חדר כושר",
  "registrantName": "אמי שלמה"
}
```

## 🎯 סיכום
אחרי שתסיים את כל הבדיקות, תוכל לוודא ש-push notifications עובדים כראוי באפליקציה Voluntree. 

## 🎯 סיכום
אחרי שתסיים את כל הבדיקות, תוכל לוודא ש-push notifications עובדים כראוי באפליקציה Voluntree. 