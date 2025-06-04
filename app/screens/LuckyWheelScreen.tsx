import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { Circle, Defs, G, Path, Stop, Svg, LinearGradient as SvgGradient, Image as SvgImage, Text as SvgText, Use } from 'react-native-svg';
import { RootStackParamList } from '../MainNavigator';
import { emitCoinsUpdate } from '../utils/eventEmitter';
import { userManager } from '../utils/userManager';

const { width } = Dimensions.get('window');
const WHEEL_SIZE = Math.min(width * 0.9, 350);
const SPIN_DURATION = 10000; // 10 seconds spin

const PRIZES = [
  { 
    value: 0,
    color: '#FFD700',
    couponTitle: 'סיבוב\nנוסף',
    icon: '🔄'  // אייקון רענון
  },
  { 
    value: 0,
    color: '#FFA500',
    couponTitle: 'חומוס\nחינם',
    icon: '🥙'  // פלאפל/חומוס
  },
  { 
    value: 1500,
    color: '#FF69B4',
    couponTitle: '1500\nמטבעות',
    icon: '🪙'  // מטבע
  },
  { 
    value: 0,
    color: '#90CDF4',
    couponTitle: 'כניסה\nלבריכה',
    icon: '🏊‍♂️'  // שחיין בבריכה
  },
  { 
    value: 0,
    color: '#FF9B9B',
    couponTitle: 'פיצה\nאישית',
    icon: '🍕'  // פיצה
  },
  { 
    value: 0,
    color: '#9FD9B3',
    couponTitle: 'ארוחת\nבוקר',
    icon: '🥐'  // קרואסון
  },
  { 
    value: 0,
    color: '#F6B6E6',
    couponTitle: 'כרטיס\nלסרט',
    icon: '🎬'  // קולנוע
  },
  { 
    value: 0,
    color: '#FFB084',
    couponTitle: 'קילו\nגלידה',
    icon: '🍦'  // גלידה
  },
];

type NavigationProp = StackNavigationProp<RootStackParamList>;

// עדכון נתיבי SVG לאייקונים ידידותיים יותר
const ICON_PATHS = {
  refresh: "M 0 0 L -4 -4 L 4 -4 L 0 0 M 0 -4 A 4 4 0 1 0 4 0",  // חץ מסתובב פשוט
  food: "M -4 -4 L 4 -4 L 4 4 L -4 4 Z M -2 -2 L 2 -2 L 2 2 L -2 2 Z",  // צלחת עם מסגרת
  'currency-usd': `
    M -2 2 A 2 2 0 1 1 2 2 A 2 2 0 1 1 -2 2 Z
    M 2 -2 A 2 2 0 1 1 6 -2 A 2 2 0 1 1 2 -2 Z
    M -6 -2 A 2 2 0 1 1 -2 -2 A 2 2 0 1 1 -6 -2 Z
  `,  // שלושה מטבעות מסודרים
  pool: "M -4 0 C -2 -2 2 2 4 0 M -4 2 C -2 0 2 4 4 2",  // גלים של מים
  pizza: "M -4 -4 A 5.6 5.6 0 1 1 4 4 L -4 -4 M 0 0 L 4 -4 M 0 0 L -4 4",  // פיצה עגולה עם משולשים
  'food-croissant': "M -4 2 C -2 -4 2 -4 4 2 C 2 4 -2 4 -4 2 Z",  // קרואסון מלא
  movie: "M -4 -3 L 4 -3 L 4 3 L -4 3 Z M -2 -3 L -2 3 M 2 -3 L 2 3",  // מסך קולנוע
  'ice-cream': "M -3 2 L 0 -4 L 3 2 Z M -2 2 L 2 2 M -1.5 0 L 1.5 0",  // גביע גלידה עם פסים
};

// הוספת צבעים לאייקונים
const ICON_COLORS = {
  refresh: "#4A90E2",  // כחול
  food: "#8B4513",     // חום
  'currency-usd': "#FFD700",  // זהב
  pool: "#00BCD4",     // תכלת
  pizza: "#FF6B6B",    // אדום
  'food-croissant': "#DEB887",  // חום בהיר
  movie: "#9C27B0",    // סגול
  'ice-cream': "#FF69B4",  // ורוד
};

const LuckyWheelScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const [isSpinning, setIsSpinning] = useState(false);
  const [userCoins, setUserCoins] = useState(0);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [displayedCoins, setDisplayedCoins] = useState(0);
  const spinValue = useRef(new Animated.Value(0)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;
  const shimmerPosition = useRef(new Animated.Value(0)).current;
  const [hasFreeSpins, setHasFreeSpins] = useState(false);
  const [rewardText, setRewardText] = useState('');
  const fadeReward = useRef(new Animated.Value(0)).current;
  const [showCoinPopup, setShowCoinPopup] = useState(false);
  const coinPopupAnim = useRef(new Animated.Value(0)).current;
  const [showWinBanner, setShowWinBanner] = useState(false);
  const winBannerScale = useRef(new Animated.Value(0)).current;
  const winBannerOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    startButtonAnimations();
    loadUserCoins();
  }, []);

  const startButtonAnimations = () => {
    // אנימציית גדילה והקטנה
    Animated.loop(
      Animated.sequence([
        Animated.timing(buttonScale, {
          toValue: 1.1,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(buttonScale, {
          toValue: 1,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // אנימציית הברקה
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerPosition, {
          toValue: 1,
          duration: 2000,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerPosition, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const loadUserCoins = async () => {
    const user = await userManager.getCurrentUser();
    if (user) {
      setUserCoins(user.coins);
      setDisplayedCoins(user.coins);
    }
  };

  const animateCoinsDecrease = () => {
    const startCoins = userCoins;
    const endCoins = userCoins - 1000;
    const duration = 500; // Changed from 1000 to 500ms
    const steps = 10; // Changed from 20 to 10 steps
    const stepDuration = duration / steps;
    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      const progress = currentStep / steps;
      const currentCoins = Math.round(startCoins - (progress * 1000));
      
      setDisplayedCoins(currentCoins);
      emitCoinsUpdate(currentCoins);

      if (currentStep === steps) {
        clearInterval(timer);
        spinWheel();
      }
    }, stepDuration);
  };

  const handlePrize = async (prize: typeof PRIZES[0], segmentIndex: number) => {
    // מאפסים את הסיבוב החינם בכל פעם שנוחתים על משבצת
    setHasFreeSpins(false);

    // בדיקה אם נחתנו על 1500 מטבעות
    if (prize.value === 1500) {
      // מעדכנים את המטבעות מיד
      const newCoins = userCoins + 1500;
      setUserCoins(newCoins);
      setDisplayedCoins(newCoins);
      await userManager.updateUserCoins(newCoins);
      emitCoinsUpdate(newCoins);

      // מציגים את הבאנר
      setShowWinBanner(true);
      
      // מפעילים את אנימציית הבאנר
      Animated.parallel([
        Animated.sequence([
          Animated.spring(winBannerScale, {
            toValue: 1,
            useNativeDriver: true,
            damping: 10,
            stiffness: 100
          }),
          Animated.delay(3000),
          Animated.timing(winBannerScale, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true
          })
        ]),
        Animated.sequence([
          Animated.timing(winBannerOpacity, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true
          }),
          Animated.delay(3000),
          Animated.timing(winBannerOpacity, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true
          })
        ])
      ]).start(() => {
        setShowWinBanner(false);
      });
    }
    // בדיקה אם נחתנו על סיבוב נוסף - חייב להיות המשבצת הראשונה
    else if (segmentIndex === 0) {
      setHasFreeSpins(true);
      setRewardText('זכית בסיבוב נוסף! 🎡');
      
      Animated.sequence([
        Animated.timing(fadeReward, { 
          toValue: 1, 
          duration: 200, 
          useNativeDriver: true 
        }),
        Animated.delay(2000),
        Animated.timing(fadeReward, { 
          toValue: 0, 
          duration: 300, 
          useNativeDriver: true 
        })
      ]).start(() => {
        setTimeout(() => {
          startSpin();
        }, 500);
      });
    }
    // כל פרס אחר
    else {
      setRewardText(`זכית ב${prize.couponTitle.replace('\n', ' ')}! 🎉`);
      Animated.sequence([
        Animated.timing(fadeReward, { 
          toValue: 1, 
          duration: 200, 
          useNativeDriver: true 
        }),
        Animated.delay(2000),
        Animated.timing(fadeReward, { 
          toValue: 0, 
          duration: 300, 
          useNativeDriver: true 
        })
      ]).start();
    }
  };

  const startSpin = async () => {
    if (isSpinning) return;
    
    // בודקים אם יש מספיק מטבעות רק אם אין סיבוב חינם
    if (!hasFreeSpins && userCoins < 1000) {
      setShowErrorModal(true);
      return;
    }

    setIsSpinning(true);

    // מורידים מטבעות רק אם זה לא סיבוב חינם
    if (!hasFreeSpins) {
      const newCoins = userCoins - 1000;
      setUserCoins(newCoins);
      setDisplayedCoins(newCoins);
      emitCoinsUpdate(newCoins);
      userManager.updateUserCoins(newCoins);

      setShowCoinPopup(true);
      coinPopupAnim.setValue(0);
      Animated.sequence([
        Animated.timing(coinPopupAnim, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.delay(800),
        Animated.timing(coinPopupAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setShowCoinPopup(false);
      });
    }

    // מתחילים את הסיבוב
    spinWheel();
  };

  const spinWheel = () => {
    // בחירת משולש רנדומלי
    const segmentIndex = Math.floor(Math.random() * PRIZES.length);
    const segmentAngle = 360 / PRIZES.length;
    
    // חישוב הסיבוב כך שיעצור בדיוק על המשולש
    const targetRotation = 360 * 10 + (segmentIndex * segmentAngle);
    // מוסיפים חצי מהזווית של המשולש כדי שהחץ יצביע בדיוק על המרכז
    const adjustedRotation = targetRotation + (segmentAngle / 2);
    
    spinValue.setValue(0);
    Animated.timing(spinValue, {
      toValue: adjustedRotation,
      duration: SPIN_DURATION,
      easing: Easing.bezier(0.2, 0.6, 0.2, 1),
      useNativeDriver: true,
    }).start(() => {
      setIsSpinning(false);
      
      // טיפול בפרס
      const prize = PRIZES[segmentIndex];
      console.log('Landed on prize:', prize.couponTitle, 'at index:', segmentIndex); // לוג לדיבוג
      handlePrize(prize, segmentIndex);
    });
  };

  // עדכון כפתור הסיבוב בהתאם למצב סיבוב חינם
  const getSpinButtonText = () => {
    if (isSpinning) return 'מסתובב...';
    if (hasFreeSpins) return 'סיבוב חינם! 🎁';
    return 'סובב את הגלגל!';
  };

  const renderWheel = () => {
    const anglePerSegment = 360 / PRIZES.length;
    
    return (
      <Svg height={WHEEL_SIZE} width={WHEEL_SIZE} viewBox="-50 -50 100 100">
        <Defs>
          <SvgImage
            id="coinImage"
            href={require('../../assets/images/coin.png')}
            x="-4"
            y="-4"
            width="8"
            height="8"
          />
        </Defs>
        <G>
          {PRIZES.map((prize, index) => {
            const angle = index * anglePerSegment;
            const angleRad = (angle * Math.PI) / 180;
            const midAngleRad = ((angle + anglePerSegment / 2) * Math.PI) / 180;
            
            const textRadius = 35;
            const centerX = Math.cos(midAngleRad) * textRadius;
            const centerY = Math.sin(midAngleRad) * textRadius;
            
            const segmentRadius = 48;
            const startX = Math.cos(angleRad) * segmentRadius;
            const startY = Math.sin(angleRad) * segmentRadius;
            const endX = Math.cos((angle + anglePerSegment) * Math.PI / 180) * segmentRadius;
            const endY = Math.sin((angle + anglePerSegment) * Math.PI / 180) * segmentRadius;

            const centerOffset = 0.5;
            const startFromX = Math.cos(angleRad) * centerOffset;
            const startFromY = Math.sin(angleRad) * centerOffset;

            const textRotation = (angle + anglePerSegment / 2 + 90);
            const textLines = prize.couponTitle.split('\n');

            const iconRadius = 15;
            const iconX = Math.cos(midAngleRad) * iconRadius;
            const iconY = Math.sin(midAngleRad) * iconRadius;

            return (
              <G key={index}>
                <Path
                  d={`M ${startFromX} ${startFromY} L ${startX} ${startY} A ${segmentRadius} ${segmentRadius} 0 0 1 ${endX} ${endY} L ${startFromX} ${startFromY}`}
                  fill={prize.color}
                  stroke="#FFFFFF"
                  strokeWidth="0.5"
                />
                
                {/* טקסט */}
                <G transform={`translate(${centerX}, ${centerY}) rotate(${textRotation})`}>
                  {textLines.map((line, lineIndex) => (
                    <SvgText
                      key={lineIndex}
                      x="0"
                      y={lineIndex * 6 - (textLines.length - 1) * 3}
                      fontSize="4.8"
                      textAnchor="middle"
                      fill="#000000"
                      fontWeight="bold"
                    >
                      {line}
                    </SvgText>
                  ))}
                </G>

                {/* אייקון - תמונת מטבע במקום אמוג'י עבור מטבעות */}
                <G transform={`translate(${iconX}, ${iconY}) rotate(${textRotation})`}>
                  {prize.couponTitle.includes('מטבעות') ? (
                    <Use href="#coinImage" />
                  ) : (
                    <SvgText
                      x="0"
                      y="0"
                      fontSize="8"
                      textAnchor="middle"
                      alignmentBaseline="middle"
                    >
                      {prize.icon}
                    </SvgText>
                  )}
                </G>
              </G>
            );
          })}
          <Circle cx="0" cy="0" r="1" fill="#FFFFFF" />
        </G>
      </Svg>
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#FF6B6B', '#FFD93D', '#4ECDC4']}
        style={styles.gradient}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>חזרה לחנות</Text>
        </TouchableOpacity>

        <View style={styles.coinsContainer}>
          <View style={styles.coinsContent}>
            <Icon 
              name="cash-multiple" 
              size={28} 
              color="#FFD700" 
            />
            <Text style={styles.coinsText}>
              {displayedCoins.toLocaleString()}
            </Text>
          </View>
          <Text style={styles.coinsLabel}>
            המטבעות שלי
          </Text>
        </View>

        <View style={styles.wheelContainer}>
          <View style={styles.arrowContainer}>
            <Svg width="60" height="80" viewBox="0 0 60 80">
              <Defs>
                <SvgGradient id="arrowGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <Stop offset="0" stopColor="#FF0000" />
                  <Stop offset="1" stopColor="#CC0000" />
                </SvgGradient>
              </Defs>
              <Path
                d="M30 80 L0 40 L20 40 L20 0 L40 0 L40 40 L60 40 Z"
                fill="url(#arrowGradient)"
                stroke="#FFFFFF"
                strokeWidth="2"
              />
            </Svg>
          </View>
          
          <Animated.View
            style={[
              styles.wheel,
              {
                transform: [{
                  rotate: spinValue.interpolate({
                    inputRange: [0, 360],
                    outputRange: ['0deg', '360deg']
                  })
                }]
              }
            ]}
          >
            {renderWheel()}
          </Animated.View>
        </View>

        <View style={styles.spinButtonWrapper}>
          <Animated.View 
            style={[
              styles.spinButtonContainer,
              {
                transform: [{ scale: buttonScale }]
              }
            ]}
          >
            <TouchableOpacity
              style={[
                styles.spinButton, 
                isSpinning && styles.spinButtonDisabled,
                hasFreeSpins && styles.freeSpinButton
              ]}
              onPress={startSpin}
              disabled={isSpinning}
            >
              <LinearGradient
                colors={hasFreeSpins ? ['#FFD700', '#FFA500'] : ['#FF4E50', '#F9D423']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.spinButtonGradient}
              >
                <View style={styles.spinButtonContent}>
                  <Icon 
                    name="star-four-points" 
                    size={32} 
                    color="#FFFFFF" 
                    style={styles.spinButtonIcon}
                  />
                  <Text style={styles.spinButtonText}>
                    {getSpinButtonText()}
                  </Text>
                  <Icon 
                    name="star-four-points" 
                    size={32} 
                    color="#FFFFFF" 
                    style={[styles.spinButtonIcon, styles.spinButtonIconRight]}
                  />
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </View>

        <Modal
          visible={showErrorModal}
          transparent={true}
          animationType="fade"
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <LinearGradient
                colors={['#FF6B6B', '#FF8E8E']}
                style={styles.modalGradient}
              >
                <Icon name="alert-circle" size={50} color="#FFFFFF" />
                <Text style={styles.modalTitle}>אין לך מספיק מטבעות!</Text>
                <Text style={styles.modalText}>המשך להתנדב כדי לצבור יותר מטבעות</Text>
                <TouchableOpacity
                  style={styles.modalButton}
                  onPress={() => {
                    setShowErrorModal(false);
                    navigation.navigate('Volunteer', { from: 'Gift' });
                  }}
                >
                  <Text style={styles.modalButtonText}>להתנדבות</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.modalCloseButton}
                  onPress={() => setShowErrorModal(false)}
                >
                  <Text style={styles.modalCloseText}>סגור</Text>
                </TouchableOpacity>
              </LinearGradient>
            </View>
          </View>
        </Modal>

        {/* אנימציית הורדת מטבעות */}
        {showCoinPopup && (
          <Animated.View
            style={[
              styles.coinPopup,
              {
                opacity: coinPopupAnim.interpolate({
                  inputRange: [0, 0.1, 0.9, 1],
                  outputRange: [0, 1, 1, 0],
                }),
                transform: [
                  {
                    translateX: coinPopupAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [20, 0],  // נכנס מימין
                    }),
                  }
                ],
              },
            ]}
          >
            <Text style={styles.coinPopupText}>-1000</Text>
          </Animated.View>
        )}

        {/* באנר זכייה במטבעות - עיצוב מעודכן */}
        {showWinBanner && (
          <Animated.View
            style={[
              styles.winBanner,
              {
                transform: [{ scale: winBannerScale }],
                opacity: winBannerOpacity,
                zIndex: 1000, // מוודא שהבאנר יופיע מעל כל הרכיבים האחרים
              }
            ]}
          >
            <LinearGradient
              colors={['#4CAF50', '#45A049']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.winBannerGradient}
            >
              <Text style={styles.winBannerText}>
                איזה כיף! התווספו לך 1500 מטבעות! 🎉
              </Text>
              <View style={styles.winBannerCoins}>
                <Text style={styles.winBannerEmoji}>🪙</Text>
                <Text style={styles.winBannerEmoji}>🪙</Text>
                <Text style={styles.winBannerEmoji}>🪙</Text>
              </View>
            </LinearGradient>
          </Animated.View>
        )}

        {/* הודעת זכייה רגילה */}
        <Animated.View
          style={[
            styles.rewardMessage,
            {
              opacity: fadeReward,
              transform: [{ scale: fadeReward }],
              zIndex: 999,
            }
          ]}
        >
          <Text style={styles.rewardText}>{rewardText}</Text>
        </Animated.View>

      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButton: {
    position: 'absolute',
    top: 60,
    left: 20,
    padding: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 10,
  },
  backButtonText: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  wheelContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  wheel: {
    width: WHEEL_SIZE,
    height: WHEEL_SIZE,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  arrowContainer: {
    alignItems: 'center',
    marginBottom: -20,
    zIndex: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 10,
  },
  spinButtonWrapper: {
    marginTop: 40,
    alignItems: 'center',
  },
  spinButtonContainer: {
    borderRadius: 35,
    overflow: 'hidden',
    position: 'relative',
  },
  shimmerEffect: {
    position: 'absolute',
    top: -20,
    bottom: -20,
    width: 60,
    zIndex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    transform: [{ skewX: '-25deg' }],
  },
  spinButton: {
    borderRadius: 35,
    overflow: 'hidden',
    shadowColor: '#FFA500',
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 10,
  },
  spinButtonDisabled: {
    opacity: 0.7,
  },
  spinButtonGradient: {
    paddingHorizontal: 30,
    paddingVertical: 20,
    borderRadius: 35,
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  spinButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  spinButtonIcon: {
    marginRight: 10,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 3,
  },
  spinButtonIconRight: {
    marginRight: 0,
    marginLeft: 10,
  },
  spinButtonText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 3,
  },
  coinsContainer: {
    position: 'absolute',
    top: 60,
    right: 20,
    alignItems: 'center',
  },
  coinsContent: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
  },
  coinsText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  coinsLabel: {
    color: '#FFFFFF',
    fontSize: 14,
    marginTop: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    borderRadius: 20,
    overflow: 'hidden',
  },
  modalGradient: {
    padding: 20,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 10,
    marginBottom: 5,
    textAlign: 'center',
  },
  modalText: {
    fontSize: 18,
    color: '#FFFFFF',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalButton: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
    marginBottom: 10,
  },
  modalButtonText: {
    color: '#FF6B6B',
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalCloseButton: {
    marginTop: 10,
  },
  modalCloseText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  freeSpinButton: {
    borderColor: '#FFD700',
    borderWidth: 3,
  },
  coinPopup: {
    position: 'absolute',
    top: 60,  // אותו גובה כמו תצוגת המטבעות
    right: 140,  // מיקום מימין לתצוגת המטבעות
    backgroundColor: 'rgba(255, 0, 0, 0.8)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    zIndex: 1000,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  coinPopupText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  winBanner: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -150 }, { translateY: -75 }],
    width: 300,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  winBannerGradient: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  winBannerText: {
    fontSize: 24,
    color: '#FFFFFF',
    fontWeight: 'bold',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
    marginBottom: 10,
  },
  winBannerCoins: {
    flexDirection: 'row',
    marginTop: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  winBannerEmoji: {
    fontSize: 32,
    marginHorizontal: 5,
  },
  rewardMessage: {
    position: 'absolute',
    top: '40%',
    left: '50%',
    transform: [{ translateX: -150 }],
    width: 300,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 15,
    padding: 15,
  },
  rewardText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
});

export default LuckyWheelScreen; 