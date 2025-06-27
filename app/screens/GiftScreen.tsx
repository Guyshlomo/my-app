/**
 * מסך המתנות - ממוטב ומשופר
 * 
 * שינויים שבוצעו:
 * 1. הסרת אנימציית הכסף - עכשיו מציג מיד את הכמות הנכונה
 * 2. החלפת מערכת הרמות בשלב נוכחי - מבוסס על משימות שהושלמו
 * 3. הסרת באנר ההתקדמות - ממשק נקי יותר
 * 4. הסרת פונקציות מיותרות - LEVELS, getLevel, ProgressBar
 * 5. שיפור ביצועים - פחות אנימציות מיותרות
 */

import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  Image,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  Vibration,
  View
} from 'react-native';
import ConfettiCannon from 'react-native-confetti-cannon';
import QRCode from 'react-native-qrcode-svg';
import { getCurrentUserFromSupabase, savePurchasedCoupon, updateUserInSupabase } from '../db/supabaseApi';
import { addCoinsUpdateListener, removeCoinsUpdateListener } from '../utils/eventEmitter';
import { navigationOptimizer } from '../utils/navigationOptimizer';

const { width, height } = Dimensions.get('window');

// Define image assets
const IMAGES = {
  gift: require('../../assets/images/gift.png'),
  trophy: require('../../assets/images/trophy.png'),
  volunteer: require('../../assets/images/volunteer.png'),
  calander: require('../../assets/images/calander.png'),
  home: require('../../assets/images/home.png'),
  coin: require('../../assets/images/coin.png'),
};

type RootStackParamList = {
  Home: undefined;
  Trophy: undefined;
  Gift: undefined;
  Volunteer: { from: 'Home' | 'Trophy' | 'Gift' };
  Calendar: undefined;
  Login: undefined;
  Signup: undefined;
  PurchaseHistory: undefined;
  LuckyWheel: undefined;
};

type NavigationProp = StackNavigationProp<RootStackParamList>;

interface CouponData {
  id: number;
  title: string;
  desc: string;
  coins: number;
  color: string;
}

const COUPONS: CouponData[] = [
  { id: 1, title: '🍩 מאפה בקפה צ׳לה', desc: 'בקניית קפה', coins: 170, color: '#FF9B9B' },
  { id: 2, title: '🍟 צ׳יפס במתנה בחומוס של טחינה', desc: 'בקניית מנת חומוס', coins: 150, color: '#FFB084' },
  { id: 5, title: '🥨 מאפה לבחירה באוריוס', desc: 'בקניית קפה', coins: 200, color: '#90CDF4' },
  { id: 6, title: '🥤 שתייה במתנה בדפקא', desc: 'בקניית ארוחת המבורגר', coins: 180, color: '#F6B6E6' },
  { id: 7, title: '☕ קפה אצל דן דן', desc: 'בקניית כריך או מאפה', coins: 160, color: '#9FD9B3' },
];



