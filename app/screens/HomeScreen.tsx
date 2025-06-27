import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import { 
  getCurrentUserFromSupabase, 
  getAllUsersFromSupabase, 
  updateUserInSupabase,
  getAllVolunteerEvents,
  getVolunteerEventsByAdmin,
  getAllVolunteerRegistrations,
  getEventRegistrations,
  completeVolunteerEvent,
  deleteVolunteerEvent,
  deactivateVolunteerEvent,
  getUserById
} from '../db/supabaseApi';
import type { VolunteerEvent, VolunteerRegistration } from '../types/types';
import { User } from '../types/types';
import { addCoinsUpdateListener, addEventDeletedListener, addTasksCompletedListener, emitCoinsUpdate, emitEventDeleted, emitTasksCompletedUpdate, removeCoinsUpdateListener, removeEventDeletedListener, removeTasksCompletedListener } from '../utils/eventEmitter';
import { cacheManager } from '../utils/cacheManager';
import { navigationOptimizer } from '../utils/navigationOptimizer';

// --- ערכים מותאמים לעיצוב פרופורציונלי ---
const STAGE_SIZE = 66;
const verticalGap = 110;
const horizontalPadding = 40;
const BOTTOM_BANNER_HEIGHT = 85;
const BOTTOM_PADDING = 100;
const INITIAL_STAGE_OFFSET = 50;
const { width } = Dimensions.get('window');
// ------------------------------------------

type RootStackParamList = {
  Home: undefined;
  Trophy: undefined;
  Gift: undefined;
  Volunteer: { from: 'Home' | 'Trophy' };
  Calendar: undefined;
  Login: undefined;
  Signup: undefined;
  AdminUsers: { openCreateForm?: boolean } | undefined;
};

type NavigationProp = StackNavigationProp<RootStackParamList>;

// הוספת טיפים והודעות מהאווטר
const AVATAR_MESSAGES = {
  closeToNextStage: 'כמעט שם! עוד קצת להשלמת השלב! 🎯',
  stageComplete: 'כל הכבוד! השלמת את השלב! 🌟',
  dailyTip: 'היי! יש לנו היום הזדמנויות התנדבות חדשות! 🎁',
};

// משפטי מוטיבציה והשבחה לכל שלב
const MOTIVATION_MESSAGES = [
  'הצעד הראשון הוא תמיד הקשה ביותר! 🌟',
  'אתה בדרך הנכונה! המשך כך! 💪',
  'יפה מאוד! אתה מתקדם נהדר! 🎯',
  'רואים שאתה מתחיל להבין את הקטע! 🔥',
  'חמש כבר? אתה אלוף אמיתי! 🏆',
  'אתה באמצע הדרך! ממשיך בכוח! ⭐',
  'מרשים! השביל שלך מתחיל להיראות! 🌈',
  'שמונה שלבים! אתה כבר מומחה! 🎨',
  'תשעה! התקדמות יוצאת דופן! 💎',
  'עשרה! אתה באמת משהו מיוחד! 🚀',
  'אחד עשר! אתה כבר לא רק מתחיל! 🌟',
  'שנים עשר! רמה מקצועית אמיתית! 👑',
  'שלושה עשר! אתה הופך לאגדה! ✨',
  'ארבעה עשר! כמעט בפסגה! 🏔️',
  'חמישה עשר! אתה השגת את הבלתי אפשרי! 🎆',
  'שישה עשר! אתה יוצר היסטוריה! 🏆',
  'שבעה עשר! רמת מאסטר אמיתית! 💫',
  'שמונה עשר! אתה מעבר למצוינות! 🌟',
  'תשעה עשר! אתה מגדיר מחדש את המילה הישג! 🎯',
  'עשרים! אתה ברמה אחרת לגמרי! 🚀',
  'כ"א! אתה פשוט פלא של הטבע! 🌠',
  'כ"ב! אין גבולות למה שאתה יכול! 💥',
  'כ"ג! אתה מלהיב ומעורר השראה! ⚡',
  'כ"ד! רמת הישגיות בלתי רגילה! 🔮',
  'כ"ה! אתה עונה על כל הציפיות! 🎭',
  'כ"ו! המסע שלך הופך לסיפור! 📖',
  'כ"ז! אתה מוכיח שהכל אפשרי! 🗝️',
  'כ"ח! המנטליות שלך מדהימה! 🧠',
  'כ"ט! אתה דוגמה לחיקוי! 🏅',
  'שלושים! מספר עגול ומרשים! 🎪',
  'ל"א! אתה ממשיך להפתיע! 🎨',
  'ל"ב! ההתמדה שלך משפיעה! 🌊',
  'ל"ג! אתה מלא אנרגיה חיובית! ☀️',
  'ל"ד! הדרך שלך מאירה לאחרים! 💡',
  'ל"ה! אתה משנה את החוקים! 🔄',
  'ל"ו! יצירתיות ללא גבולות! 🎪',
  'ל"ז! אתה מעורר התפעלות! 👏',
  'ל"ח! המומנטום שלך מדבק! 🌪️',
  'ל"ט! אתה כמעט ברמת על-אנושית! 🦸',
  'ארבעים! מספר מיסטי ומיוחד! 🔯',
  'מ"א! אתה עבר כל מבחן! ✅',
  'מ"ב! התשובה לכל השאלות! 🤖',
  'מ"ג! אתה יוצר מציאות חדשה! 🌍',
  'מ"ד! הדמיון שלך הופך למציאות! 🌈',
  'מ"ה! אתה הגדרה חדשה להצלחה! 💫',
  'מ"ו! אתה צובר הישגים כמו אגדות! 📚',
  'מ"ז! המסע שלך יהפוך ללגנדה! 🏛️',
  'מ"ח! אתה מגיע לרמות חדשות! 🎯',
  'מ"ט! כמעט חמישים! אתה פלא! ⭐',
  'חמישים! אתה השגת את הבלתי ייאמן! 🎆'
];

// הגדרת האווטרים לפי שלבים
const STAGE_AVATARS = {
  BEGINNER: ['🐣', '🐤', '🐥'], // שלבים 1-3
  INTERMEDIATE: ['🦊', '🦁', '🐯'], // שלבים 4-6
  ADVANCED: ['🦄', '🐉', '🦅'], // שלבים 7-9
  EXPERT: ['⭐', '🌟', '💫'], // שלבים 10-12
  MASTER: ['👑', '🎯', '🏆'], // שלבים 13-15
  // אווטרים לשלבים מתקדמים
  LEGENDARY: ['🌈', '✨', '🔮', '💎', '🌠'] // שלבים 16+
};

// הוספת טיפוס UserWithTasks
type UserWithTasks = User & {
  tasksCompleted?: number;
  currentLevel?: number;
};

// הוספת קבוע totalStages
const totalStages = 50; // מספר השלבים הכולל

