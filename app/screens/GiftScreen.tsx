import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
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
import { userManager } from '../utils/userManager';

const { width, height } = Dimensions.get('window');

// Define image assets
const IMAGES = {
  gift: require('../../assets/images/gift.png'),
  trophy: require('../../assets/images/trophy.png'),
  volunteer: require('../../assets/images/volunteer.png'),
  calendar: require('../../assets/images/calander.png'),
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
  { id: 1, title: '🍩 מאפה בקפה צ׳לה', desc: 'ניר עם', coins: 170, color: '#FF9B9B' },
  { id: 2, title: '🍟 חומוס של טחינה', desc: 'צ׳יפס במתנה', coins: 150, color: '#FFB084' },
  { id: 3, title: '🍦 גלידה גולדה', desc: 'כדור נוסף', coins: 180, color: '#F6B6E6' },
  { id: 4, title: '🍕 פיצה שמש', desc: 'משקה חינם', coins: 120, color: '#9FD9B3' },
  { id: 5, title: '🥨 אוריוס', desc: 'מאפה שקדים - ארז', coins: 200, color: '#90CDF4' },
];

const LEVELS = [
  { name: 'מתחיל', min: 0, max: 100 },
  { name: 'זורם', min: 100, max: 200 },
  { name: 'תותח', min: 200, max: 300 },
  { name: 'שולט!', min: 300, max: 500 },
  { name: 'אגדה!', min: 500, max: 9999 },
];

function getLevel(userCoins: number) {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (userCoins >= LEVELS[i].min) return { ...LEVELS[i], index: i };
  }
  return { ...LEVELS[0], index: 0 };
}

function ProgressBar({ progress, color }: { progress: number; color: string }) {
  return (
    <View style={styles.progressBarBg}>
      <Animated.View style={[styles.progressBarFill, { width: `${progress * 100}%`, backgroundColor: color }]} />
    </View>
  );
}

