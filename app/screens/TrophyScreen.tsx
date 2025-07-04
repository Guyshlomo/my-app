import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Dimensions,
  Image,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import ConfettiCannon from 'react-native-confetti-cannon';
import { getAllUsersFromSupabase, getCurrentUserFromSupabase } from '../db/supabaseApi';
import { User } from '../types/types';
import { addCoinsUpdateListener, addTasksCompletedListener, removeCoinsUpdateListener, removeTasksCompletedListener } from '../utils/eventEmitter';

const { width } = Dimensions.get('window');

type RootStackParamList = {
  Home: undefined;
  Trophy: undefined;
  Gift: undefined;
  Volunteer: { from: 'Home' | 'Trophy' };
  Calendar: undefined;
  Login: undefined;
  Signup: undefined;
};

type NavigationProp = StackNavigationProp<RootStackParamList>;

type UserWithTasks = User & { tasksCompleted?: number };

// קומפוננט ממוטב לכרטיס משתמש
const UserCard = React.memo(({ user, index, isCurrentUser, responsiveFontSize }: {
  user: UserWithTasks;
  index: number;
  isCurrentUser: boolean;
  responsiveFontSize: (size: number) => number;
}) => (
  <View>
    <TouchableOpacity
      style={[
        styles.userCard,
        index === 0 && styles.firstPlace,
        index === 1 && styles.secondPlace,
        index === 2 && styles.thirdPlace,
        isCurrentUser && styles.currentUser,
      ]}
    >
      <View style={styles.userInfo}>
        {user.profileImage ? (
          <Image source={{ uri: user.profileImage }} style={styles.profileImage} />
        ) : user.avatar_seed && user.avatar_style ? (
          <Image source={{ uri: `https://api.dicebear.com/7.x/${user.avatar_style}/png?seed=${user.avatar_seed}` }} style={styles.profileImage} />
        ) : (
          <View style={styles.defaultAvatar}>
            <Text style={styles.avatarText}>?</Text>
          </View>
        )}
        <View style={styles.userDetails}>
          <Text style={[styles.userName, { flex: 1, textAlign: 'right', fontSize: responsiveFontSize(16) }]}>{`${user.firstName} ${user.lastName}`}</Text>
          <Text style={[styles.userStats, { flex: 1, textAlign: 'right', fontSize: responsiveFontSize(14) }]}>{`${user.tasksCompleted || 0} התנדבויות`}</Text>
        </View>
      </View>
      <View style={styles.rankContainer}>
        {index === 0 && <Text style={styles.rankCrown}>👑</Text>}
        {index === 1 && <Text style={styles.rankCrown}>🥈</Text>}
        {index === 2 && <Text style={styles.rankCrown}>🥉</Text>}
        <Text style={[
          styles.rankNumber,
          index === 0 && styles.firstPlaceText,
          index === 1 && styles.secondPlaceText,
          index === 2 && styles.thirdPlaceText,
        ]}>
          {index + 1}
        </Text>
      </View>
    </TouchableOpacity>
  </View>
));