function CouponCard({ 
  coupon, 
  fadeAnim, 
  onPress,
  onCoinPress,
  isSelected 
}: { 
  coupon: CouponData; 
  fadeAnim: Animated.Value; 
  onPress: () => void;
  onCoinPress: () => void;
  isSelected: boolean;
}) {
  const [isPressed, setIsPressed] = useState(false);

  return (
    <Animated.View 
      style={[
        styles.couponContainer, 
        { 
          opacity: fadeAnim,
          backgroundColor: isSelected ? '#FFD700' : coupon.color,
          borderWidth: isSelected ? 3 : 0,
          borderColor: isSelected ? '#FFD700' : 'transparent',
        }
      ]}
    >
      <TouchableOpacity 
        style={styles.coupon}
        onPressIn={() => setIsPressed(true)}
        onPressOut={() => setIsPressed(false)}
        onPress={onPress}
        activeOpacity={0.9}
      >
        <View style={styles.couponContent}>
          <View style={styles.sparkleContainer}>
            <Text style={styles.businessName}>{coupon.title}</Text>
          </View>
          <Text style={styles.description}>{coupon.desc}</Text>
          <TouchableOpacity 
            style={styles.coinButton}
            onPress={onCoinPress}
          >
            <Image 
              source={IMAGES.coin}
              style={styles.coinIcon}
              resizeMode="contain"
            />
            <Text style={styles.coinText}>{coupon.coins}</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

function GiftScreen() {
  const navigation = useNavigation<NavigationProp>();
  const confettiLeftRef = useRef<ConfettiCannon>(null);
  const confettiCenterRef = useRef<ConfettiCannon>(null);
  const confettiRightRef = useRef<ConfettiCannon>(null);
  const [userCoins, setUserCoins] = useState(0);
  const [currentStage, setCurrentStage] = useState(1); // שלב נוכחי במקום רמה
  const [selectedCoupon, setSelectedCoupon] = useState<number | null>(null);
  const [rewardText, setRewardText] = useState('');
  const [fadeReward] = useState(new Animated.Value(0));
  const [modalAnimation] = useState(new Animated.Value(0));
  const [fadeAnims] = useState(COUPONS.map(() => new Animated.Value(0)));
  const [bgColors] = useState([
    ['#FFDEE9', '#B5FFFC'],
    ['#FEE140', '#FA709A'],
    ['#A1FFCE', '#FAFFD1'],
    ['#FBC2EB', '#A6C1EE'],
    ['#FEE2F8', '#A6E3E9'],
  ]);
  const [bgIndex, setBgIndex] = useState(0);
  const [showBarcodeModal, setShowBarcodeModal] = useState(false);
  const [selectedCouponForBarcode, setSelectedCouponForBarcode] = useState<CouponData | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const errorAnim = useRef(new Animated.Value(-100)).current;
  const [isErrorModalVisible, setIsErrorModalVisible] = useState(false);
  const errorModalAnimation = useRef(new Animated.Value(0)).current;

  // טעינת נתוני המשתמש
  useEffect(() => {
    loadUserData();

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

  // Track navigation when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      navigationOptimizer.trackNavigation('Gift');
    }, [])
  );

  // הצגה מיידית של קופונים ללא אנימציה
  useEffect(() => {
    fadeAnims.forEach((fadeAnim) => {
      fadeAnim.setValue(1); // הצגה מיידית
    });
  }, []);

  // הצגת הודעת שגיאה
  const showError = (message: string) => {
    setErrorMessage(message);
    Animated.sequence([
      // הופעה
      Animated.timing(errorAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true
      }),
      // השהייה
      Animated.delay(3000),
      // היעלמות
      Animated.timing(errorAnim, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true
      })
    ]).start(() => {
      // ניקוי ההודעה אחרי שהאנימציה הסתיימה
      setErrorMessage('');
    });
  };

  // פונקציה להצגת מודל שגיאה
  const displayErrorModal = () => {
    setIsErrorModalVisible(true);
    errorModalAnimation.setValue(0);
    Animated.sequence([
      // הופעה
      Animated.spring(errorModalAnimation, {
        toValue: 1,
        friction: 8,
        tension: 65,
        useNativeDriver: true
      }),
      // השהייה
      Animated.delay(3000),
      // היעלמות
      Animated.timing(errorModalAnimation, {
        toValue: 0,
        duration: 300,
        easing: Easing.bezier(0.4, 0, 0.2, 1),
        useNativeDriver: true
      })
    ]).start(() => {
      setIsErrorModalVisible(false);
    });
  };

  // פונקציה לסגירת מודל הברקוד
  const closeBarcode = () => {
    Animated.timing(modalAnimation, {
      toValue: 0,
      duration: 300,
      easing: Easing.bezier(0.4, 0, 0.2, 1),
      useNativeDriver: true,
    }).start(() => {
      setShowBarcodeModal(false);
    });
  };

  // טיפול בלחיצה על קופון
  const handleCouponPress = async (coupon: CouponData, idx: number) => {
    if (userCoins < coupon.coins) {
      displayErrorModal();
      Vibration.vibrate(400);
      return;
    }

    setSelectedCoupon(idx);
    const newCoins = userCoins - coupon.coins;
    
    try {
      // קבלת המשתמש הנוכחי
      const currentUser = await getCurrentUserFromSupabase();
      if (!currentUser) {
        throw new Error('No current user found');
      }

      // שמירת הקופון שנרכש בסופה בייס
      await savePurchasedCoupon(currentUser.id, {
        coupon_title: coupon.title,
        coupon_description: coupon.desc,
        coins_spent: coupon.coins
      });

      // עדכון המטבעות בסופה בייס
      await updateUserInSupabase(currentUser.id, { coins: newCoins });

      setUserCoins(newCoins);
      
      // אנימציות והודעות
      confettiLeftRef.current?.start();
      setTimeout(() => confettiCenterRef.current?.start(), 100);
      setTimeout(() => confettiRightRef.current?.start(), 200);
      
      setRewardText(`הורדת ${coupon.coins} מטבעות 💸`);
      Animated.sequence([
        Animated.timing(fadeReward, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.delay(1200),
        Animated.timing(fadeReward, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]).start();

      Vibration.vibrate(100);
      
      setSelectedCouponForBarcode(coupon);
      setShowBarcodeModal(true);
      modalAnimation.setValue(0);
      Animated.spring(modalAnimation, {
        toValue: 1,
        friction: 8,
        tension: 65,
        useNativeDriver: true
      }).start();

      // סגירה אוטומטית אחרי 10 שניות
      setTimeout(closeBarcode, 10000);
    } catch (error) {
      console.error('Error purchasing coupon:', error);
      setErrorMessage('אירעה שגיאה ברכישת הקופון');
      displayErrorModal();
      setSelectedCoupon(null);
    }
  };

  // טיפול בלחיצה על כפתור הפתע אותי
  const handleSurprise = () => {
    navigation.navigate('LuckyWheel');
  };

  const loadUserData = async () => {
    try {
      const user = await getCurrentUserFromSupabase();
      if (user) {
        setUserCoins(user.coins || 0);
        // חישוב השלב הנוכחי על בסיס משימות שהושלמו
        const tasksCompleted = user.tasksCompleted || 0;
        const currentStageNumber = Math.floor(tasksCompleted / 10) + 1;
        setCurrentStage(currentStageNumber);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient 
        colors={[bgColors[bgIndex][0], bgColors[bgIndex][1]]}
        style={styles.gradientBg}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 1}}
      >
        <SafeAreaView style={styles.safeArea}>
          {/* באנר מטבעות */}
          <View style={styles.topContainer}>
            <View style={styles.coinsBanner}>
              <Image 
                source={IMAGES.coin} 
                style={styles.coinIcon}
                resizeMode="contain"
              />
              <Text style={styles.coinsText}>
                יש לך {userCoins} מטבעות
              </Text>
            </View>
          </View>

          {/* מד שלב נוכחי */}
          <View style={styles.levelBar}>
            <Text style={styles.levelText}>🎯 אתה נמצא בשלב {currentStage}!</Text>
          </View>

          {/* לחצן גלגל המזל */}
          <TouchableOpacity 
            style={styles.luckWheelButton}
            onPress={handleSurprise}
          >
            <LinearGradient
              colors={['#FFD700', '#FFA500', '#FF8C00']}
              style={styles.luckWheelGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.luckWheelContent}>
                <Text style={styles.luckWheelEmoji}>🎡</Text>
                <Text style={styles.luckWheelText}>גלגל המזל</Text>
                <Text style={styles.luckWheelSparkle}>✨</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>

          {/* כותרת מדוברת */}
          <Text style={styles.headerTitleBig}>מה בא לך להרוויח היום?</Text>
          <Text style={styles.headerSubtitleBig}>יאללה, בא לך משהו טעים?</Text>

          {/* כפתור ארנק במקום הפתע אותי */}
          <TouchableOpacity 
            style={styles.walletButton}
            onPress={() => navigation.navigate('PurchaseHistory')}
          >
            <Text style={styles.walletEmoji}>💳</Text>
            <Text style={styles.walletText}>הקופונים שלי</Text>
          </TouchableOpacity>

          {/* הודעת תגמול */}
          <Animated.View style={[styles.rewardMsg, { opacity: fadeReward }]}> 
            <Text style={styles.rewardMsgText}>{rewardText}</Text>
          </Animated.View>

          {/* קופונים */}
          <ScrollView 
            style={styles.scrollView} 
            contentContainerStyle={styles.scrollContent} 
            showsVerticalScrollIndicator={false}
            removeClippedSubviews={true}
            keyboardShouldPersistTaps="handled"
            scrollEventThrottle={16}
            bounces={false}
          >
            {COUPONS.map((coupon, idx) => (
              <CouponCard 
                key={coupon.id} 
                coupon={coupon} 
                fadeAnim={fadeAnims[idx]} 
                onPress={() => handleCouponPress(coupon, idx)}
                onCoinPress={() => handleCouponPress(coupon, idx)}
                isSelected={selectedCoupon === idx} 
              />
            ))}
          </ScrollView>

          {/* הודעת שגיאה */}
          {errorMessage !== '' && (
            <Animated.View 
              style={[
                styles.errorMessage,
                {
                  transform: [{ translateY: errorAnim }]
                }
              ]}
            >
              <Text style={styles.errorText}>{errorMessage}</Text>
            </Animated.View>
          )}

          {/* מודל ברקוד - עם אנימציות משופרות */}
          <Modal
            visible={showBarcodeModal}
            transparent={true}
            animationType="fade"
            onRequestClose={closeBarcode}
          >
            <Animated.View 
              style={[
                styles.modalOverlay,
                {
                  opacity: modalAnimation,
                }
              ]}
            >
              <Animated.View 
                style={[
                  styles.barcodeModal,
                  {
                    transform: [
                      {
                        scale: modalAnimation.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.9, 1],
                        })
                      }
                    ]
                  }
                ]}
              >
                <Text style={styles.modalTitle}>
                  {selectedCouponForBarcode?.title}
                </Text>
                <Animated.View 
                  style={[
                    styles.qrContainer,
                    {
                      opacity: modalAnimation,
                      transform: [
                        {
                          scale: modalAnimation.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0.8, 1],
                          })
                        }
                      ]
                    }
                  ]}
                >
                  {selectedCouponForBarcode && (
                    <QRCode
                      value={`coupon-${selectedCouponForBarcode.id}-${Date.now()}`}
                      size={200}
                    />
                  )}
                </Animated.View>
                <Text style={styles.modalDescription}>
                  הצג את הברקוד בקופה למימוש ההטבה
                </Text>
                <TouchableOpacity 
                  style={styles.closeButton}
                  onPress={closeBarcode}
                >
                  <Text style={styles.closeButtonText}>סגור</Text>
                </TouchableOpacity>
              </Animated.View>
            </Animated.View>
          </Modal>

          {/* מודל שגיאה */}
          {isErrorModalVisible && (
            <Animated.View 
              style={[
                styles.errorModal,
                {
                  opacity: errorModalAnimation,
                  transform: [
                    {
                      scale: errorModalAnimation.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.8, 1]
                      })
                    },
                    {
                      translateY: errorModalAnimation.interpolate({
                        inputRange: [0, 1],
                        outputRange: [50, 0]
                      })
                    }
                  ]
                }
              ]}
            >
              <View style={styles.errorModalContent}>
                <Text style={styles.errorModalIcon}>❌</Text>
                <Text style={styles.errorModalText}>אין לך מספיק מטבעות!</Text>
              </View>
            </Animated.View>
          )}

          {/* קונפטי - עם הגדרות משופרות */}
          <ConfettiCannon 
            ref={confettiLeftRef}
            count={50}
            origin={{ x: 0, y: height }}
            autoStart={false}
            fadeOut={true}
            fallSpeed={2000}
            explosionSpeed={250}
            colors={['#FFD700', '#FFA500', '#FF69B4', '#87CEEB']}
          />
          <ConfettiCannon 
            ref={confettiCenterRef}
            count={60}
            origin={{ x: width / 2, y: height }}
            autoStart={false}
            fadeOut={true}
            fallSpeed={2000}
            explosionSpeed={250}
            colors={['#98FB98', '#DDA0DD', '#FFD700', '#87CEEB']}
          />
          <ConfettiCannon 
            ref={confettiRightRef}
            count={50}
            origin={{ x: width, y: height }}
            autoStart={false}
            fadeOut={true}
            fallSpeed={2000}
            explosionSpeed={250}
            colors={['#FF69B4', '#87CEEB', '#98FB98', '#FFA500']}
          />

          {/* באנר תחתון */}
          <View style={styles.bottomBanner}>
            <TouchableOpacity 
              style={styles.bannerIconWrap}
              onPress={() => navigation.navigate('Trophy')}
            >
              <Image 
                source={IMAGES.trophy}
                style={styles.bannerIcon}
              />
            </TouchableOpacity>

            <TouchableOpacity style={[styles.bannerIconWrap, styles.activeIconWrap]}>
              <View style={styles.activeIconBackground}>
                <Image 
                  source={IMAGES.gift}
                  style={styles.bannerIcon}
                />
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.bannerIconWrap}
              onPress={() => navigation.navigate('Home')}
            >
              <Image 
                source={IMAGES.home}
                style={styles.bannerIcon}
              />
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.bannerIconWrap}
              onPress={() => navigation.navigate('Calendar')}
            >
              <Image 
                source={IMAGES.calander}
                style={styles.bannerIcon}
              />
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.bannerIconWrap}
              onPress={() => navigation.navigate('Volunteer', { from: 'Gift' })}
            >
              <Image 
                source={IMAGES.volunteer}
                style={styles.bannerIcon}
              />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradientBg: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  safeArea: {
    flex: 1,
  },
  topContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    zIndex: 10,
  },
  coinsBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 5,
  },
  coinIcon: {
    width: 24,
    height: 24,
    marginRight: 8,
  },
  coinsText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2D3748',
    textAlign: 'center',
  },
  balloons: { 
    fontSize: 32, 
    textAlign: 'center', 
    marginTop: 8 
  },
  levelBar: { 
    alignItems: 'center', 
    marginTop: 8, 
    marginBottom: 8 
  },
  levelText: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    color: '#2D3748', 
    marginBottom: 4 
  },
  headerTitleBig: { 
    fontSize: 26, 
    fontWeight: 'bold', 
    color: '#2D3748', 
    textAlign: 'center', 
    marginTop: 8 
  },
  headerSubtitleBig: { 
    fontSize: 18, 
    color: '#4A5568', 
    textAlign: 'center', 
    marginBottom: 8 
  },
  walletButton: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFD700',
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 24,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  walletEmoji: {
    fontSize: 22,
    marginRight: 8,
  },
  walletText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2D3748',
  },
  rewardMsg: { 
    position: 'absolute', 
    top: 120, 
    left: 0, 
    right: 0, 
    alignItems: 'center', 
    zIndex: 10 
  },
  rewardMsgText: { 
    fontSize: 22, 
    color: '#FF1493', 
    fontWeight: 'bold', 
    backgroundColor: 'rgba(255,255,255,0.85)', 
    borderRadius: 16, 
    paddingHorizontal: 18, 
    paddingVertical: 6, 
    overflow: 'hidden' 
  },
  scrollView: { 
    flex: 1, 
    marginBottom: 85 
  },
  scrollContent: { 
    padding: 16, 
    paddingBottom: 40 
  },
  couponContainer: { 
    marginBottom: 16 
  },
  coupon: { 
    borderRadius: 18, 
    padding: 20, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.13, 
    shadowRadius: 8, 
    elevation: 5 
  },
  couponContent: { 
    alignItems: 'center' 
  },
  sparkleContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 8 
  },
  businessName: { 
    fontSize: 24, 
    fontWeight: 'bold', 
    color: '#2D3748', 
    textAlign: 'center' 
  },
  description: { 
    fontSize: 18, 
    color: '#4A5568', 
    textAlign: 'center', 
    marginBottom: 16 
  },
  coinButton: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: 'rgba(255, 255, 255, 0.9)', 
    paddingHorizontal: 16, 
    paddingVertical: 8, 
    borderRadius: 20, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 1 }, 
    shadowOpacity: 0.1, 
    shadowRadius: 4, 
    elevation: 2 
  },
  coinText: { fontSize: 18, fontWeight: 'bold', color: '#2D3748' },
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
    shadowOffset: { width: 0, height: -2 }, 
    shadowOpacity: 0.1, 
    shadowRadius: 8, 
    elevation: 8, 
    zIndex: 9999 
  },
  bannerIconWrap: { 
    flex: 1, 
    alignItems: 'center', 
    justifyContent: 'center', 
    height: '100%', 
    paddingTop: 10 
  },
  activeIconWrap: { 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  activeIconBackground: { 
    backgroundColor: 'white', 
    borderRadius: 50, 
    padding: 8, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.1, 
    shadowRadius: 4, 
    elevation: 4 
  },
  bannerIcon: { 
    width: 32, 
    height: 32, 
    resizeMode: 'contain' 
  },

  errorMessage: {
    position: 'absolute',
    top: '50%',
    left: '10%',
    right: '10%',
    backgroundColor: '#FFB6C1',
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    transform: [{translateY: -50}],
    zIndex: 1000,
  },
  errorText: {
    color: '#FF1493',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  barcodeModal: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    width: '80%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    transform: [{ scale: 1 }], // התחלתי לאנימציה
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2D3748',
    marginBottom: 16,
    textAlign: 'center',
  },
  qrContainer: {
    padding: 16,
    backgroundColor: 'white',
    borderRadius: 10,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  modalDescription: {
    fontSize: 16,
    color: '#4A5568',
    marginBottom: 24,
    textAlign: 'center',
  },
  closeButton: {
    backgroundColor: '#2D3748',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 16,
  },
  closeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  coinsBannerAnimating: {
    backgroundColor: '#FFF3E0',
    transform: [{ scale: 1.02 }],
  },
  coinIconShake: {
    transform: [{ scale: 1.1 }],
  },
  coinsTextAnimating: {
    color: '#FF6B6B',
    fontWeight: '900',
    fontSize: 20,
  },
  errorModal: {
    position: 'absolute',
    top: '40%',
    left: '10%',
    right: '10%',
    zIndex: 1000,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  errorModalContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorModalIcon: {
    fontSize: 40,
    marginBottom: 10,
  },
  errorModalText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FF3B30',
    textAlign: 'center',
  },
  luckWheelButton: {
    alignSelf: 'center',
    width: '85%',
    maxWidth: 320,
    marginVertical: 16,
    borderRadius: 25,
    elevation: 8,
    shadowColor: '#FFD700',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.4,
    shadowRadius: 5,
    transform: [{ scale: 1.02 }],
  },
  luckWheelGradient: {
    borderRadius: 25,
    padding: 2,
  },
  luckWheelContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 23,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  luckWheelEmoji: {
    fontSize: 32,
    marginRight: 12,
  },
  luckWheelText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2D3748',
    textShadowColor: 'rgba(255, 255, 255, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  luckWheelSparkle: {
    fontSize: 28,
    marginLeft: 12,
  },
});

export default GiftScreen; 