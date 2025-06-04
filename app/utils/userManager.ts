import AsyncStorage from '@react-native-async-storage/async-storage';

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  profileImage: string;
  coins: number;
  rank?: number;
  lastLoginDate?: string;
  purchasedCoupons?: {
    id: number;
    title: string;
    desc: string;
    coins: number;
    purchaseDate: string;
    isUsed: boolean;
  }[];
}

// רשימת משתמשים קבועה לדוגמה
const DEFAULT_USERS: User[] = [
  { id: '1', firstName: 'דני', lastName: 'כהן', email: 'dani@example.com', password: 'password123', profileImage: 'https://example.com/avatar1.jpg', coins: 450 },
  { id: '2', firstName: 'מיכל', lastName: 'לוי', email: 'michal@example.com', password: 'password123', profileImage: 'https://example.com/avatar2.jpg', coins: 380 },
  { id: '3', firstName: 'יוסי', lastName: 'אברהם', email: 'yossi@example.com', password: 'password123', profileImage: 'https://example.com/avatar3.jpg', coins: 320 },
  { id: '4', firstName: 'רונית', lastName: 'שמעוני', email: 'ronit@example.com', password: 'password123', profileImage: 'https://example.com/avatar4.jpg', coins: 300 },
  { id: '5', firstName: 'אבי', lastName: 'דוד', email: 'avi@example.com', password: 'password123', profileImage: 'https://example.com/avatar5.jpg', coins: 280 },
  { id: '6', firstName: 'שירה', lastName: 'מזרחי', email: 'shira@example.com', password: 'password123', profileImage: 'https://example.com/avatar6.jpg', coins: 250 },
  { id: '7', firstName: 'עומר', lastName: 'פרץ', email: 'omer@example.com', password: 'password123', profileImage: 'https://example.com/avatar7.jpg', coins: 220 },
  { id: '8', firstName: 'נועה', lastName: 'ברק', email: 'noa@example.com', password: 'password123', profileImage: 'https://example.com/avatar8.jpg', coins: 200 },
  { id: '9', firstName: 'איתי', lastName: 'גולן', email: 'itai@example.com', password: 'password123', profileImage: 'https://example.com/avatar9.jpg', coins: 180 },
  { id: '10', firstName: 'ליאת', lastName: 'אדרי', email: 'liat@example.com', password: 'password123', profileImage: 'https://example.com/avatar10.jpg', coins: 150 },
];

// מפתחות לשמירה ב-AsyncStorage
const STORAGE_KEYS = {
  CURRENT_USER: 'currentUser',
  ALL_USERS: 'allUsers',
  USER_AUTH: 'userAuth',
};