export default function TrophyScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [currentUser, setCurrentUser] = useState<UserWithTasks | null>(null);
  const [allUsers, setAllUsers] = useState<UserWithTasks[]>([]);
  const [loading, setLoading] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const previousRankRef = useRef(0);
  const [confettiKey, setConfettiKey] = useState(0);
  const confettiRef = useRef<ConfettiCannon>(null);
  const [userCoins, setUserCoins] = useState(0);

  // Simple iPad detection for responsive text (iPhone UI stays exactly the same)
  const { width: screenWidth } = Dimensions.get('window');
  const isIPad = Platform.OS === 'ios' && screenWidth >= 768;
  const responsiveFontSize = (baseSize: number) => isIPad ? baseSize * 1.2 : baseSize;

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [user, users] = await Promise.all([
        getCurrentUserFromSupabase(),
        getAllUsersFromSupabase()
      ]);
      if (!users || users.length === 0) return;
      // Filter out admin users
      const filteredUsers = users.filter(
        (u: UserWithTasks) => !u.isAdmin
      );
      const sortedUsers = filteredUsers.sort((a: UserWithTasks, b: UserWithTasks) => (b.tasksCompleted || 0) - (a.tasksCompleted || 0));
      if (user && !user.isAdmin) {
        setCurrentUser(user);
        const currentRank = sortedUsers.findIndex((u: UserWithTasks) => u.id === user.id) + 1;
        if (previousRankRef.current > currentRank && previousRankRef.current !== 0 && currentRank > 0) {
          setShowConfetti(true);
          setTimeout(() => { confettiRef.current?.start(); }, 100);
          setTimeout(() => setShowConfetti(false), 3000);
        }
        previousRankRef.current = currentRank;
      } else {
        setCurrentUser(null);
      }
      setAllUsers(sortedUsers);
    } catch (error) {
      console.error('❌ Error loading trophy data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadUserCoins = useCallback(async () => {
    try {
      const user = await getCurrentUserFromSupabase();
      if (user) setUserCoins(user.coins);
    } catch (error) {
      console.error('Error loading user coins:', error);
    }
  }, []);

  // Set up listeners ONCE
  useEffect(() => {
    const coinsUpdateHandler = (newCoins: number) => setUserCoins(newCoins);
    const tasksCompletedHandler = (userId: string, tasksCompleted: number) => {
      // Only reload if the current user or leaderboard is affected
      if (!currentUser || userId === currentUser.id) {
        loadData();
      }
    };
    addCoinsUpdateListener(coinsUpdateHandler);
    addTasksCompletedListener(tasksCompletedHandler);
    return () => {
      removeCoinsUpdateListener(coinsUpdateHandler);
      removeTasksCompletedListener(tasksCompletedHandler);
    };
    // DO NOT add currentUser or loadData to deps to avoid loops
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Only load data when screen is focused
  useFocusEffect(
    React.useCallback(() => {
      loadData();
      loadUserCoins();
    }, [loadData, loadUserCoins])
  );

  const getUserRank = useMemo(() => {
    if (!currentUser || allUsers.length === 0) return 0;
    return allUsers.findIndex(u => u.id === currentUser.id) + 1;
  }, [currentUser, allUsers]);

  const userRankText = useMemo(() => {
    if (!currentUser || allUsers.length === 0) return 'טוען...';
    return `אתה נמצא במקום ${getUserRank} מתוך ${allUsers.length}!`;
  }, [getUserRank, allUsers.length, currentUser]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.navigate('Home')}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { fontSize: responsiveFontSize(24) }]}>הישגים</Text>
      </View>

      {showConfetti && (
        <ConfettiCannon
          count={200}
          origin={{ x: -10, y: 0 }}
          fallSpeed={2500}
          fadeOut={true}
          autoStart={true}
        />
      )}
      
      {/* כותרת עם פרטי המשתמש */}
      <View style={styles.topBanner}>
        <View style={styles.userInfoHeader}>
          {currentUser?.profileImage ? (
            <Image
              source={{ uri: currentUser.profileImage }}
              style={styles.headerProfileImage}
              defaultSource={require('../../assets/images/icon.png')}
            />
          ) : currentUser?.avatar_seed && currentUser?.avatar_style ? (
            <Image
              source={{ uri: `https://api.dicebear.com/7.x/${currentUser.avatar_style}/png?seed=${currentUser.avatar_seed}` }}
              style={styles.headerProfileImage}
              defaultSource={require('../../assets/images/icon.png')}
            />
          ) : (
            <View style={styles.headerDefaultAvatar}>
              <Text style={styles.headerAvatarText}>{currentUser?.firstName?.[0] || '?'}</Text>
            </View>
          )}
          <Text style={[styles.rankText, { fontSize: responsiveFontSize(16) }]}>
            {userRankText}
          </Text>
        </View>
        <View style={styles.trophyContainer}>
          <Image
            source={require('../../assets/images/trophy.png')}
            style={[styles.trophyImage, { tintColor: '#FFD700' }]}
          />
          {/* תצוגת המטבעות מיד מתחת לגביע */}
          <View style={styles.coinsContainer}>
            <Text style={styles.coinsEmoji}>✨</Text>
            <Text style={[styles.coinsText, { fontSize: responsiveFontSize(16) }]}>
              {`צברת `}
              <Text style={styles.coinsNumber}>{currentUser?.tasksCompleted || 0}</Text>
              {` התנדבויות`}
            </Text>
            <Text style={[styles.congratsText, { fontSize: responsiveFontSize(14) }]}>כל הכבוד! המשך כך! 🎉</Text>
          </View>
        </View>
      </View>

      {/* רשימת המשתמשים */}
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 100 }]}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={true}
        keyboardShouldPersistTaps="handled"
        scrollEventThrottle={16}
        bounces={false}
      >
        {loading && allUsers.length === 0 ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>טוען טבלת מיקומים...</Text>
          </View>
        ) : (
          allUsers.map((user, index) => (
            <UserCard
              key={user.id}
              user={user}
              index={index}
              isCurrentUser={user.id === currentUser?.id}
              responsiveFontSize={responsiveFontSize}
            />
          ))
        )}
      </ScrollView>

      {/* קונפטי בודד */}
      <ConfettiCannon
        ref={confettiRef}
        count={50}
        origin={{ x: width/2, y: -10 }}
        autoStart={false}
        fadeOut={true}
        fallSpeed={3000}
        colors={['#FFD700', '#FFA500', '#FF69B4', '#87CEEB']}
      />

      {/* באנר תחתון */}
      <View style={styles.bottomBanner}>
        <TouchableOpacity 
          style={[styles.bannerIconWrap, styles.activeIconWrap]}
        >
          <View style={styles.activeIconBackground}>
            <Image 
              source={require('../../assets/images/trophy.png')}
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
          onPress={() => navigation.navigate('Home')}
        >
          <Image 
            source={require('../../assets/images/home.png')}
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
          style={styles.bannerIconWrap}
          onPress={() => navigation.navigate('Volunteer', { from: 'Trophy' })}
        >
          <Image 
            source={require('../../assets/images/volunteer.png')}
            style={styles.bannerIcon}
          />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FEF6DA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#D7D2B6',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 16,
  },
  backIcon: {
    fontSize: 24,
    color: '#333',
    fontWeight: 'bold',
    padding: 8,
  },
  topBanner: {
    width: '100%',
    paddingTop: 60,
    paddingBottom: 20,
    alignItems: 'center',
    backgroundColor: '#FEF6DA',
    zIndex: 1,
  },
  userInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  headerProfileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  headerDefaultAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E8E8E8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  headerAvatarText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666',
  },
  rankText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#B8860B',
    textAlign: 'center',
    marginTop: 10,
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  trophyContainer: {
    alignItems: 'center',
    marginVertical: 10,
  },
  trophyImage: {
    width: 120,
    height: 120,
    resizeMode: 'contain',
    marginBottom: 5,
  },
  scrollView: {
    flex: 1,
    marginBottom: 85,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  userCard: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  firstPlace: {
    backgroundColor: '#FFF9C4',
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  secondPlace: {
    backgroundColor: '#C0C0C0', // Silver
    borderWidth: 2,
    borderColor: '#C0C0C0',
  },
  thirdPlace: {
    backgroundColor: '#e6a86c', // Bright Bronze
    borderWidth: 2,
    borderColor: '#e6a86c',
  },
  currentUser: {
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  rankContainer: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
    position: 'relative',
  },
  rankCrown: {
    position: 'absolute',
    top: -15,
    fontSize: 16,
    textAlign: 'center',
    width: '100%',
  },
  rankNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666',
  },
  firstPlaceText: {
    color: '#B8860B',
  },
  secondPlaceText: {
    color: '#888',
  },
  thirdPlaceText: {
    color: '#fff',
  },
  userInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  defaultAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#E8E8E8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#666',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 4,
  },
  userStats: {
    fontSize: 14,
    color: '#666',
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
    paddingBottom: 20,
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
    zIndex: 9999,
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
  coinsContainer: {
    alignItems: 'center',
    marginTop: -10,
  },
  coinsEmoji: {
    fontSize: 24,
    marginBottom: 2,
  },
  coinsText: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
  },
  coinsNumber: {
    color: '#B8860B',
    fontWeight: 'bold',
    fontSize: 22,
  },
  congratsText: {
    fontSize: 15,
    color: '#4CAF50',
    marginTop: 2,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
  },
}); 