function IconButton({ 
  icon, 
  onPress, 
  isActive 
}: { 
  icon: keyof typeof IMAGES; 
  onPress?: () => void;
  isActive?: boolean;
}) {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <TouchableOpacity 
      style={[styles.bannerIconWrap, isActive && styles.activeIconWrap]}
      onPress={onPress}
    >
      {isActive ? (
        <View style={styles.activeIconBackground}>
          {isLoading && (
            <ActivityIndicator size="small" color="#2D3748" style={styles.loader} />
          )}
          <Image 
            source={IMAGES[icon]}
            style={[styles.bannerIcon, isLoading && styles.hiddenImage]}
            onLoadStart={() => setIsLoading(true)}
            onLoad={() => setIsLoading(false)}
            resizeMode="contain"
          />
        </View>
      ) : (
        <>
          {isLoading && (
            <ActivityIndicator size="small" color="#2D3748" style={styles.loader} />
          )}
          <Image 
            source={IMAGES[icon]}
            style={[styles.bannerIcon, isLoading && styles.hiddenImage]}
            onLoadStart={() => setIsLoading(true)}
            onLoad={() => setIsLoading(false)}
            resizeMode="contain"
          />
        </>
      )}
    </TouchableOpacity>
  );
}

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
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const colorAnim = useRef(new Animated.Value(0)).current;
  const [isPressed, setIsPressed] = useState(false);
  const [isImageLoading, setIsImageLoading] = useState(true);

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 5,
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    if (isSelected) {
      Animated.sequence([
        Animated.timing(scaleAnim, { toValue: 1.1, duration: 150, useNativeDriver: true }),
        Animated.timing(scaleAnim, { toValue: 1, duration: 150, useNativeDriver: true }),
      ]).start();
      Animated.timing(colorAnim, {
        toValue: 1,
        duration: 400,
        easing: Easing.linear,
        useNativeDriver: false,
      }).start(() => colorAnim.setValue(0));
    }
  }, [isSelected]);

  const bgColor = colorAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [coupon.color, '#FFD700'],
  });

  return (
    <Animated.View 
      style={[
        styles.couponContainer, 
        { 
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
          backgroundColor: bgColor,
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
            {isImageLoading && (
              <ActivityIndicator size="small" color="#2D3748" style={styles.loader} />
            )}
            <Image 
              source={IMAGES.coin}
              style={[styles.coinIcon, isImageLoading && styles.hiddenImage]}
              onLoadStart={() => setIsImageLoading(true)}
              onLoad={() => setIsImageLoading(false)}
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
  const [displayCoins, setDisplayCoins] = useState(0);
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
  const [isSurpriseLoading, setIsSurpriseLoading] = useState(false);
  const [showBarcodeModal, setShowBarcodeModal] = useState(false);
  const [selectedCouponForBarcode, setSelectedCouponForBarcode] = useState<CouponData | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const errorAnim = useRef(new Animated.Value(-100)).current;
  const [isCountingDown, setIsCountingDown] = useState(false);
  const [countdownCoins, setCountdownCoins] = useState(0);
  const countdownAnim = useRef(new Animated.Value(0)).current;
  const [isAnimating, setIsAnimating] = useState(false);
  const [previousLevel, setPreviousLevel] = useState<number | null>(null);
  const coinsAnim = useRef(new Animated.Value(0)).current;
  const [animatedCoins, setAnimatedCoins] = useState(0);
  const [isErrorModalVisible, setIsErrorModalVisible] = useState(false);
  const errorModalAnimation = useRef(new Animated.Value(0)).current;

  // עדכון ערך המטבעות המונפש
  useEffect(() => {
    coinsAnim.addListener(({ value }) => {
      setAnimatedCoins(Math.round(value));
    });

    return () => {
      coinsAnim.removeAllListeners();
    };
  }, []);

  // אנימציית שינוי מטבעות
  const animateCoinsChange = (start: number, end: number, duration = 1500) => {
    coinsAnim.setValue(start);
    Animated.timing(coinsAnim, {
      toValue: end,
      duration,
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: false,
    }).start();
  };

  // טעינת מטבעות המשתמש
  useEffect(() => {
    userManager.getCurrentUser()
      .then(user => {
        if (user) {
          const coins = user.coins;
          setUserCoins(coins);
          coinsAnim.setValue(coins);
          setAnimatedCoins(coins);
        }
      });
  }, []);

  // מעקב אחרי שינויים במטבעות ואנימציה בהתאם
  useEffect(() => {
    if (userCoins !== animatedCoins) {
      animateCoinsChange(animatedCoins, userCoins);
    }
  }, [userCoins]);

  // אנימציית הופעה לקופונים
  useEffect(() => {
    fadeAnims.forEach((fadeAnim, i) => {
      setTimeout(() => {
        Animated.spring(fadeAnim, {
          toValue: 1,
          friction: 6,
          useNativeDriver: true,
        }).start();
      }, i * 120);
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
  const handleCouponPress = (coupon: CouponData, idx: number) => {
    if (userCoins < coupon.coins) {
      displayErrorModal();
      Vibration.vibrate(400);
      return;
    }

    setSelectedCoupon(idx);
    setIsAnimating(true);
    const newCoins = userCoins - coupon.coins;
    
    Animated.timing(coinsAnim, {
      toValue: newCoins,
      duration: 1500,
      easing: Easing.bezier(0.4, 0, 0.2, 1),
      useNativeDriver: false,
    }).start(() => {
      userManager.updateUserCoins(newCoins)
        .then(() => {
          setUserCoins(newCoins);
          setIsAnimating(false);
          
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

          setTimeout(() => setSelectedCoupon(null), 1500);
        });
    });
  };

  // טיפול בלחיצה על כפתור המטבעות
  const handleCoinButtonPress = (coupon: CouponData) => {
    if (userCoins < coupon.coins) {
      displayErrorModal();
      Vibration.vibrate(400);
      return;
    }

    setIsAnimating(true);
    const endCoins = userCoins - coupon.coins;

    Animated.timing(coinsAnim, {
      toValue: endCoins,
      duration: 1500,
      easing: Easing.bezier(0.4, 0, 0.2, 1),
      useNativeDriver: false,
    }).start(() => {
      userManager.updateUserCoins(endCoins)
        .then(() => {
          setUserCoins(endCoins);
          setIsAnimating(false);
          
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
        });
    });
  };

  // טיפול בלחיצה על כפתור הפתע אותי
  const handleSurprise = () => {
    setIsSurpriseLoading(true);
    const idx = Math.floor(Math.random() * COUPONS.length);
    setTimeout(() => {
      setIsSurpriseLoading(false);
      handleCouponPress(COUPONS[idx], idx);
    }, 600);
  };

  // חישוב רמה ו־ProgressBar
  const level = getLevel(userCoins);
  const nextLevel = LEVELS[Math.min(level.index + 1, LEVELS.length - 1)];
  const progress = (userCoins - level.min) / (nextLevel.max - level.min);

  // קופון יוקרתי לדוגמה (הכי יקר)
  const premiumCoupon = COUPONS.reduce((prev, curr) => (curr.coins > prev.coins ? curr : prev), COUPONS[0]);
  const coinsToPremium = Math.max(0, premiumCoupon.coins - userCoins);

  // עדכון תצוגת המטבעות בזמן אנימציה
  useEffect(() => {
    countdownAnim.addListener(({ value }) => {
      setDisplayCoins(Math.round(value));
    });

    return () => {
      countdownAnim.removeAllListeners();
    };
  }, []);

  // בדיקת שינוי רמה
  useEffect(() => {
    const currentLevel = getLevel(userCoins).index;
    
    // אם יש רמה קודמת ועלינו רמה
    if (previousLevel !== null && currentLevel > previousLevel) {
      // הפעלת קונפטי לחגיגת הרמה החדשה - מהיר וחלק יותר
      confettiLeftRef.current?.start();
      
      setTimeout(() => {
        confettiCenterRef.current?.start();
      }, 50);  // הפרש זמן קטן יותר

      setTimeout(() => {
        confettiRightRef.current?.start();
      }, 100);  // הפרש זמן קטן יותר
      
      // עדכון הרמה הקודמת
      setPreviousLevel(currentLevel);
      
      // הצגת הודעת ברכה
      setRewardText(`🎉 כל הכבוד! עלית לרמה ${currentLevel + 1} - ${LEVELS[currentLevel].name}`);
      Animated.sequence([
        Animated.timing(fadeReward, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.delay(2000),
        Animated.timing(fadeReward, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]).start();
      
      Vibration.vibrate([100, 200, 100]);
    } else {
      setPreviousLevel(currentLevel);
    }
  }, [userCoins]);

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
            <View style={[
              styles.coinsBanner,
              isAnimating && styles.coinsBannerAnimating
            ]}>
              <Image 
                source={IMAGES.coin} 
                style={[
                  styles.coinIcon,
                  isAnimating && styles.coinIconShake
                ]} 
                resizeMode="contain"
              />
              <Animated.Text 
                style={[
                  styles.coinsText,
                  isAnimating && styles.coinsTextAnimating,
                  {
                    transform: [{
                      scale: coinsAnim.interpolate({
                        inputRange: [0, userCoins],
                        outputRange: [0.95, 1.05],
                        extrapolate: 'clamp'
                      })
                    }]
                  }
                ]}
              >
                יש לך {animatedCoins} מטבעות
              </Animated.Text>
            </View>
          </View>

          {/* בלונים */}
          <Text style={styles.balloons}>🎈🎈🎉</Text>

          {/* מד רמה ו־ProgressBar */}
          <View style={styles.levelBar}>
            <Text style={styles.levelText}>{`רמה ${level.index + 1} – ${level.name}`}</Text>
            <ProgressBar progress={progress} color="#FFD700" />
            <Text style={styles.progressText}>{`עוד ${coinsToPremium} מטבעות ל-${premiumCoupon.title}`}</Text>
          </View>

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
          <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {COUPONS.map((coupon, idx) => (
              <CouponCard 
                key={coupon.id} 
                coupon={coupon} 
                fadeAnim={fadeAnims[idx]} 
                onPress={() => handleCouponPress(coupon, idx)}
                onCoinPress={() => handleCoinButtonPress(coupon)}
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

            <TouchableOpacity 
              style={[styles.bannerIconWrap, styles.activeIconWrap]}
            >
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
                source={IMAGES.calendar}
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
  progressBarBg: { 
    width: '80%', 
    height: 12, 
    backgroundColor: '#fff', 
    borderRadius: 8, 
    overflow: 'hidden', 
    marginBottom: 4 
  },
  progressBarFill: { 
    height: '100%', 
    borderRadius: 8 
  },
  progressText: { 
    fontSize: 13, 
    color: '#2D3748', 
    marginBottom: 2 
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
  loader: { 
    position: 'absolute', 
    alignSelf: 'center' 
  },
  hiddenImage: { 
    opacity: 0 
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
});

export default GiftScreen; 