export const userManager = {
  // התחברות משתמש
  async login(email: string, password: string): Promise<{ success: boolean; message: string; user?: User }> {
    try {
      const allUsers = await this.getAllUsers();
      const user = allUsers.find(u => u.email === email);

      if (!user) {
        return { success: false, message: 'משתמש לא נמצא' };
      }

      if (user.password !== password) {
        return { success: false, message: 'סיסמא שגויה' };
      }

      // עדכון תאריך התחברות אחרון
      const updatedUser = {
        ...user,
        lastLoginDate: new Date().toISOString()
      };

      // שמירת המשתמש המחובר
      await this.saveCurrentUser(updatedUser);

      return { success: true, message: 'התחברת בהצלחה', user: updatedUser };
    } catch (error) {
      console.error('Error during login:', error);
      return { success: false, message: 'שגיאה בהתחברות' };
    }
  },

  // הרשמת משתמש חדש
  async signup(userData: Omit<User, 'id' | 'coins' | 'rank'>): Promise<{ success: boolean; message: string; user?: User }> {
    try {
      const allUsers = await this.getAllUsers();
      
      // בדיקה אם המייל כבר קיים
      if (allUsers.some(u => u.email === userData.email)) {
        return { success: false, message: 'כתובת המייל כבר קיימת במערכת' };
      }

      // יצירת משתמש חדש
      const newUser: User = {
        ...userData,
        id: Date.now().toString(),
        coins: 0,
        lastLoginDate: new Date().toISOString()
      };

      // הוספת המשתמש לרשימה
      const updatedUsers = [...allUsers, newUser];
      await AsyncStorage.setItem(STORAGE_KEYS.ALL_USERS, JSON.stringify(updatedUsers));
      
      // שמירת המשתמש כמחובר
      await this.saveCurrentUser(newUser);

      return { success: true, message: 'נרשמת בהצלחה', user: newUser };
    } catch (error) {
      console.error('Error during signup:', error);
      return { success: false, message: 'שגיאה בהרשמה' };
    }
  },

  // התנתקות
  async logout(): Promise<void> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    } catch (error) {
      console.error('Error during logout:', error);
    }
  },

  // שמירת המשתמש הנוכחי
  async saveCurrentUser(user: User): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
      
      // עדכון המשתמש גם ברשימת כל המשתמשים
      const allUsers = await this.getAllUsers();
      const updatedUsers = allUsers.map(u => u.id === user.id ? user : u);
      await AsyncStorage.setItem(STORAGE_KEYS.ALL_USERS, JSON.stringify(updatedUsers));
    } catch (error) {
      console.error('Error saving current user:', error);
    }
  },

  // קבלת המשתמש הנוכחי
  async getCurrentUser(): Promise<User | null> {
    try {
      const userStr = await AsyncStorage.getItem(STORAGE_KEYS.CURRENT_USER);
      return userStr ? JSON.parse(userStr) : null;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  },

  // קבלת כל המשתמשים
  async getAllUsers(): Promise<User[]> {
    try {
      const usersStr = await AsyncStorage.getItem(STORAGE_KEYS.ALL_USERS);
      return usersStr ? JSON.parse(usersStr) : DEFAULT_USERS;
    } catch (error) {
      console.error('Error getting all users:', error);
      return DEFAULT_USERS;
    }
  },

  // עדכון מטבעות למשתמש הנוכחי
  async updateUserCoins(coins: number): Promise<void> {
    try {
      const currentUser = await this.getCurrentUser();
      if (!currentUser) return;

      const updatedUser = { ...currentUser, coins };
      await this.saveCurrentUser(updatedUser);

      // עדכון הדירוג הכללי
      const allUsers = await this.getAllUsers();
      const otherUsers = allUsers.filter(user => user.id !== currentUser.id);
      const updatedUsers = [...otherUsers, updatedUser]
        .sort((a, b) => b.coins - a.coins)
        .map((user, index) => ({ ...user, rank: index + 1 }));

      await AsyncStorage.setItem(STORAGE_KEYS.ALL_USERS, JSON.stringify(updatedUsers));
    } catch (error) {
      console.error('Error updating user coins:', error);
    }
  },

  // אתחול המערכת עם משתמש חדש
  async initializeWithNewUser(user: User): Promise<void> {
    try {
      const newUser = { ...user, id: Date.now().toString(), coins: 0 };
      await this.saveCurrentUser(newUser);

      const allUsers = await this.getAllUsers();
      const updatedUsers = [...allUsers, newUser]
        .sort((a, b) => b.coins - a.coins)
        .map((user, index) => ({ ...user, rank: index + 1 }));

      await AsyncStorage.setItem(STORAGE_KEYS.ALL_USERS, JSON.stringify(updatedUsers));
    } catch (error) {
      console.error('Error initializing new user:', error);
    }
  },

  // קבלת דירוג המשתמש הנוכחי
  async getCurrentUserRank(): Promise<number> {
    try {
      const currentUser = await this.getCurrentUser();
      if (!currentUser) return 0;

      const allUsers = await this.getAllUsers();
      const sortedUsers = allUsers.sort((a, b) => b.coins - a.coins);
      return sortedUsers.findIndex(user => user.id === currentUser.id) + 1;
    } catch (error) {
      console.error('Error getting user rank:', error);
      return 0;
    }
  },

  // פונקציה חדשה לשמירת קופון שנרכש
  async savePurchasedCoupon(couponData: {
    id: number;
    title: string;
    desc: string;
    coins: number;
  }): Promise<boolean> {
    try {
      const currentUser = await this.getCurrentUser();
      if (!currentUser) return false;

      const newCoupon = {
        ...couponData,
        purchaseDate: new Date().toISOString(),
        isUsed: false
      };

      const updatedUser = {
        ...currentUser,
        purchasedCoupons: [
          ...(currentUser.purchasedCoupons || []),
          newCoupon
        ]
      };

      await this.saveCurrentUser(updatedUser);
      return true;
    } catch (error) {
      console.error('Error saving purchased coupon:', error);
      return false;
    }
  },

  // פונקציה לסימון קופון כמשומש
  async markCouponAsUsed(couponId: number): Promise<boolean> {
    try {
      const currentUser = await this.getCurrentUser();
      if (!currentUser || !currentUser.purchasedCoupons) return false;

      const updatedCoupons = currentUser.purchasedCoupons.map(coupon =>
        coupon.id === couponId ? { ...coupon, isUsed: true } : coupon
      );

      const updatedUser = {
        ...currentUser,
        purchasedCoupons: updatedCoupons
      };

      await this.saveCurrentUser(updatedUser);
      return true;
    } catch (error) {
      console.error('Error marking coupon as used:', error);
      return false;
    }
  },

  // פונקציה לקבלת כל הקופונים שנרכשו
  async getPurchasedCoupons(): Promise<User['purchasedCoupons']> {
    try {
      const currentUser = await this.getCurrentUser();
      return currentUser?.purchasedCoupons || [];
    } catch (error) {
      console.error('Error getting purchased coupons:', error);
      return [];
    }
  }
}; 