export default function HomeScreen() {
  const navigation = useNavigation<NavigationProp>();
  const scrollViewRef = useRef<ScrollView | null>(null);
  const [currentUser, setCurrentUser] = useState<UserWithTasks | null>(null);
  const [userCoins, setUserCoins] = React.useState(0);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [showMotivationBanner, setShowMotivationBanner] = useState(false);
  const [motivationMessage, setMotivationMessage] = useState('');
  const [isAvatarWalking, setIsAvatarWalking] = useState(false);
  const [avatarMessage, setAvatarMessage] = useState('');
  const [showTip, setShowTip] = useState(false);
  const [currentAvatar, setCurrentAvatar] = useState('🐣');
  const avatarPosition = React.useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const lastProgress = useRef(0);
  const [selectedStage, setSelectedStage] = useState<number | null>(null);
  const stageScale = useRef(new Animated.Value(1)).current;
  const motivationBannerScale = useRef(new Animated.Value(0)).current;
  const motivationBannerOpacity = useRef(new Animated.Value(0)).current;
  const prevCompletedStagesRef = useRef(0);
  const prevCurrentAvatarRef = useRef(currentAvatar);
  const [messageQueue, setMessageQueue] = useState<string[]>([]);
  const [forceUpdateKey, setForceUpdateKey] = useState(0);

  // Admin specific state
  const [adminEvents, setAdminEvents] = useState<VolunteerEvent[]>([]);
  const [adminRegistrations, setAdminRegistrations] = useState<VolunteerRegistration[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [isLoadingAdminData, setIsLoadingAdminData] = useState(false);
  
  // Participant management state
  const [showParticipantsList, setShowParticipantsList] = useState(false);
  const [selectedEventForParticipants, setSelectedEventForParticipants] = useState<VolunteerEvent | null>(null);
  const [participantDecisions, setParticipantDecisions] = useState<{[userId: string]: 'approved' | 'rejected' | null}>({});
  const [eventParticipants, setEventParticipants] = useState<VolunteerRegistration[]>([]);

  // אנימציות מנעול וקונפטי
  const [lockAnimations, setLockAnimations] = useState<{[worldId: number]: Animated.Value}>({});
  const [showConfetti, setShowConfetti] = useState<{[worldId: number]: boolean}>({});
  const [unlockedWorlds, setUnlockedWorlds] = useState<Set<number>>(new Set());
  const lockRotation = useRef(new Animated.Value(0)).current;

  // טעינת נתוני המשתמש בעת טעינת המסך
  useEffect(() => {
    loadUserData();

    // הוספת מאזין לשינויים במטבעות
    const coinsUpdateHandler = (newCoins: number) => {
      setUserCoins(newCoins);
    };

    // הוספת מאזין למחיקת אירועים
    const eventDeletedHandler = () => {
      if (currentUser?.isAdmin) {
        loadAdminData();
      }
    };

    // הוספת מאזין לעדכון התנדבויות
    const tasksCompletedHandler = (userId: string, tasksCompleted: number) => {
      if (currentUser && currentUser.id === userId) {
        console.log('🔔 TasksCompleted update received:', { userId, tasksCompleted });
        setCurrentUser(prev => {
          if (prev) {
            const updatedUser = { ...prev, tasksCompleted };
            console.log('🔄 Updating user in state:', { old: prev.tasksCompleted, new: tasksCompleted });
            // Update cache as well
            cacheManager.setUserData(updatedUser);
            return updatedUser;
          }
          return null;
        });
        
        // Force re-render to update the path
        setForceUpdateKey(prev => {
          console.log('🔄 Force update for tasks completed:', prev + 1);
          return prev + 1;
        });
      }
    };

    addCoinsUpdateListener(coinsUpdateHandler);
    addEventDeletedListener(eventDeletedHandler);
    addTasksCompletedListener(tasksCompletedHandler);

    // ניקוי המאזינים כשהקומפוננטה מתפרקת
    return () => {
      removeCoinsUpdateListener(coinsUpdateHandler);
      removeEventDeletedListener(eventDeletedHandler);
      removeTasksCompletedListener(tasksCompletedHandler);
    };
  }, [currentUser?.isAdmin, currentUser?.id]);

  // טעינת נתוני אדמין כאשר המשתמש מתעדכן
  useEffect(() => {
    if (currentUser?.isAdmin && currentUser?.id) {
      console.log('🔄 User updated and is admin, loading admin data');
      // Small delay to avoid race conditions
      setTimeout(() => {
        loadAdminData(false); // Use cache first
      }, 50);
    }
  }, [currentUser?.isAdmin, currentUser?.id]);

  // רענון נתונים אוטומטי כל 30 שניות (פחות תכוף) כדי לסנכרן עם TrophyScreen
  useEffect(() => {
    const interval = setInterval(() => {
      console.log('🔄 HomeScreen: Background refresh every 30 seconds...');
      // רענון שקט ברקע - ללא מסך טעינה, עם cache
      loadUserData(false); // Use cache if available
      if (currentUser?.isAdmin) {
        loadAdminData(false); // Use cache if available
      }
    }, 30000); // כל 30 שניות במקום 5

    return () => clearInterval(interval);
  }, [currentUser?.isAdmin]);

  // וידוא שהנתונים מתעדכנים כשחוזרים למסך - עם cache
  useFocusEffect(
    useCallback(() => {
      console.log('🔄 HomeScreen focused - using cache first');
      console.log('🔄 Current user before load:', currentUser?.tasksCompleted);
      
      // Track navigation for optimization
      navigationOptimizer.trackNavigation('Home');
      
      // Use cache first for instant loading, then refresh in background
      loadUserData(false).then(() => {
        console.log('🔄 User data loaded from cache, forcing update');
        // כפיית רענון הקומפוננטה כדי שהשביל יצויר מחדש
        setForceUpdateKey(prev => {
          console.log('🔄 Force update key changed from', prev, 'to', prev + 1);
          return prev + 1;
        });
        
        // Background refresh after cache load
        setTimeout(() => {
          loadUserData(true); // Force refresh in background
        }, 100);
      });
      
      // Load admin data after a short delay to ensure user data is loaded
      setTimeout(() => {
        if (currentUser?.isAdmin) {
          console.log('🔄 Loading admin data from cache for user:', currentUser.firstName);
          loadAdminData(false); // Use cache first, background refresh will happen later
        }
      }, 100);
    }, [])
  );

  // טעינת נתוני המשתמש - עם global cache manager
  const loadUserData = useCallback(async (forceRefresh = false) => {
    try {
      // Check cache first (except for force refresh)
      if (!forceRefresh) {
        const cachedUser = cacheManager.getUserData();
        if (cachedUser) {
          console.log('📦 Using cached user data from global cache');
          setCurrentUser(cachedUser);
          setUserCoins(cachedUser.coins || 0);
          setIsLoadingUser(false);
          
          // Load admin data if needed (from cache or background)
          if (cachedUser.isAdmin) {
            loadAdminData(); // Background load
          }
          return;
        }
      }

      setIsLoadingUser(true);
      // Use Supabase direct connection
      const user = await getCurrentUserFromSupabase();
      if (user) {
        // Update global cache
        cacheManager.setUserData(user);
        
        setCurrentUser(user);
        setUserCoins(user.coins || 0);
        
        console.log('✅ [Supabase] נתוני משתמש נטענו:', { 
          name: user.firstName, 
          coins: user.coins, 
          tasksCompleted: user.tasksCompleted,
          isAdmin: user.isAdmin
        });

        // Set navigation context for optimization
        navigationOptimizer.setUserContext(user.id, user.isAdmin || false);

        // טעינת נתונים נוספים למנהלים - ברקע
        if (user.isAdmin) {
          console.log('👑 [Supabase] Loading admin data in background...');
          // Force load admin data to ensure it's always loaded
          setTimeout(() => {
            loadAdminData(forceRefresh); // Use same refresh flag as user data
          }, 100);
        } else {
          // Preload volunteer data for regular users in background
          console.log('🚀 Preloading volunteer data in background...');
          preloadVolunteerData(user.id);
        }
      }
    } catch (error) {
      console.error('❌ [Supabase] שגיאה בטעינת נתוני משתמש:', error);
    } finally {
      setIsLoadingUser(false);
    }
  }, []);

  const loadAdminData = async (forceRefresh = false) => {
    try {
      if (!currentUser?.id) {
        console.log('❌ No current user ID available for admin data - skipping without clearing');
        return; // Don't clear data, just skip loading
      }

      // Prevent multiple simultaneous loads
      if (isLoadingAdminData && !forceRefresh) {
        console.log('📊 Admin data already loading, skipping...');
        return;
      }

      setIsLoadingAdminData(true);
      
      // Check cache first
      if (!forceRefresh) {
        const cachedEvents = cacheManager.getAdminEvents(currentUser.id);
        const cachedRegistrations = cacheManager.getAdminRegistrations(currentUser.id);
        
        if (cachedEvents && cachedRegistrations) {
          console.log('📦 Using cached admin data from global cache');
          setAdminEvents(cachedEvents);
          setAdminRegistrations(cachedRegistrations);
          setIsLoadingAdminData(false);
          return;
        }
      }

      console.log('📊 Loading admin data for user:', currentUser.id);
      
      const [events, allRegistrations] = await Promise.all([
        getVolunteerEventsByAdmin(currentUser.id),
        getAllVolunteerRegistrations()
      ]);
      
      // Filter registrations to only include those for events created by this admin
      const adminEventIds = events.map(event => event.id);
      const filteredRegistrations = allRegistrations.filter(registration => 
        adminEventIds.includes(registration.event_id)
      );
      
      // Update global cache
      cacheManager.setAdminData(events, filteredRegistrations, currentUser.id);
      
      console.log('📊 Loaded events:', events.length);
      console.log('📊 Filtered registrations:', filteredRegistrations.length, 'out of', allRegistrations.length);
      

      
      setAdminEvents(events);
      setAdminRegistrations(filteredRegistrations);
      
      console.log('📊 Admin data updated in state');
    } catch (error) {
      console.error('Error loading admin data:', error);
    } finally {
      setIsLoadingAdminData(false);
    }
  };

  // Preload volunteer data in background for faster navigation
  const preloadVolunteerData = async (userId: string) => {
    try {
      // Check if already cached
      const cachedEvents = cacheManager.getVolunteerEvents();
      const cachedRegistrations = cacheManager.getUserRegistrations(userId);
      
      if (cachedEvents && cachedRegistrations) {
        console.log('📦 Volunteer data already cached');
        return;
      }

      console.log('🚀 Preloading volunteer data...');
      // Import volunteerEventsManager dynamically to avoid circular dependencies
      const { volunteerEventsManager } = await import('../utils/volunteerEvents');
      
      const [events, registrations] = await Promise.all([
        volunteerEventsManager.getAllEvents(),
        volunteerEventsManager.getUserRegistrations(userId)
      ]);
      
      // Cache the preloaded data
      cacheManager.setVolunteerData(events, registrations, userId);
      console.log('✅ Volunteer data preloaded and cached');
    } catch (error) {
      console.error('❌ Error preloading volunteer data:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    // Force refresh - bypass cache
    await loadUserData(true);
    if (currentUser?.isAdmin) {
      await loadAdminData(true);
    }
    setRefreshing(false);
  };

  const handleCompleteEvent = async (eventId: string, eventTitle: string) => {
    if (!currentUser) return;

    try {
      console.log('🎯 השלמת אירוע:', eventTitle);
      const newTasksCompleted = (currentUser.tasksCompleted || 0) + 1;
      console.log(`📈 התנדבויות חדשות: ${currentUser.tasksCompleted} -> ${newTasksCompleted}`);
      
      // בדיקה אם זה אמור לפתוח עולם חדש
      const oldStage = Math.floor((currentUser.tasksCompleted || 0) / 10);
      const newStage = Math.floor(newTasksCompleted / 10);
      if (newStage > oldStage && newTasksCompleted % 10 === 0) {
        const newWorld = Math.ceil((newStage + 1) / 10);
        console.log(`🌟 אמור לפתוח עולם ${newWorld} אחרי השלמת שלב ${newStage + 1}!`);
      }

      await completeVolunteerEvent(eventId, [currentUser.id]);
      await updateUserInSupabase(currentUser.id, { 
        taskcompleted: newTasksCompleted,
        coins: (currentUser.coins || 0) + 10 
      });

      setCurrentUser(prev => prev ? { 
        ...prev, 
        tasksCompleted: newTasksCompleted,
        coins: (prev.coins || 0) + 10 
      } : null);
      
      setForceUpdateKey(prev => prev + 1);
      emitTasksCompletedUpdate(currentUser.id, newTasksCompleted);

      Alert.alert(
        'כל הכבוד!',
        `השלמת בהצלחה: ${eventTitle}\n+10 מטבעות!`,
        [{ text: 'המשך', style: 'default' }]
      );

      if (currentUser?.isAdmin) {
        loadAdminData();
      }
    } catch (error) {
      console.error('Error completing event:', error);
      Alert.alert('שגיאה', 'לא ניתן להשלים את האירוע');
    }
  };

  // Handle viewing participants (admin only) - Open modal to view all participants
  const handleViewParticipants = async (eventId: string, eventTitle: string) => {
    console.log('🔍 Trying to view participants for:', eventTitle, 'ID:', eventId);
    
    if (!currentUser?.isAdmin) {
      console.log('❌ User is not admin');
      return;
    }

    try {
      // Get all registrations for this specific event
      console.log('📊 Getting registrations...');
      const eventRegistrations = await getEventRegistrations(eventId);
      console.log('📋 Found registrations:', eventRegistrations.length, eventRegistrations);

      // Always show the list, even if empty (for testing)
      const event = adminEvents.find(e => e.id === eventId);
      if (!event) {
        console.log('❌ Event not found');
        return;
      }

      console.log('✅ Setting up participants list');
      setSelectedEventForParticipants(event);
      setEventParticipants(eventRegistrations);
      setParticipantDecisions({});
      setShowParticipantsList(true);
      console.log('🎯 List should be visible now');

      // Show alert if no participants, but still show the list
      if (eventRegistrations.length === 0) {
        setTimeout(() => {
          Alert.alert('מידע', 'אין משתתפים רשומים להתנדבות זו כרגע');
        }, 500);
      }
    } catch (error: any) {
      console.error('❌ שגיאה בפתיחת רשימת משתתפים:', error);
      Alert.alert('שגיאה', error.message || 'לא ניתן לפתוח את רשימת המשתתפים');
    }
  };

  // Handle individual participant decision
  const handleParticipantDecision = async (userId: string, decision: 'approved' | 'rejected') => {
    // Update the UI state first
    setParticipantDecisions(prev => ({
      ...prev,
      [userId]: decision
    }));

    if (!selectedEventForParticipants) return;

    try {
      // Get user data first
      const user = await getUserById(userId);
      if (!user) {
        console.error('User not found:', userId);
        return;
      }

      // Remove user from the participant list immediately
      setEventParticipants(prev => prev.filter(p => p.user_id !== userId));

      if (decision === 'approved') {
        console.log('✅ Approving user:', userId, 'for event:', selectedEventForParticipants.title);
        
        // Calculate new values
        const coinsReward = selectedEventForParticipants.coins_reward || 50;
        const newCoins = (user.coins || 0) + coinsReward;
        const currentTasks = user.tasksCompleted || 0;
        const newTasksCompleted = currentTasks + 1;

        console.log('📊 [HomeScreen] About to update user:', {
          userId,
          currentCoins: user.coins,
          coinsReward,
          newCoins,
          currentTasks,
          newTasksCompleted,
          userObject: user
        });

        // Update user in database using proper function
        try {
          console.log('🔄 [HomeScreen] Updating database with:', { 
            coins: newCoins,
            taskcompleted: newTasksCompleted
          });
          
          await updateUserInSupabase(userId, { 
            coins: newCoins,
            taskcompleted: newTasksCompleted
          });
          
          console.log('✅ [HomeScreen] User update completed successfully');
          
          // Verify the update by reading back from database
          const updatedUser = await getUserById(userId);
          console.log('🔍 [HomeScreen] Verification - Updated user from DB:', {
            coins: updatedUser?.coins,
            tasksCompleted: updatedUser?.tasksCompleted
          });
          
        } catch (error) {
          console.error('❌ [HomeScreen] Error updating user:', error);
          Alert.alert('שגיאה', 'לא ניתן לעדכן את נתוני המשתמש');
          return;
        }

        // Note: Registration status update is now handled by the backend API

        console.log('✅ User updated successfully:', { userId, newCoins, newTasksCompleted });

        // Emit events to update all screens immediately
        console.log('🔔 [HomeScreen] Emitting updates:');
        console.log('   - User ID:', userId);
        console.log('   - New Coins:', newCoins);
        console.log('   - New TasksCompleted:', newTasksCompleted);
        
        emitCoinsUpdate(newCoins);
        emitTasksCompletedUpdate(userId, newTasksCompleted);
        
        console.log('✅ [HomeScreen] Events emitted successfully');
        
        // Force immediate data refresh to ensure UI shows updated values
        setTimeout(async () => {
          console.log('🔄 [HomeScreen] Forcing data refresh after user update');
          await loadAdminData();
        }, 100);

        // Show success message
        Alert.alert(
          'אושר בהצלחה!', 
          `${user.firstName} ${user.lastName} קיבל ${coinsReward} מטבעות ו-1 משימה שהושלמה`
        );
      } else {
        console.log('❌ Rejecting user:', userId, 'for event:', selectedEventForParticipants.title);
        
        // Note: Registration status update is now handled by the backend API

        // Show rejection message
        Alert.alert('נדחה', `${user.firstName} ${user.lastName} נדחה מההתנדבות`);
      }

      // Force immediate refresh
      setTimeout(async () => {
        await loadAdminData();
        emitEventDeleted(); // Always notify other screens
      }, 300);

      // Force immediate refresh with multiple attempts
      console.log('🔄 Starting aggressive refresh sequence...');
      
      // First immediate refresh
      setTimeout(async () => {
        console.log('🔄 Refresh attempt 1...');
        await loadAdminData();
        emitEventDeleted(); // Always notify other screens
      }, 200);
      
      // Second refresh for safety
      setTimeout(async () => {
        console.log('🔄 Refresh attempt 2...');
        await loadAdminData();
        emitEventDeleted(); // Always notify other screens
      }, 800);
      
      // Third refresh for extra safety
      setTimeout(async () => {
        console.log('🔄 Refresh attempt 3...');
        await loadAdminData();
        emitEventDeleted(); // Always notify other screens
      }, 1500);

      // Force immediate and aggressive refresh
      console.log('🔄 Starting aggressive refresh sequence...');
      
      // Immediate refresh
      await loadAdminData();
      emitEventDeleted();
      
      // Additional refreshes with delays
      setTimeout(async () => {
        console.log('🔄 Refresh attempt 1...');
        await loadAdminData();
        emitEventDeleted();
        // Force re-render by updating state
        setAdminEvents([]);
        setTimeout(async () => {
          await loadAdminData();
        }, 100);
      }, 300);
      
      // Final refresh
      setTimeout(async () => {
        console.log('🔄 Final refresh attempt...');
        await loadAdminData();
        emitEventDeleted();
      }, 1000);

      // Check if this was the last participant
      const remainingParticipants = eventParticipants.filter(p => p.user_id !== userId);
      if (remainingParticipants.length === 0) {
        try {
          // Delete the volunteer event from database
          console.log('🗑️ Attempting to delete event:', selectedEventForParticipants.id);
          
          try {
            // Try hard delete first (more reliable)
            await deleteVolunteerEvent(selectedEventForParticipants.id);
            console.log('✅ Event deleted successfully');
          } catch (deleteError) {
            console.log('⚠️ Hard delete failed, trying soft delete...');
            await deactivateVolunteerEvent(selectedEventForParticipants.id);
            console.log('✅ Event deactivated successfully');
          }
          
          // Close the list 
          setShowParticipantsList(false);
          setSelectedEventForParticipants(null);
          setEventParticipants([]);
          setParticipantDecisions({});
          
          Alert.alert('הושלם', 'כל המשתתפים טופלו וההתנדבות הוסרה מהמערכת');
        } catch (deleteError: any) {
          console.error('❌ Error deleting event:', deleteError);
          Alert.alert(
            'שגיאה במחיקת ההתנדבות', 
            `לא ניתן למחוק את ההתנדבות: ${deleteError.message || 'שגיאה לא ידועה'}`
          );
          
          // Still close the list
          setShowParticipantsList(false);
          setSelectedEventForParticipants(null);
          setEventParticipants([]);
          setParticipantDecisions({});
        }
      }

    } catch (error: any) {
      console.error('❌ Error processing participant decision:', error);
      Alert.alert('שגיאה', 'לא ניתן לעבד את ההחלטה');
      
      // Revert the UI state on error
      setParticipantDecisions(prev => ({
        ...prev,
        [userId]: null
      }));
      
      // Re-add the user to the list on error
      const originalParticipant = eventParticipants.find(p => p.user_id === userId);
      if (originalParticipant) {
        setEventParticipants(prev => [...prev, originalParticipant]);
      }
    }
  };

  // Handle rejections and close the list
  const submitParticipantDecisions = async () => {
    // Since approvals and rejections are now handled immediately,
    // this function just closes the list
    setShowParticipantsList(false);
    setSelectedEventForParticipants(null);
    setEventParticipants([]);
    setParticipantDecisions({});
    await loadAdminData();
  };

  // ספירה מונפשת למטבעות בבאנר העליון
  const [animatedCoins, setAnimatedCoins] = React.useState(userCoins);
  React.useEffect(() => {
    if (animatedCoins === userCoins) return;
    let start = animatedCoins;
    let end = userCoins;
    let duration = 800;
    let startTime = Date.now();
    function animate() {
      let now = Date.now();
      let progress = Math.min(1, (now - startTime) / duration);
      let value = Math.round(start + (end - start) * progress);
      setAnimatedCoins(value);
      if (progress < 1) requestAnimationFrame(animate);
    }
    animate();
  }, [userCoins]);

  // עדכון מטבעות
  const handleAddCoins = async () => {
    const newCoins = userCoins + 20;
    setUserCoins(newCoins);
    if (currentUser) {
      await updateUserInSupabase(currentUser.id, { coins: newCoins });
    }
  };

  // פונקציה לקבלת האווטר המתאים לשלב
  const getAvatarForStage = (stageNumber: number) => {
    if (stageNumber <= 3) return STAGE_AVATARS.BEGINNER[stageNumber - 1];
    if (stageNumber <= 6) return STAGE_AVATARS.INTERMEDIATE[stageNumber - 4];
    if (stageNumber <= 9) return STAGE_AVATARS.ADVANCED[stageNumber - 7];
    if (stageNumber <= 12) return STAGE_AVATARS.EXPERT[stageNumber - 10];
    if (stageNumber <= 15) return STAGE_AVATARS.MASTER[stageNumber - 13];
    // שלבים מתקדמים - מחזוריות של אווטרים מיוחדים
    return STAGE_AVATARS.LEGENDARY[(stageNumber - 16) % STAGE_AVATARS.LEGENDARY.length];
  };

  // עדכון יצירת מערך השלבים עם מערכת עולמות כמו Candy Crush
  const stages = React.useMemo(() => {
    const tasksCompleted = currentUser?.tasksCompleted || 0;
    console.log('🔄 Creating stages with tasksCompleted:', tasksCompleted, 'forceUpdateKey:', forceUpdateKey);
    
    // חישוב איזה עולמות פתוחים (כל 10 שלבים = עולם)
    const highestCompletedStage = Math.floor(tasksCompleted / 10); // השלב הגבוה ביותר שהושלם
    const currentWorld = Math.floor(highestCompletedStage / 10); // העולם הנוכחי (0, 1, 2...)
    const maxOpenWorld = currentWorld + (highestCompletedStage % 10 === 9 ? 1 : 0); // אם השלב האחרון בעולם הושלם, פתח עולם הבא
    
    console.log('🌍 Highest completed stage:', highestCompletedStage, 'Current world:', currentWorld, 'Max open world:', maxOpenWorld);
    
    const stagesArray = Array.from({ length: totalStages }, (_, i) => {
      const number = i + 1;
      const tasksRequired = number * 10;
      const stageWorld = Math.floor(i / 10); // איזה עולם השלב הזה שייך אליו
      
      let status: 'completed' | 'current' | 'locked';
      let isWorldOpen = stageWorld <= maxOpenWorld; // האם העולם של השלב הזה פתוח
      
      if (!isWorldOpen) {
        // אם העולם לא פתוח, השלב נעול
        status = 'locked';
      } else if (tasksCompleted >= tasksRequired) {
        status = 'completed';
      } else if (tasksCompleted >= i * 10) {
        status = 'current';
      } else {
        status = 'locked';
      }
      
      return {
        number,
        tasksRequired,
        status,
        avatar: getAvatarForStage(number),
        isWorldOpen,
        world: stageWorld + 1 // עולם 1, 2, 3...
      };
    });
    
    console.log('✅ Stages created:', stagesArray.slice(0, 25).map(s => `${s.number}:${s.status}(W${s.world}${s.isWorldOpen ? '' : '-locked'})`));
    return stagesArray;
  }, [currentUser?.tasksCompleted, totalStages, forceUpdateKey]);

  function getStagePosition(index: number) {
    const leftX = horizontalPadding;
    const rightX = width - STAGE_SIZE - horizontalPadding;
    const y = (stages.length - 1 - index) * verticalGap + INITIAL_STAGE_OFFSET;
    const x = index % 2 === 0 ? rightX : leftX;
    return { x, y };
  }

  // באנר מוטיבציוני כאשר שלב נפתח + הודעה מיוחדת לעולם חדש
  const prevStages = React.useRef(stages.map(s => s.status));
  const prevOpenWorlds = React.useRef(stages.filter(s => s.isWorldOpen).map(s => s.world));
  
  React.useEffect(() => {
    const prev = prevStages.current;
    const currentOpenWorlds = stages.filter(s => s.isWorldOpen).map(s => s.world);
    
    // בדיקה אם נפתח עולם חדש
    const newOpenWorlds = currentOpenWorlds.filter(w => !prevOpenWorlds.current.includes(w));
    if (newOpenWorlds.length > 0) {
      const newWorld = Math.max(...newOpenWorlds);
      setMotivationMessage(`🌟 מזל טוב! פתחת עולם חדש - עולם ${newWorld}! 🌟`);
      setShowMotivationBanner(true);
    } else {
      // הודעה רגילה לשלב חדש
      let newlyOpenedStage = -1;
      for (let i = 0; i < stages.length; i++) {
        if ((prev[i] === 'locked') && (stages[i].status !== 'locked')) {
          newlyOpenedStage = i;
          break;
        }
      }
      if (newlyOpenedStage !== -1) {
        const message = MOTIVATION_MESSAGES[newlyOpenedStage] || MOTIVATION_MESSAGES[MOTIVATION_MESSAGES.length - 1];
        setMotivationMessage(message);
        setShowMotivationBanner(true);
      }
    }
    
    if (showMotivationBanner) {
      
      // אנימציית הופעה
      motivationBannerScale.setValue(0);
      motivationBannerOpacity.setValue(0);
      
      Animated.parallel([
        Animated.spring(motivationBannerScale, {
          toValue: 1,
          useNativeDriver: true,
          damping: 15,
          stiffness: 150
        }),
        Animated.timing(motivationBannerOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true
        })
      ]).start();
      
      // אנימציית היעלמות אחרי 4 שניות
      setTimeout(() => {
        Animated.parallel([
          Animated.timing(motivationBannerScale, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true
          }),
          Animated.timing(motivationBannerOpacity, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true
          })
        ]).start(() => {
          setShowMotivationBanner(false);
        });
      }, 4000);
    }
    
    // עדכון הרפרנסים
    prevStages.current = stages.map(s => s.status);
    prevOpenWorlds.current = stages.filter(s => s.isWorldOpen).map(s => s.world);
  }, [stages, showMotivationBanner]);

  // אנימציית אווטאר בין שלבים - מרוככת וחלקה יותר
  React.useEffect(() => {
    const currentIdx = stages.findIndex(s => s.status === 'current');
    if (currentIdx === -1 || currentIdx === stages.length - 1) return;

    const fromPos = getStagePosition(currentIdx);
    const toPos = getStagePosition(currentIdx + 1);
    const fromCenterX = fromPos.x + STAGE_SIZE / 2;
    const fromCenterY = fromPos.y + STAGE_SIZE / 2;
    const toCenterX = toPos.x + STAGE_SIZE / 2;
    const toCenterY = toPos.y + STAGE_SIZE / 2;

    const coinsForPrev = currentIdx * 100;
    const coinsForCurrent = (currentIdx + 1) * 100;
    const progress = Math.max(0, Math.min(1, (userCoins - coinsForPrev) / (coinsForCurrent - coinsForPrev)));

    // אם יש שינוי משמעותי בהתקדמות, מפעילים את אנימציית ההליכה
    if (Math.abs(progress - lastProgress.current) > 0.02) { // הגדלתי את הסף כדי להפחית עדכונים תכופים
      setIsAvatarWalking(true);

      // חישוב נקודת היעד על המסלול
      const targetX = fromCenterX + (toCenterX - fromCenterX) * progress;
      const targetY = fromCenterY + (toCenterY - fromCenterY) * progress + 
                     Math.sin(progress * Math.PI * 2) * 8 * (1 - Math.abs(progress - 0.5));

      // אנימציה חלקה יותר למיקום החדש
      Animated.spring(avatarPosition, {
        toValue: {
          x: targetX - 20,
          y: targetY - 20
        },
        useNativeDriver: true,
        friction: 12, // יותר חלק
        tension: 30, // פחות קפיצי
        restDisplacementThreshold: 0.1,
        restSpeedThreshold: 0.1
      }).start(() => {
        setIsAvatarWalking(false);
      });

      // עדכון סקרול מרוכך וחלק
      const targetScrollY = Math.max(0, targetY - 300);
      
      // השהיה קצרה לפני הסקרול לתחושה טבעית יותר
      setTimeout(() => {
        scrollViewRef.current?.scrollTo({
          y: targetScrollY,
          animated: true
        });
      }, 200);

      lastProgress.current = progress;
    }
  }, [userCoins, stages]);

  // התמקדות אוטומטית בשלב הנוכחי כשהמסך נטען
  useEffect(() => {
    const focusTimeout = setTimeout(() => {
      const currentIdx = stages.findIndex(s => s.status === 'current');
      if (currentIdx !== -1) {
        const { y } = getStagePosition(currentIdx);
        const targetScrollY = Math.max(0, y - 300); // שומר על השלב הנוכחי במרכז המסך
        scrollViewRef.current?.scrollTo({
          y: targetScrollY,
          animated: true
        });
      }
    }, 500);

    return () => clearTimeout(focusTimeout);
  }, [stages]);

  // פונקציה לחישוב נקודה על המסלול הסינוסי
  const getPointOnSinePath = (fromPos: { x: number, y: number }, toPos: { x: number, y: number }, progress: number) => {
    const dx = toPos.x - fromPos.x;
    const dy = toPos.y - fromPos.y;
    const x = fromPos.x + dx * progress;
    const amplitude = 6; // גובה הגל
    const y = fromPos.y + dy * progress + Math.sin(progress * Math.PI * 2) * amplitude;
    return { x, y };
  };

  // פונקציה לחישוב המיקום של השלב הנוכחי
  const getCurrentStagePosition = () => {
    const currentIdx = stages.findIndex(s => s.status === 'current');
    if (currentIdx !== -1) {
      const { y } = getStagePosition(currentIdx);
      return y - 200; // מיקום מעט מעל השלב כדי לראות את הדרך
    }
    return 0;
  };

  // אתחול מיקום האווטר לשלב הנוכחי
  useEffect(() => {
    const currentIdx = stages.findIndex(s => s.status === 'current');
    if (currentIdx !== -1) {
      const currentPos = getStagePosition(currentIdx);
      // מאתחל את האווטר למרכז השלב הנוכחי
      avatarPosition.setValue({
        x: currentPos.x + STAGE_SIZE / 2 - 25, // -25 כדי למרכז את האווטר
        y: currentPos.y + STAGE_SIZE / 2 - 25  // -25 כדי למרכז את האווטר
      });
      console.log('Avatar initialized at stage', currentIdx + 1, 'position:', currentPos);
    }
  }, [stages.length]); // רץ רק כשמספר השלבים משתנה, לא בכל עדכון מטבעות

  // פונקציה להוספת הודעה לתור
  const queueMessage = useCallback((message: string) => {
    setMessageQueue(prev => [...prev, message]);
  }, []);

  // טיפול בהודעות - גישה מפושטת
  useEffect(() => {
    if (showTip) {
      console.log('Starting 2 second timer for message:', avatarMessage);
      const timer = setTimeout(() => {
        console.log('2 seconds passed, hiding message');
        setShowTip(false);
        setAvatarMessage('');
      }, 2000);

      return () => {
        console.log('Cleaning up timer');
        clearTimeout(timer);
      };
    }
  }, [showTip, avatarMessage]);

  // טיפול בתור הודעות
  useEffect(() => {
    if (messageQueue.length > 0 && !showTip) {
      console.log('Showing message from queue:', messageQueue[0]);
      setAvatarMessage(messageQueue[0]);
      setShowTip(true);
      setMessageQueue(prev => prev.slice(1));
    }
  }, [messageQueue, showTip]);

  // עדכון האווטר בהתאם לשלב
  useEffect(() => {
    const currentStage = stages.find(s => s.status === 'current');
    if (currentStage && currentStage.avatar !== currentAvatar) {
      setCurrentAvatar(currentStage.avatar);
      if (currentStage.number > 1) {
        queueMessage(`התפתחתי! ${currentStage.avatar}`);
      }
    }
  }, [stages]);

  // בדיקת מצב המשתמש והצגת טיפים רלוונטיים (מושבת זמנית לבדיקה)
  // useEffect(() => {
  //   const checkUserProgress = () => {
  //     const currentStage = stages.find(s => s.status === 'current');
  //     if (!currentStage) return;

  //     const coinsToNext = currentStage.coins - userCoins;
      
  //     if (coinsToNext <= 20) {
  //       queueMessage(AVATAR_MESSAGES.closeToNextStage);
  //     }
  //     // הסרתי את ההודעה למטבעות נמוכים
  //   };

  //   checkUserProgress();
  // }, [userCoins, stages]);

  // הוספת טיפ יומי בטעינת המסך (מושבת זמנית לבדיקה)
  // useEffect(() => {
  //   const timeout = setTimeout(() => {
  //     queueMessage(AVATAR_MESSAGES.dailyTip);
  //   }, 1000);

  //   return () => clearTimeout(timeout);
  // }, []);

  // פונקציה לטיפול בלחיצה על שלב
  const handleStagePress = (stage: typeof stages[0], index: number) => {
    setSelectedStage(index);
    
    // אנימציית לחיצה
    Animated.sequence([
      Animated.timing(stageScale, {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true
      }),
      Animated.timing(stageScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true
      })
    ]).start();

    // הצגת מידע רלוונטי בהתאם למצב השלב
    if (stage.status === 'locked') {
      queueMessage(`נדרשים ${stage.tasksRequired} מטבעות לפתיחת השלב הזה! 🔒`);
    } else if (stage.status === 'completed') {
      queueMessage('כל הכבוד! השלמת את השלב הזה! 🌟');
    } else {
      const coinsNeeded = stage.tasksRequired - (currentUser?.tasksCompleted || 0);
      queueMessage(`עוד ${coinsNeeded} מטבעות להשלמת השלב! 💪`);
    }

    // אנימציית האווטר לשלב הנבחר - חלקה ומרוככת
    if (stage.status !== 'locked') {
      const stagePos = getStagePosition(index);
      setIsAvatarWalking(true);
      
      // אנימציה חלקה לאווטר
      Animated.spring(avatarPosition, {
        toValue: {
          x: stagePos.x + STAGE_SIZE / 2 - 20,
          y: stagePos.y + STAGE_SIZE / 2 - 20
        },
        friction: 10, // יותר חלק
        tension: 35, // פחות קפיצי
        useNativeDriver: true
      }).start(() => {
        setIsAvatarWalking(false);
        if (stage.status === 'current') {
          queueMessage('אני כאן! בוא נתקדם יחד! 🚀');
        }
      });

      // סקרול חלק לשלב הנבחר
      const targetScrollY = Math.max(0, stagePos.y - 300);
      setTimeout(() => {
        scrollViewRef.current?.scrollTo({
          y: targetScrollY,
          animated: true
        });
      }, 100);
    }
  };

  // בדיקה והוספת שלבים חדשים
  useLayoutEffect(() => {
    const completedStages = stages.filter(s => s.status === 'completed').length;
    const currentStageIndex = stages.findIndex(s => s.status === 'current');
    
    // הוסף שלבים חדשים כאשר המשתמש קרוב לסיום
    if (currentStageIndex >= totalStages - 5) { // כאשר נותרו פחות מ-5 שלבים
      console.log(`הוספת 10 שלבים חדשים! סה"כ שלבים: ${totalStages + 10}`);
    }
    
    if (completedStages !== prevCompletedStagesRef.current) {
      prevCompletedStagesRef.current = completedStages;
    }

    const currentStage = stages.find(s => s.status === 'current');
    if (currentStage && currentStage.avatar !== prevCurrentAvatarRef.current) {
      const newAvatar = currentStage.avatar;
      prevCurrentAvatarRef.current = newAvatar;
      setCurrentAvatar(newAvatar);
      
      if (currentStage.number > 1) {
        queueMessage(`התפתחתי! ${newAvatar}`);
      }
    }
  }, [stages, totalStages, queueMessage]);

  // Update the function that calculates the avatar position
  const TASKS_PER_STAGE = 10;

  function getAvatarPosition(tasksCompleted: number, getStagePosition: (index: number) => {x: number, y: number}) {
    const stageIndex = Math.floor(tasksCompleted / TASKS_PER_STAGE);
    const progressInStage = (tasksCompleted % TASKS_PER_STAGE) / TASKS_PER_STAGE;
    const currentStagePos = getStagePosition(stageIndex);
    const nextStagePos = getStagePosition(stageIndex + 1);
    if (!nextStagePos) return currentStagePos;
    // Linear interpolation between current and next stage
    return {
      x: currentStagePos.x + (nextStagePos.x - currentStagePos.x) * progressInStage,
      y: currentStagePos.y + (nextStagePos.y - currentStagePos.y) * progressInStage,
    };
  }

  // Animated value for progress
  const progressAnim = useRef(new Animated.Value(((currentUser?.tasksCompleted || 0) % 10) / 10)).current;
  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: ((currentUser?.tasksCompleted || 0) % 10) / 10,
      duration: 600,
      useNativeDriver: false,
    }).start();
  }, [currentUser?.tasksCompleted]);

  // Add new function to advance volunteer tasks
  const advanceVolunteerTasks = async () => {
    if (!currentUser) return;
    
    const updatedUser = {
      ...currentUser,
      tasksCompleted: (currentUser.tasksCompleted || 0) + 1,
      coins: (currentUser.coins || 0) + 10
    };
    
    await updateUserInSupabase(updatedUser.id, { 
      taskcompleted: updatedUser.tasksCompleted,
      coins: updatedUser.coins 
    });
    setCurrentUser(updatedUser);
    setUserCoins(updatedUser.coins);
  };

  // Add new function to reset progress
  const resetProgress = async () => {
    try {
      if (currentUser) {
        await updateUserInSupabase(currentUser.id, { taskcompleted: 0 });
        setCurrentUser(prev => prev ? { ...prev, tasksCompleted: 0 } : null);
        setForceUpdateKey(prev => prev + 1);
      }
    } catch (error) {
      console.error('Error resetting progress:', error);
    }
  };

  // פונקציה לאנימציית פתיחת מנעול
  const animateUnlockWorld = (worldId: number) => {
    console.log(`🔓 מתחיל אנימציה לעולם ${worldId}`);
    
    // יצירת אנימציה חדשה
    const newAnimation = new Animated.Value(0);
    setLockAnimations(prev => ({ ...prev, [worldId]: newAnimation }));
    
    // אנימציית פתיחת המנעול
    Animated.sequence([
      // רעידה של המנעול
      Animated.timing(newAnimation, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      // פתיחה
      Animated.timing(newAnimation, {
        toValue: 2,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start(() => {
      console.log(`🎊 מציג קונפטי לעולם ${worldId}`);
      // הצגת קונפטי
      setShowConfetti(prev => ({ ...prev, [worldId]: true }));
      
      // הסתרת קונפטי אחרי 4 שניות
      setTimeout(() => {
        console.log(`🔚 מסתיר קונפטי לעולם ${worldId}`);
        setShowConfetti(prev => ({ ...prev, [worldId]: false }));
      }, 4000);
    });
  };

  // בדיקה לפתיחת עולמות חדשים
  useEffect(() => {
    if (currentUser?.tasksCompleted !== undefined) {
      const tasksCompleted = currentUser.tasksCompleted;
      const highestCompletedStage = Math.floor(tasksCompleted / 10);
      const currentWorld = Math.floor(highestCompletedStage / 10);
      const maxOpenWorld = currentWorld + (highestCompletedStage % 10 === 9 ? 1 : 0);
      
      console.log('🔓 בודק פתיחת עולמות:', {
        tasksCompleted,
        highestCompletedStage,
        currentWorld,
        maxOpenWorld,
        unlockedWorlds: Array.from(unlockedWorlds)
      });
      
      // בדיקה אם נפתח עולם חדש
      for (let world = 1; world <= maxOpenWorld; world++) {
        if (!unlockedWorlds.has(world)) {
          console.log(`🎉 עולם ${world} נפתח לראשונה!`);
          setUnlockedWorlds(prev => new Set([...prev, world]));
          if (world > 1) { // לא מציג אנימציה לעולם הראשון
            animateUnlockWorld(world);
          }
        }
      }
    }
  }, [currentUser?.tasksCompleted, unlockedWorlds]);

  // אנימציה רוטטת למנעולים נעולים
  useEffect(() => {
    const rotateAnimation = Animated.loop(
      Animated.timing(lockRotation, {
        toValue: 1,
        duration: 3000,
        useNativeDriver: true,
      })
    );
    rotateAnimation.start();
    
    return () => rotateAnimation.stop();
  }, []);

  // Loading screen while determining user type - only show if no cached user data
  if (isLoadingUser && !currentUser) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <View style={styles.loadingContent}>
          <Text style={styles.loadingIcon}>🏠</Text>
          <Text style={styles.loadingText}>טוען את הבית שלך...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Admin Home Screen
  if (currentUser?.isAdmin) {
    return (
      <SafeAreaView style={styles.adminContainer}>
        <View style={styles.adminHeader}>
          <Text style={styles.adminHeaderTitle}>פאנל ניהול אדמין</Text>
          <Text style={styles.adminHeaderSubtitle}>שלום, {currentUser.firstName}</Text>
        </View>

        <View style={styles.adminStatsContainer}>
          <View style={styles.adminStatCard}>
            <Text style={styles.adminStatNumber}>{adminEvents.length}</Text>
            <Text style={styles.adminStatLabel}>ההתנדבויות שלי</Text>
          </View>
          <View style={styles.adminStatCard}>
            <Text style={styles.adminStatNumber}>{adminRegistrations.length}</Text>
            <Text style={styles.adminStatLabel}>הרשמות בהתנדבויות שלי</Text>
          </View>
          <View style={styles.adminStatCard}>
            <Text style={styles.adminStatNumber}>
              {adminRegistrations.filter(r => r.status === 'registered').length}
            </Text>
            <Text style={styles.adminStatLabel}>ממתינים לאישור</Text>
          </View>
        </View>

        <View style={styles.adminStatsContainer}>
          {/* Add any additional content you want to display in the admin stats container */}
        </View>



        <View style={styles.adminActionsContainer}>
          <TouchableOpacity 
            style={styles.adminActionButton}
            onPress={async () => {
              await navigationOptimizer.optimizeNavigation('AdminUsers');
              navigation.navigate('AdminUsers' as any, { openCreateForm: true });
            }}
          >
            <Text style={styles.adminActionIcon}>➕</Text>
            <Text style={styles.adminActionText}>צור התנדבות</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.adminActionButton}
            onPress={async () => {
              await navigationOptimizer.optimizeNavigation('AdminUsers');
              navigation.navigate('AdminUsers' as any);
            }}
          >
            <Text style={styles.adminActionIcon}>🔧</Text>
            <Text style={styles.adminActionText}>ניהול התנדבויות</Text>
          </TouchableOpacity>
        </View>

        <ScrollView 
          style={styles.adminEventsContainer}
          contentContainerStyle={styles.adminEventsContentContainer}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          showsVerticalScrollIndicator={false}
          bounces={true}
          scrollEventThrottle={16}
          decelerationRate="normal"
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.adminSectionDivider} />
          <Text style={styles.adminSectionTitle}>ההתנדבויות שלי - לאישור</Text>
          
          {adminEvents.filter(event => {
            const eventDate = new Date(event.date);
            const today = new Date();
            
            // Reset time to start of day for accurate comparison
            eventDate.setHours(0, 0, 0, 0);
            today.setHours(0, 0, 0, 0);
            
            return eventDate < today; // Show only past events for approval (not including today)
          }).length === 0 ? (
            <View style={styles.adminEmptyState}>
              <Text style={styles.adminEmptyStateText}>אין התנדבויות הממתינות לאישור</Text>
            </View>
          ) : adminEvents.filter(event => {
            const eventDate = new Date(event.date);
            const today = new Date();
            
            // Reset time to start of day for accurate comparison
            eventDate.setHours(0, 0, 0, 0);
            today.setHours(0, 0, 0, 0);
            
            return eventDate < today; // Show only past events for approval (not including today)
          }).map(event => {
            const eventRegistrations = adminRegistrations.filter(reg => reg.event_id === event.id);
            const pendingCount = eventRegistrations.filter(reg => reg.status === 'registered').length;
            
            return (
              <View key={event.id} style={styles.adminEventCard}>
                <View style={styles.adminEventInfo}>
                  <Text style={styles.adminEventTitle}>{event.title}</Text>
                  <Text style={styles.adminEventDetails}>
                    📍 {event.location}
                  </Text>
                  <Text style={styles.adminEventDetails}>
                    📅 {new Date(event.date).toLocaleDateString('he-IL')}
                  </Text>
                  <Text style={styles.adminEventDetails}>
                    👥 {pendingCount} משתתפים ממתינים לאישור
                  </Text>
                </View>
                
                <View style={styles.adminEventActions}>
                  <TouchableOpacity
                    style={styles.adminViewParticipantsButton}
                    onPress={() => handleViewParticipants(event.id, event.title)}
                  >
                    <Text style={styles.adminViewParticipantsButtonText}>לרשימת המשתתפים</Text>
                  </TouchableOpacity>
                  
                  {pendingCount > 0 && (
                    <TouchableOpacity
                      style={styles.adminApproveButton}
                      onPress={() => handleCompleteEvent(event.id, event.title)}
                    >
                      <Text style={styles.adminApproveButtonText}>✓ אשר השלמה</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          })}

          <View style={styles.adminSectionDivider} />
          <Text style={styles.adminSectionTitle}>ההתנדבויות שלי - עתידיות</Text>
          
          {(() => {
                         const futureEvents = adminEvents.filter(event => {
               const eventDate = new Date(event.date);
               const today = new Date();
               
               // Reset time to start of day for accurate comparison
               eventDate.setHours(0, 0, 0, 0);
               today.setHours(0, 0, 0, 0);
               
               const isFuture = eventDate >= today; // Include today as "future"

               return isFuture;
             });
            
            return futureEvents.length === 0;
          })() ? (
            <View style={styles.adminEmptyState}>
              <Text style={styles.adminEmptyStateText}>אין התנדבויות עתידיות מתוכננות</Text>
            </View>
          ) : adminEvents.filter(event => {
            const eventDate = new Date(event.date);
            const today = new Date();
            
            // Reset time to start of day for accurate comparison
            eventDate.setHours(0, 0, 0, 0);
            today.setHours(0, 0, 0, 0);
            
            return eventDate >= today; // Include today as "future"
          }).map(event => {
            const eventRegistrations = adminRegistrations.filter(reg => reg.event_id === event.id);
            
            return (
              <View key={event.id} style={styles.adminEventCard}>
                <View style={styles.adminEventInfo}>
                  <Text style={styles.adminEventTitle}>{event.title}</Text>
                  <Text style={styles.adminEventDetails}>
                    📍 {event.location}
                  </Text>
                  <Text style={styles.adminEventDetails}>
                    📅 {new Date(event.date).toLocaleDateString('he-IL')}
                  </Text>
                  <Text style={styles.adminEventDetails}>
                    👥 {event.current_participants}/{event.max_participants} נרשמו
                  </Text>
                </View>
                
                <View style={styles.adminEventActions}>
                  <TouchableOpacity
                    style={styles.adminViewParticipantsButton}
                    onPress={() => handleViewParticipants(event.id, event.title)}
                  >
                    <Text style={styles.adminViewParticipantsButtonText}>לרשימת המשתתפים</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={styles.adminEditButton}
                    onPress={() => navigation.navigate('AdminUsers' as any)}
                  >
                    <Text style={styles.adminEditButtonText}>✏️ ערוך</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </ScrollView>

        {/* Bottom Navigation for Admin */}
        <SafeAreaView style={styles.adminBottomNav} edges={['bottom']}>
          <View style={styles.adminBottomNavContent}>
            <TouchableOpacity style={styles.adminNavButton} onPress={async () => {
              await navigationOptimizer.optimizeNavigation('AdminUsers');
              navigation.navigate('AdminUsers' as any);
            }}>
              <Text style={styles.adminNavIcon}>🔧</Text>
              <Text style={styles.adminNavText}>ניהול התנדבויות</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={[styles.adminNavButton, styles.adminNavButtonActive]}>
              <View style={styles.adminActiveIconBackground}>
                <Text style={styles.adminNavIconActive}>🏠</Text>
              </View>
              <Text style={styles.adminNavTextActive}>בית</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.adminNavButton} onPress={async () => {
              await navigationOptimizer.optimizeNavigation('Volunteer');
              navigation.navigate('Volunteer', { from: 'Home' });
            }}>
              <Text style={styles.adminNavIcon}>🤝</Text>
              <Text style={styles.adminNavText}>התנדבויות</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>

        {/* Participants List - Bottom Sheet (outside SafeAreaView) */}
        {showParticipantsList && (
          <View style={styles.participantsBottomSheet}>
            <View style={styles.participantsBottomSheetHeader}>
              <Text style={styles.participantsBottomSheetTitle}>
                רשימת משתתפים - {selectedEventForParticipants?.title}
              </Text>
              <TouchableOpacity
                style={styles.participantsBottomSheetCloseButton}
                onPress={() => setShowParticipantsList(false)}
              >
                <Text style={styles.participantsBottomSheetCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.participantsBottomSheetContent}>
              {eventParticipants.length === 0 ? (
                <View style={styles.emptyParticipantsList}>
                  <Text style={styles.emptyParticipantsText}>
                    📋 אין משתתפים רשומים
                  </Text>
                  <Text style={styles.emptyParticipantsSubtext}>
                    כשמשתתפים ירשמו להתנדבות זו,{'\n'}הם יופיעו כאן לאישור או דחייה
                  </Text>
                </View>
              ) : (
                eventParticipants.map((participant, index) => {
                  const decision = participantDecisions[participant.user_id];

                  return (
                    <View key={participant.user_id} style={styles.participantRowCard}>
                      <View style={styles.participantRowInfo}>
                        <Text style={styles.participantRowName}>
                          {index + 1}. {participant.users?.firstname} {participant.users?.lastname}
                        </Text>
                        <Text style={styles.participantRowStatus}>
                          סטטוס: {participant.status === 'registered' ? 'רשום' : 
                                  participant.status === 'completed' ? 'הושלם' : 'בוטל'}
                        </Text>
                        <Text style={styles.participantRowDate}>
                          נרשם: {new Date(participant.registered_at).toLocaleDateString('he-IL')}
                        </Text>
                      </View>
                      
                      <View style={styles.participantRowActions}>
                        <TouchableOpacity
                          style={[
                            styles.quickActionButton,
                            styles.approveQuickButton,
                            decision === 'approved' && styles.selectedApproveQuick
                          ]}
                          onPress={() => handleParticipantDecision(participant.user_id, 'approved')}
                        >
                          <Text style={[
                            styles.quickActionIcon,
                            decision === 'approved' && { color: '#fff' }
                          ]}>✓</Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity
                          style={[
                            styles.quickActionButton,
                            styles.rejectQuickButton,
                            decision === 'rejected' && styles.selectedRejectQuick
                          ]}
                          onPress={() => handleParticipantDecision(participant.user_id, 'rejected')}
                        >
                          <Text style={[
                            styles.quickActionIcon,
                            decision === 'rejected' && { color: '#fff' }
                          ]}>✗</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                }))}
            </ScrollView>

            <View style={styles.participantsBottomSheetFooter}>
              <TouchableOpacity
                style={styles.submitDecisionsButton}
                onPress={submitParticipantDecisions}
              >
                <Text style={styles.submitDecisionsButtonText}>✕ סגור רשימה</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </SafeAreaView>
    );
  }

  return (
    <View key={`homescreen-${forceUpdateKey}`} style={styles.wrapper}>
      {/* באנר עליון בצבע בז' */}
      <View style={styles.topBanner}>
        <View style={styles.topBannerContent}>
          <View style={styles.userSection}>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>
                {`שלום, ${(currentUser?.firstName || '') + (currentUser?.lastName ? ' ' + currentUser.lastName : '') || 'משתמש'}`}
              </Text>
            </View>
            <Image
              source={{ uri: currentUser?.profileImage || 'https://via.placeholder.com/50' }}
              style={styles.profileImage}
            />
          </View>
          
          <View style={styles.statsSection}>
            <View style={styles.statItem}>
              <Text style={styles.statIcon}>🤝</Text>
              <Text style={styles.statValue}>{currentUser?.tasksCompleted || 0}</Text>
              <Text style={styles.statLabel}>התנדבויות</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statIcon}>🪙</Text>
              <Text style={styles.statValue}>{currentUser?.coins || 0}</Text>
              <Text style={styles.statLabel}>מטבעות</Text>
            </View>
          </View>

          {/* פס התקדמות */}
          <View style={styles.progressSection}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${((currentUser?.tasksCompleted || 0) % 10) * 10}%` }]} />
            </View>
            <Text style={styles.progressText}>
              {((currentUser?.tasksCompleted || 0) % 10)}/10 התנדבויות לשלב הבא
            </Text>
          </View>

          {/* כפתור אדמין */}
          {currentUser?.isAdmin && (
            <TouchableOpacity 
              style={styles.adminButton} 
              onPress={() => navigation.navigate('AdminUsers' as any)}
            >
              <Text style={styles.adminButtonText}>🔧 ניהול התנדבויות</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        removeClippedSubviews={true}
        keyboardShouldPersistTaps="handled"
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <View style={styles.stagesContainer}>
          {(() => {
            console.log('🎨 Drawing paths for', stages.length, 'stages');
            // צייר שביל רק בעולמות פתוחים
            const openStages = stages.filter(s => s.isWorldOpen);
            const pathsToShow = Math.max(0, openStages.length - 1);
            console.log('🎨 Open stages:', openStages.length, 'Will draw', pathsToShow, 'paths');
            
            return Array.from({ length: pathsToShow }, (_, pathIndex) => {
              // מצא את האינדקס האמיתי של השלבים הפתוחים
              const openStageIndices = stages.map((s, i) => s.isWorldOpen ? i : -1).filter(i => i !== -1);
              const i = openStageIndices[pathIndex];
              if (i === undefined || i >= stages.length - 1) return null;
            const from = getStagePosition(i);
            const to = getStagePosition(i + 1);
            console.log(`🎨 Drawing path ${i} from stage ${i+1} to ${i+2}:`, from, '->', to);
          const fromCenterX = from.x + STAGE_SIZE / 2;
          const fromCenterY = from.y + STAGE_SIZE / 2;
          const toCenterX = to.x + STAGE_SIZE / 2;
          const toCenterY = to.y + STAGE_SIZE / 2;
          const dx = toCenterX - fromCenterX;
          const dy = toCenterY - fromCenterY;
          const norm = Math.sqrt(dx * dx + dy * dy);
          const ux = dx / norm;
          const uy = dy / norm;
          const r = STAGE_SIZE / 2;
          const startX = fromCenterX + ux * r;
          const startY = fromCenterY + uy * r;
          const endX = toCenterX - ux * r;
          const endY = toCenterY - uy * r;
          const newDx = endX - startX;
          const newDy = endY - startY;
          const points = 32;
          let path = `M ${startX} ${startY}`;
          for (let j = 1; j <= points; j++) {
            const t = j / points;
            const x = startX + newDx * t;
            const amplitude = 6;
            const y = startY + newDy * t + Math.sin(t * Math.PI * 2) * amplitude;
            path += ` L ${x} ${y}`;
          }
          // בחירת צבע ושקיפות לפי סטטוס השלבים
          const fromStage = stages[i];
          const toStage = stages[i + 1];
          const isPathActive = fromStage.status !== 'locked' || toStage.status !== 'locked';
          const pathColor = isPathActive ? "#B8860B" : "#CCCCCC";
          const pathOpacity = isPathActive ? 0.7 : 0.4;
          
          return (
            <Svg
              key={`sinpath-${i}-${forceUpdateKey}`}
              style={{ position: 'absolute', left: 0, top: 0, zIndex: 1 }}
              width={width}
              height={stages.length * verticalGap + 120}
              pointerEvents="none"
            >
              <Path
                d={path}
                stroke={pathColor}
                strokeWidth={3}
                fill="none"
                opacity={pathOpacity}
                strokeDasharray="8 6"
              />
            </Svg>
          );
        });
        })()}

        {/* רקע יפה ומעוצב לעולמות נעולים */}
        {Array.from({ length: Math.ceil(totalStages / 10) }, (_, worldIndex) => {
          const world = worldIndex + 1;
          const isWorldOpen = stages.some(s => s.world === world && s.isWorldOpen);
          
          if (isWorldOpen) return null; // לא מציג רקע לעולמות פתוחים
          
          // חישוב גבולות העולם הנעול
          const worldStartStage = worldIndex * 10;
          const worldEndStage = Math.min((worldIndex + 1) * 10 - 1, totalStages - 1);
          
          const startPos = getStagePosition(worldStartStage);
          const endPos = getStagePosition(worldEndStage);
          
          const minX = Math.min(startPos.x, endPos.x) - 40;
          const maxX = Math.max(startPos.x, endPos.x) + STAGE_SIZE + 40;
          const minY = Math.min(startPos.y, endPos.y) - 50;
          const maxY = Math.max(startPos.y, endPos.y) + STAGE_SIZE + 80;
          
          // צבעי אפור אלגנטיים לעולמות נעולים
          const colorScheme = {
            bg: 'rgba(156, 163, 175, 0.15)', // אפור בהיר
            border: 'rgba(156, 163, 175, 0.3)', // אפור בינוני
            accent: '#6B7280' // אפור כהה
          };
          
          return (
            <View
              key={`world-bg-${world}`}
              style={{
                position: 'absolute',
                left: minX,
                top: minY,
                width: maxX - minX,
                height: maxY - minY,
                backgroundColor: colorScheme.bg,
                borderRadius: 25,
                borderWidth: 3,
                borderColor: colorScheme.border,
                borderStyle: 'dashed',
                zIndex: 0,
                shadowColor: '#000',
                shadowOpacity: 0.1,
                shadowRadius: 8,
                shadowOffset: { width: 0, height: 4 }
              }}
            >
              {/* מנעול מונפש במרכז */}
              <View style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: [
                  { translateX: -30 },
                  { translateY: -30 }
                ],
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Animated.View style={{
                  transform: [
                    {
                      scale: lockAnimations[world] ? lockAnimations[world].interpolate({
                        inputRange: [0, 1, 2],
                        outputRange: [1, 1.2, 0.8]
                      }) : 1
                    },
                    {
                      rotate: lockAnimations[world] ? lockAnimations[world].interpolate({
                        inputRange: [0, 1, 2],
                        outputRange: ['0deg', '10deg', '180deg']
                      }) : lockRotation.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0deg', '10deg']
                      })
                    }
                  ],
                  opacity: lockAnimations[world] ? lockAnimations[world].interpolate({
                    inputRange: [0, 1, 2],
                    outputRange: [1, 1, 0]
                  }) : 1
                }}>
                  <Text style={{ fontSize: 40, textShadowColor: '#000', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 2 }}>
                    🔒
                  </Text>
                </Animated.View>
                
                {/* מנעול פתוח */}
                {lockAnimations[world] && (
                  <Animated.View style={{
                    position: 'absolute',
                    transform: [{
                      scale: lockAnimations[world].interpolate({
                        inputRange: [0, 1, 2],
                        outputRange: [0, 0, 1.2]
                      })
                    }],
                    opacity: lockAnimations[world].interpolate({
                      inputRange: [0, 1, 2],
                      outputRange: [0, 0, 1]
                    })
                  }}>
                    <Text style={{ fontSize: 40, textShadowColor: '#000', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 2 }}>
                      🔓
                    </Text>
                  </Animated.View>
                )}
              </View>

              {/* קונפטי */}
              {showConfetti[world] && (
                <View style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  alignItems: 'center',
                  justifyContent: 'center',
                  pointerEvents: 'none'
                }}>
                  {/* קונפטי מונפש */}
                  {Array.from({ length: 8 }, (_, i) => (
                    <Animated.Text
                      key={i}
                      style={{
                        position: 'absolute',
                        fontSize: 20,
                        transform: [
                          { translateX: (Math.random() - 0.5) * 200 },
                          { translateY: (Math.random() - 0.5) * 200 }
                        ]
                      }}
                    >
                      {['🎉', '🎊', '✨', '🌟', '💫', '⭐', '🎆', '🎈'][i]}
                    </Animated.Text>
                  ))}
                  
                  {/* הודעת חגיגה */}
                  <View style={{
                    backgroundColor: 'rgba(255, 215, 0, 0.9)',
                    paddingHorizontal: 20,
                    paddingVertical: 10,
                    borderRadius: 20,
                    borderWidth: 2,
                    borderColor: '#FFD700',
                    shadowColor: '#FFD700',
                    shadowOpacity: 0.5,
                    shadowRadius: 10,
                    shadowOffset: { width: 0, height: 0 }
                  }}>
                    <Text style={{
                      color: '#8B4513',
                      fontSize: 16,
                      fontWeight: 'bold',
                      textAlign: 'center'
                    }}>
                      🎉 עולם {world} נפתח! 🎉
                    </Text>
                  </View>
                </View>
              )}

              {/* כותרת העולם */}
              <View style={{
                position: 'absolute',
                top: 15,
                left: 0,
                right: 0,
                alignItems: 'center'
              }}>
                <View style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  paddingHorizontal: 20,
                  paddingVertical: 8,
                  borderRadius: 20,
                  borderWidth: 2,
                  borderColor: colorScheme.accent,
                  shadowColor: colorScheme.accent,
                  shadowOpacity: 0.3,
                  shadowRadius: 4,
                  shadowOffset: { width: 0, height: 2 }
                }}>
                  <Text style={{
                    color: colorScheme.accent,
                    fontSize: 16,
                    fontWeight: 'bold',
                    textAlign: 'center'
                  }}>
                    ✨ עולם {world} ✨
                  </Text>
                </View>
              </View>

              {/* הודעת פתיחה */}
              <View style={{
                position: 'absolute',
                bottom: 15,
                left: 20,
                right: 20,
                alignItems: 'center'
              }}>
                <View style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                  paddingHorizontal: 16,
                  paddingVertical: 6,
                  borderRadius: 15,
                  borderWidth: 1,
                  borderColor: colorScheme.border
                }}>
                  <Text style={{
                    color: '#666',
                    fontSize: 12,
                    fontWeight: '600',
                    textAlign: 'center'
                  }}>
                    {world === 2 ? 
                      `השלם שלב 10 לפתיחה! 🎯` : 
                      `השלם שלב ${(world - 1) * 10} לפתיחה! 🎯`
                    }
                  </Text>
                </View>
              </View>

              {/* אפקט כוכבים מעופף */}
              <View style={{
                position: 'absolute',
                top: 5,
                right: 10,
                opacity: 0.6
              }}>
                <Text style={{ fontSize: 20 }}>⭐</Text>
              </View>
              <View style={{
                position: 'absolute',
                top: 25,
                left: 15,
                opacity: 0.4
              }}>
                <Text style={{ fontSize: 16 }}>✨</Text>
              </View>
              <View style={{
                position: 'absolute',
                bottom: 35,
                right: 20,
                opacity: 0.5
              }}>
                <Text style={{ fontSize: 18 }}>🌟</Text>
              </View>
            </View>
          );
        })}

        {stages.map((stage, i) => {
          const { x, y } = getStagePosition(i);
          const isSelected = selectedStage === i;

          return (
            <React.Fragment key={`stage-${i}-${forceUpdateKey}`}>
              <TouchableOpacity
                onPress={() => handleStagePress(stage, i)}
                style={[
                  styles.stage,
                  {
                    left: x,
                    top: y,
                    width: STAGE_SIZE,
                    height: STAGE_SIZE,
                    borderRadius: STAGE_SIZE / 2,
                    backgroundColor: !stage.isWorldOpen ? '#888' : stage.status === 'locked' ? '#aaa' : stage.status === 'current' ? '#f1c40f' : '#2ecc71',
                    borderWidth: isSelected ? 2 : 0,
                    borderColor: isSelected ? '#f1c40f' : 'transparent',
                    elevation: 0,
                    shadowOpacity: 0,
                    shadowRadius: 0,
                    shadowOffset: { width: 0, height: 0 },
                    transform: [
                      { scale: isSelected ? stageScale : 1 }
                    ],
                    opacity: !stage.isWorldOpen ? 0.5 : 1 // עמעום לעולמות נעולים
                  }
                ]}
              >
                {!stage.isWorldOpen ? (
                  <View style={{ alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={[styles.lockText, { fontSize: 24, opacity: 0.8 }]}>✨</Text>
                  </View>
                ) : stage.status === 'locked' ? (
                  <Text style={styles.lockText}>🔒</Text>
                ) : (
                  <Text style={styles.starText}>★</Text>
                )}
                <Text style={[
                  styles.stageNumber, 
                  { 
                    opacity: !stage.isWorldOpen ? 0.8 : 1,
                    color: !stage.isWorldOpen ? '#888' : undefined,
                    fontWeight: !stage.isWorldOpen ? '600' : 'bold'
                  }
                ]}>
                  {stage.number}
                </Text>
              </TouchableOpacity>
              {/* כמות מטבעות מתחת לשלבים */}
              <View style={{
                position: 'absolute',
                left: x + STAGE_SIZE / 2 - 60,
                top: y + STAGE_SIZE + 2,
                width: 120,
                alignItems: 'center'
              }}>
                <View style={{
                  backgroundColor: !stage.isWorldOpen ? 
                    'rgba(255, 255, 255, 0.9)' : 
                    stage.status === 'locked' ? '#444' : 
                    stage.status === 'current' ? '#f1c40f' : '#2ecc71',
                  borderRadius: !stage.isWorldOpen ? 12 : 8,
                  paddingHorizontal: !stage.isWorldOpen ? 16 : 24,
                  paddingVertical: !stage.isWorldOpen ? 4 : 2,
                  shadowColor: '#000',
                  shadowOpacity: 0.12,
                  shadowRadius: 2,
                  shadowOffset: { width: 0, height: 1 },
                  borderWidth: !stage.isWorldOpen ? 1 : 0,
                  borderColor: !stage.isWorldOpen ? 'rgba(136, 136, 136, 0.3)' : 'transparent'
                }}>
                  <Text style={{
                    color: !stage.isWorldOpen ? '#666' : 'white',
                    fontWeight: !stage.isWorldOpen ? '600' : 'bold',
                    fontSize: !stage.isWorldOpen ? 10 : 11,
                    textAlign: 'center'
                  }}>
                    {!stage.isWorldOpen ? `✨ עולם ${stage.world}` : `${i * 10} התנדבויות`}
                  </Text>
                </View>
              </View>
            </React.Fragment>
          );
        })}

        {/* אווטר מונפש */}
        {(() => {
          const currentIdx = stages.findIndex(s => s.status === 'current');
          if (currentIdx === -1) return null;

          const avatarPos = getAvatarPosition(currentUser?.tasksCompleted || 0, getStagePosition);

          return (
            <Animated.View
              style={[
                styles.avatar,
                {
                  left: avatarPos.x,
                  top: avatarPos.y,
                },
              ]}
            >
              <Text style={styles.avatarEmoji}>{currentAvatar}</Text>
            </Animated.View>
          );
        })()}
      </View>
    </ScrollView>

    {/* באנר תחתון */}
    <SafeAreaView style={styles.bottomBannerContainer} edges={['bottom']}>
      <View style={styles.bottomBanner}>
        <TouchableOpacity 
          style={styles.bannerIconWrap}
          onPress={() => navigation.navigate('Volunteer', { from: 'Home' })}
        >
          <Image 
            source={require('../../assets/images/volunteer.png')}
            style={styles.bannerIcon}
          />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.bannerIconWrap}
          onPress={() => navigation.navigate('Calendar')}
        >
          <Image 
            source={require('../../assets/images/calander.png')}
            style={styles.bannerIcon}
          />
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.bannerIconWrap, styles.activeIconWrap]}
        >
          <View style={styles.activeIconBackground}>
            <Image 
              source={require('../../assets/images/home.png')}
              style={styles.bannerIcon}
            />
          </View>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.bannerIconWrap}
          onPress={() => navigation.navigate('Gift')}
        >
          <Image 
            source={require('../../assets/images/gift.png')}
            style={styles.bannerIcon}
          />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.bannerIconWrap}
          onPress={() => navigation.navigate('Trophy')}
        >
          <Image 
            source={require('../../assets/images/trophy.png')}
            style={styles.bannerIcon}
          />
        </TouchableOpacity>
      </View>
    </SafeAreaView>

    {/* הודעות אווטר */}
    {showTip && (
      <View 
        style={[
          styles.avatarMessage,
          {
            position: 'absolute',
            top: 0,
            left: 20,
            right: 20,
            zIndex: 1000,
          }
        ]}
      >
        <Text style={styles.messageText}>{avatarMessage}</Text>
      </View>
    )}
  </View>
);
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: '#FEF6DA',
    direction: 'rtl',
  },
  scrollView: {
    flex: 1,
    marginTop: 30, // הקטנת המרווח מ-60 ל-30
  },
  contentContainer: {
    paddingBottom: BOTTOM_BANNER_HEIGHT + BOTTOM_PADDING,
    minHeight: verticalGap * totalStages + BOTTOM_PADDING + INITIAL_STAGE_OFFSET,
  },
  stagesContainer: {
    flex: 1,
    position: 'relative',
  },

  bottomBannerContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#D7D2B6',
    borderTopLeftRadius: 34,
    borderTopRightRadius: 34,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: -2 },
    elevation: 8,
    zIndex: 9999, // עוד יותר גבוה
    pointerEvents: 'box-none', // מאפשר אינטראקציה עם הילדים
  },
  bottomBanner: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 85,
    backgroundColor: '#D7D2B6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingBottom: 12,
    borderTopLeftRadius: 34,
    borderTopRightRadius: 34,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 9999, // עוד יותר גבוה
    pointerEvents: 'auto', // תמיד פעיל
  },
  bannerIconWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    paddingTop: 10,
  },
  activeIconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeIconBackground: {
    backgroundColor: 'white',
    borderRadius: 50,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  bannerIcon: {
    width: 32,
    height: 32,
    resizeMode: 'contain',
  },
  stage: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#aaa',
    transform: [{ scale: 1 }],
  },
  starText: {
    fontSize: 26,
    color: 'white',
    position: 'absolute',
    top: 13,
    left: 0,
    right: 0,
    textAlign: 'center',
  },
  stageNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    position: 'absolute',
    bottom: 9,
    left: 0,
    right: 0,
    textAlign: 'center',
  },
  lockText: {
    fontSize: 26,
    color: 'white',
  },
  avatarMessage: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 8,
    alignItems: 'center',
    marginHorizontal: 16,
  },
  messageText: {
    fontSize: 18,
    color: '#2D3748',
    textAlign: 'center',
    fontWeight: '600',
  },
  avatarContainer: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatar: {
    width: 54,
    height: 54,
    position: 'absolute',
    zIndex: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: 27,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  motivationBannerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 2000,
  },
  motivationBanner: {
    width: '85%',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 15,
  },
  motivationBannerContent: {
    backgroundColor: '#4CAF50',
    paddingVertical: 30,
    paddingHorizontal: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  motivationBannerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 15,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  motivationBannerMessage: {
    fontSize: 20,
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 28,
    marginBottom: 20,
    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  motivationBannerEmojis: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  motivationBannerEmoji: {
    fontSize: 32,
    textAlign: 'center',
  },
  motivationProgressBanner: {
    backgroundColor: '#D1FAE5', // lighter green
    borderRadius: 20,
    marginHorizontal: 24,
    marginTop: 12,
    marginBottom: 8,
    paddingVertical: 18,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  motivationProgressIcon: {
    fontSize: 28,
    marginBottom: 2,
  },
  motivationProgressText: {
    color: '#065F46',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 4,
  },



  avatarEmoji: {
    fontSize: 40,
    textAlign: 'center',
  },

  adminContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  adminHeader: {
    width: '100%',
    backgroundColor: '#fff',
    paddingTop: 40,
    paddingBottom: 20,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    alignItems: 'center',
  },
  adminHeaderTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 6,
  },
  adminHeaderSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    textAlign: 'center',
  },
  adminStatsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 25,
    paddingHorizontal: 15,
  },
  adminStatCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.12,
    shadowRadius: 5,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  adminStatNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 8,
  },
  adminStatLabel: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
    fontWeight: '500',
  },
  adminActionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
    paddingHorizontal: 15,
  },
  adminActionButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 6,
  },
  adminActionIcon: {
    fontSize: 28,
    marginBottom: 10,
  },
  adminActionText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
  adminEventsContainer: {
    flex: 1,
    paddingHorizontal: 15,
  },
  adminEventsContentContainer: {
    paddingBottom: 120,
    flexGrow: 1,
  },
  adminSectionDivider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 10,
    marginVertical: 25,
  },
  adminSectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    marginTop: 10,
    textAlign: 'right',
    paddingHorizontal: 5,
  },
  adminEmptyState: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 25,
    alignItems: 'center',
    marginHorizontal: 5,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  adminEmptyStateText: {
    fontSize: 16,
    color: '#6c757d',
    textAlign: 'center',
    fontWeight: '500',
  },
  adminEventCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  adminEventInfo: {
    marginBottom: 15,
  },
  adminEventTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'right',
  },
  adminEventDetails: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
    textAlign: 'right',
    lineHeight: 20,
  },
  adminApproveButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginLeft: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  adminApproveButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  adminEventActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 10,
  },
  adminEditButton: {
    backgroundColor: '#FF9800',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  adminEditButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  adminBottomNav: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: -3 },
    elevation: 10,
    zIndex: 1000,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  adminBottomNavContent: {
    height: 85,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingBottom: 12,
  },
  adminNavButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    paddingTop: 10,
  },
  adminNavButtonActive: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  adminActiveIconBackground: {
    backgroundColor: 'white',
    borderRadius: 50,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  adminNavIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  adminNavIconActive: {
    fontSize: 24,
  },
  adminNavText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
  },
  adminNavTextActive: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 4,
  },
  // Participant management styles
  adminViewParticipantsButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginRight: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  adminViewParticipantsButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  // Participants Bottom Sheet styles
  participantsBottomSheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '70%',
    backgroundColor: '#f8fafc',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 999,
    zIndex: 999,
  },
  participantsBottomSheetHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 25,
    borderBottomWidth: 2,
    borderBottomColor: '#e2e8f0',
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
  },
  participantsBottomSheetTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    flex: 1,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  participantsBottomSheetCloseButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  participantsBottomSheetCloseText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#64748b',
  },
  participantsBottomSheetContent: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f8fafc',
    direction: 'rtl',
  },
  participantsBottomSheetFooter: {
    padding: 25,
    borderTopWidth: 2,
    borderTopColor: '#e2e8f0',
    backgroundColor: '#ffffff',
  },
  participantRowCard: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 18,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    marginBottom: 15,
    marginLeft: 10,
    marginRight: 30,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#64748b',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    alignSelf: 'center',
    maxWidth: '90%',
  },
  participantRowInfo: {
    flex: 1,
    alignItems: 'flex-start',
    paddingLeft: 16,
    paddingRight: 32,
  },
  participantRowName: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
    textAlign: 'left',
  },
  participantRowStatus: {
    fontSize: 12,
    color: '#888',
    marginBottom: 2,
    textAlign: 'left',
  },
  participantRowDate: {
    fontSize: 12,
    color: '#888',
    textAlign: 'left',
  },
  participantRowEmail: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  participantRowActions: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 16,
    gap: 8,
  },
  quickActionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  approveQuickButton: {
    backgroundColor: '#ffffff',
    borderColor: '#10b981',
  },
  rejectQuickButton: {
    backgroundColor: '#ffffff',
    borderColor: '#ef4444',
  },
  selectedApproveQuick: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  selectedRejectQuick: {
    backgroundColor: '#ef4444',
    borderColor: '#ef4444',
  },
  quickActionIcon: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#475569',
  },
  submitDecisionsButton: {
    backgroundColor: '#6366f1',
    paddingVertical: 18,
    paddingHorizontal: 35,
    borderRadius: 14,
    alignItems: 'center',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  submitDecisionsButtonText: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: 'bold',
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  emptyParticipantsList: {
    padding: 50,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
  },
  emptyParticipantsText: {
    fontSize: 18,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 10,
    fontWeight: '600',
    writingDirection: 'rtl',
  },
  emptyParticipantsSubtext: {
    fontSize: 15,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 22,
    writingDirection: 'rtl',
  },
  participantCard: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#64748b',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  participantNumberContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 16,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  participantNumber: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: 'bold',
  },
  participantInfo: {
    flex: 1,
    alignItems: 'flex-end',
  },
  participantName: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 6,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  participantEmail: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 6,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  participantStatusContainer: {
    alignSelf: 'flex-start',
  },
  participantStatus: {
    fontSize: 12,
    fontWeight: 'bold',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  participantActions: {
    flexDirection: 'column',
    gap: 8,
  },
  actionButton: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 12,
    minWidth: 130,
    alignItems: 'center',
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  approveActionButton: {
    backgroundColor: '#ffffff',
    borderColor: '#10b981',
  },
  rejectActionButton: {
    backgroundColor: '#ffffff',
    borderColor: '#ef4444',
  },
  selectedApprove: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  selectedReject: {
    backgroundColor: '#ef4444',
    borderColor: '#ef4444',
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#475569',
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  // Keep old styles for backward compatibility
  decisionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },
  approveButton: {
    backgroundColor: '#fff',
    borderColor: '#4CAF50',
  },
  rejectButton: {
    backgroundColor: '#fff',
    borderColor: '#f44336',
  },
  decisionButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
  },
  selectedButtonText: {
    color: '#fff',
  },

  submitButton: {
    backgroundColor: '#34D399',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
    submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  
  // באנר עליון בצבע בז'
  topBanner: {
    backgroundColor: '#FEF6DA', // אותו צבע כמו הרקע
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 2,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  topBannerContent: {
    alignItems: 'center',
  },
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    width: '100%',
  },
  profileImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginLeft: 15,
    borderWidth: 2,
    borderColor: '#D4AF37',
  },
  userInfo: {
    flex: 1,
    alignItems: 'flex-start',
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#8B4513',
    marginBottom: 5,
    marginTop: 15,
    textAlign: 'left',
  },
  userLevel: {
    fontSize: 16,
    color: '#D4AF37',
    fontWeight: '600',
    textAlign: 'left',
  },
  statsSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 15,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statIcon: {
    fontSize: 24,
    marginBottom: 5,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#8B4513',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: '#8B4513',
    opacity: 0.8,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(139, 69, 19, 0.3)',
    marginHorizontal: 20,
  },
  progressSection: {
    width: '100%',
    marginBottom: 10,
  },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderRadius: 4,
    marginBottom: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#D3D3D3',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#D4AF37',
    borderRadius: 4,
  },
  progressText: {
    textAlign: 'center',
    fontSize: 14,
    color: '#8B4513',
    fontWeight: '600',
  },
  adminButton: {
    backgroundColor: '#D4AF37',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 10,
  },
  adminButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  
  // Loading screen styles
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FEF6DA',
  },
  loadingContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingIcon: {
    fontSize: 50,
    marginBottom: 20,
  },
  loadingText: {
    fontSize: 18,
    color: '#8B4513',
    fontWeight: 'bold',
  },
 
  });