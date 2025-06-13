import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import React, { useEffect, useRef, useState } from 'react';
import {
    Animated,
    Dimensions,
    Image,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import ConfettiCannon from 'react-native-confetti-cannon';
import { addCoinsUpdateListener, removeCoinsUpdateListener } from '../utils/eventEmitter';
import { User, userManager } from '../utils/userManager';

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

export default function TrophyScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [currentUser, setCurrentUser] = useState<UserWithTasks | null>(null);
  const [allUsers, setAllUsers] = useState<UserWithTasks[]>([]);
  const [showConfetti, setShowConfetti] = useState(false);
  const [previousRank, setPreviousRank] = useState(0);
  const [confettiKey, setConfettiKey] = useState(0);
  const confettiLeftRef = useRef<ConfettiCannon>(null);
  const confettiRightRef = useRef<ConfettiCannon>(null);
  const confettiCenterRef = useRef<ConfettiCannon>(null);
  const [userCoins, setUserCoins] = useState(0);

  useEffect(() => {
    loadData();
    loadUserCoins();

    // הוספת מאזין לשינויים במטבעות
    const coinsUpdateHandler = (newCoins: number) => {
      setUserCoins(newCoins);
    };

    addCoinsUpdateListener(coinsUpdateHandler);

    // ניקוי המאזין כשהקומפוננטה מתפרקת
    return () => {
      removeCoinsUpdateListener(coinsUpdateHandler);
    };
  }, []);

  const loadData = async () => {
    const user = await userManager.getCurrentUser();
    const users = await userManager.getAllUsers() as UserWithTasks[];
    const sortedUsers = users.sort((a, b) => (b.tasksCompleted || 0) - (a.tasksCompleted || 0));
    
    if (user) {
      setCurrentUser(user);
      const currentRank = sortedUsers.findIndex(u => u.id === user.id) + 1;
      
      // בדיקה אם המשתמש עלה בדירוג
      if (previousRank > currentRank && previousRank !== 0) {
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 3000);
      }
      setPreviousRank(currentRank);
    }
    
    setAllUsers(sortedUsers);
  };

  const loadUserCoins = async () => {
    const user = await userManager.getCurrentUser();
    if (user) {
      setUserCoins(user.coins);
    }
  };

  // עדכון הדירוג בכל פעם שהמטבעות משתנים
  useEffect(() => {
    const interval = setInterval(loadData, 1000);
    return () => clearInterval(interval);
  }, []);

  // הפעלת קונפטי מתמשך
  useEffect(() => {
    const interval = setInterval(() => {
      if (confettiLeftRef.current) {
        confettiLeftRef.current.start();
      }
      setTimeout(() => {
        if (confettiCenterRef.current) {
          confettiCenterRef.current.start();
        }
      }, 500);
      setTimeout(() => {
        if (confettiRightRef.current) {
          confettiRightRef.current.start();
        }
      }, 1000);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const getUserRank = (user: UserWithTasks) => {
    return allUsers.findIndex(u => u.id === user.id) + 1;
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.navigate('Home')}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>הישגים</Text>
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
          ) : (
            <View style={styles.headerDefaultAvatar}>
              <Text style={styles.headerAvatarText}>
                {currentUser?.firstName?.[0] || '?'}
              </Text>
            </View>
          )}
          <Text style={styles.rankText}>
            אתה נמצא במקום {getUserRank(currentUser!)} מתוך {allUsers.length}!
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
            <Text style={styles.coinsText}>
              {`צברת `}
              <Text style={styles.coinsNumber}>{currentUser?.tasksCompleted || 0}</Text>
              {` התנדבויות`}
            </Text>
            <Text style={styles.congratsText}>כל הכבוד! המשך כך! 🎉</Text>
          </View>
        </View>
      </View>

      {/* רשימת המשתמשים */}
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {allUsers.map((user, index) => (
          <Animated.View key={user.id}>
            <TouchableOpacity
              style={[
                styles.userCard,
                index === 0 && styles.firstPlace,
                user.id === currentUser?.id && styles.currentUser,
              ]}
            >
              <View style={styles.rankContainer}>
                {index === 0 && <Text style={styles.rankCrown}>👑</Text>}
                <Text style={[styles.rankNumber, index === 0 && styles.firstPlaceText]}>
                  {index + 1}
                </Text>
              </View>

              <View style={styles.userInfo}>
                {user.profileImage ? (
                  <Image source={{ uri: user.profileImage }} style={styles.profileImage} />
                ) : (
                  <View style={styles.defaultAvatar}>
                    <Text style={styles.avatarText}>{user.firstName[0]}</Text>
                  </View>
                )}
                <View style={styles.userDetails}>
                  <Text style={styles.userName}>{`${user.firstName} ${user.lastName}`}</Text>
                  <Text style={styles.userStats}>{`${user.tasksCompleted || 0} התנדבויות`}</Text>
                </View>
              </View>
            </TouchableOpacity>
          </Animated.View>
        ))}
      </ScrollView>

      {/* קונפטי מרובה מיקומים */}
      <ConfettiCannon
        ref={confettiLeftRef}
        count={20}
        origin={{ x: -10, y: -10 }}
        autoStart={false}
        fadeOut={true}
        fallSpeed={3000}
        colors={['#FFD700', '#FFA500', '#FF69B4', '#87CEEB']}
      />
      <ConfettiCannon
        ref={confettiCenterRef}
        count={20}
        origin={{ x: width/2, y: -10 }}
        autoStart={false}
        fadeOut={true}
        fallSpeed={3000}
        colors={['#FFD700', '#FFA500', '#FF69B4', '#87CEEB']}
      />
      <ConfettiCannon
        ref={confettiRightRef}
        count={20}
        origin={{ x: width + 10, y: -10 }}
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
    marginRight: 12,
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
    zIndex: 1000,
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
}); 