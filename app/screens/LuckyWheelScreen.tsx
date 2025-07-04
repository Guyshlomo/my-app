import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, Easing, Modal, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { Circle, Defs, G, Path, Stop, Svg, LinearGradient as SvgGradient, Image as SvgImage, Text as SvgText, Use } from 'react-native-svg';
import { getCurrentUserFromSupabase, savePurchasedCoupon, updateUserInSupabase } from '../db/supabaseApi';
import { RootStackParamList } from '../MainNavigator';
import { emitCoinsUpdate } from '../utils/eventEmitter';

const { width } = Dimensions.get('window');
const WHEEL_SIZE = Math.min(width * 0.9, 350);
const SPIN_DURATION = 10000; // 10 seconds spin

const PRIZES = [
  { 
    value: 0,
    color: '#F6B6E6',
    couponTitle: 'כרטיס\nלהופעה\nבדורות',
    icon: '🎫'  // כרטיסים
  },
  { 
    value: 0,
    color: '#FFB084',
    couponTitle: '2 אספרסו\nבקפה צ׳לה',
    icon: '☕'  // אספרסו
  },
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
    couponTitle: 'ארוחת\ns בדפקא',
    icon: '🍔'  // המבורגר
  },
  { 
    value: 0,
    color: '#FF9B9B',
    couponTitle: 'פיצה אישית\nבשמרלינג',
    icon: '🍕'  // פיצה
  },
  { 
    value: 0,
    color: '#9FD9B3',
    couponTitle: 'ארוחת\nבוקר\nבאוריוס',
    icon: '🍪'  // עוגיה
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
  const [currentPrize, setCurrentPrize] = useState<typeof PRIZES[0] | null>(null);
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
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [targetIndex, setTargetIndex] = useState(-1);
  const [isResetting, setIsResetting] = useState(false);
  const [showBarcodeModal, setShowBarcodeModal] = useState(false);
  const [currentBarcode, setCurrentBarcode] = useState('');
  const [showFreeSpinModal, setShowFreeSpinModal] = useState(false);
  const [showCoinsModal, setShowCoinsModal] = useState(false);

  // אנימציות מרגשות לזכייה
  const wheelGlowAnim = useRef(new Animated.Value(0)).current;
  const wheelPulseAnim = useRef(new Animated.Value(1)).current;
  const starburstAnim = useRef(new Animated.Value(0)).current;
  const sparkleAnim = useRef(new Animated.Value(0)).current;
  const [showStarburst, setShowStarburst] = useState(false);
  const [showSparkles, setShowSparkles] = useState(false);

  // Load user data
  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const user = await getCurrentUserFromSupabase();
      if (user) {
        setUserCoins(user.coins || 0);
        setDisplayedCoins(user.coins || 0);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

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
    setCurrentPrize(prize);

    // בדיקה אם נחתנו על 1500 מטבעות - חייב להיות גם הערך וגם הטקסט המתאים
    if (prize.value === 1500 && prize.couponTitle === '1500\nמטבעות') {
      // מעדכנים את המטבעות מיד
      const newCoins = userCoins + 1500;
      setUserCoins(newCoins);
      setDisplayedCoins(newCoins);
      const user = await getCurrentUserFromSupabase();
      if (user) {
        await updateUserInSupabase(user.id, { coins: newCoins });
      }
      emitCoinsUpdate(newCoins);

      // מציגים חלון מטבעות מיוחד
      setShowCoinsModal(true);
      startConfetti(); // הפעלת קונפטי
      
      // סגירת החלון אחרי 3 שניות
      setTimeout(() => {
        setShowCoinsModal(false);
      }, 3000);
      
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
    // בדיקה מחמירה יותר לסיבוב נוסף - חייב להיות גם האינדקס הנכון, גם הכותרת הנכונה וגם האייקון הנכון
    else if (segmentIndex === 2 && prize.couponTitle === 'סיבוב\nנוסף' && prize.icon === '🔄') {
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
        // נוסיף בדיקה נוספת שאכן יש סיבוב חינם לפני שמתחילים סיבוב חדש
        if (hasFreeSpins) {
          setTimeout(() => {
            startSpin();
          }, 500);
        }
      });
    }
    // כל פרס אחר
    else {
      const prizeText = prize.couponTitle.replace('\n', ' ');
      setRewardText('איזה כיף! זכית בקופון שווה במיוחד! 🎁\nהוא מחכה לך ב"קופונים שלי"');
      setShowWinBanner(true);
      startConfetti();
      // שמירת הקופון במסד הנתונים
      const barcode = generateBarcode();
      await saveCouponToUser(prize, barcode);
      // הצגת באנר 3 שניות ואז פתיחת מודל ברקוד
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
        setCurrentBarcode(barcode);
        setShowBarcodeModal(true);
        setCurrentPrize(prize);
      });
    }
  };

  const startSpin = async () => {
    if (isSpinning || isResetting) return;
    
    // מאפסים את הגלגל למצב הבסיסי לפני כל סיבוב
    spinValue.setValue(0);
    
    // בודקים אם יש מספיק מטבעות רק אם אין סיבוב חינם
    if (!hasFreeSpins && userCoins < 1000) {
      setShowErrorModal(true);
      return;
    }

    setIsSpinning(true);

    // מתחילים את הסיבוב מיד
    spinWheel();

    // מורידים מטבעות רק אם זה לא סיבוב חינם (במקביל לסיבוב)
    if (!hasFreeSpins) {
      const newCoins = userCoins - 1000;
      setUserCoins(newCoins);
      setDisplayedCoins(newCoins);
      emitCoinsUpdate(newCoins);
      const user = await getCurrentUserFromSupabase();
      if (user) {
        await updateUserInSupabase(user.id, { coins: newCoins });
      }

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
  };

  const spinWheel = () => {
    // בחירת משולש רנדומלי
    const segmentIndex = Math.floor(Math.random() * PRIZES.length);
    const segmentAngle = 45; // כל סגמנט הוא 45 מעלות
    
    // חישוב מדויק של הסיבוב לפי הנוסחה החדשה
    const baseRotation = 3600; // 10 סיבובים מלאים
    const targetRotation = baseRotation - (segmentIndex * segmentAngle);
    
    console.log('Selected prize index:', segmentIndex);
    console.log('Rotation calculation:', `${baseRotation} + (${segmentIndex} × ${segmentAngle}) = ${targetRotation}`);
    console.log('Selected prize:', PRIZES[segmentIndex].couponTitle);
    Animated.timing(spinValue, {
      toValue: targetRotation,
      duration: SPIN_DURATION,
      easing: Easing.bezier(0.2, 0.6, 0.2, 1),
      useNativeDriver: true,
    }).start(async () => {
      setIsSpinning(false);
      
      const prize = PRIZES[segmentIndex];
      
      // בודקים אם זה סיבוב נוסף
      if (segmentIndex === 2 && prize.couponTitle === 'סיבוב\nנוסף') {
        console.log('Free spin awarded!');
        setHasFreeSpins(true);
        setShowFreeSpinModal(true);
        startConfetti(); // הפעלת קונפטי
        
        // סגירת החלון אחרי 3 שניות והתחלת סיבוב חדש
        setTimeout(() => {
          setShowFreeSpinModal(false);
          setTimeout(() => {
            startSpin();
          }, 500);
        }, 3000);
      }
      // בודקים אם זה 1500 מטבעות
      else if (prize.value === 1500 && prize.couponTitle === '1500\nמטבעות') {
        console.log('Adding 1500 coins!');
        const newCoins = userCoins + 1500;
        setUserCoins(newCoins);
        setDisplayedCoins(newCoins);
        
        try {
          const user = await getCurrentUserFromSupabase();
          if (user) {
            await updateUserInSupabase(user.id, { coins: newCoins });
          }
        } catch (error) {
          console.error('Error updating user coins:', error);
        }
        
        emitCoinsUpdate(newCoins);

        // מציגים חלון מטבעות מיוחד
        setShowCoinsModal(true);
        startConfetti(); // הפעלת קונפטי
        
        // סגירת החלון אחרי 3 שניות
        setTimeout(() => {
          setShowCoinsModal(false);
        }, 3000);
        
        // אנימציית באנר
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

        // אנימציית הוספת מטבעות
        setShowCoinPopup(true);
        coinPopupAnim.setValue(0);
        Animated.sequence([
          Animated.timing(coinPopupAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.delay(1500),
          Animated.timing(coinPopupAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start(() => {
          setShowCoinPopup(false);
        });
      }
      // כל פרס אחר
      else {
        console.log('Regular prize awarded:', prize.couponTitle);
        handlePrize(prize, segmentIndex);
      }
    });
  };

  // עדכון כפתור הסיבוב בהתאם למצב סיבוב חינם
  const getSpinButtonText = () => {
    if (isSpinning) return 'מסתובב...';
    if (isResetting) return 'מתאפס...';
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
        {/* מסובבים את הגלגל כך שהחץ יהיה במרכז משולש */}
        <G rotation={-112.5}>
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

                {/* אייקון */}
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

  const startExcitingWinAnimation = () => {
    // רטט מרגש (עם בדיקה לתמיכה)
    try {
      // @ts-ignore
      Vibration.vibrate([100, 50, 100, 50, 200]);
    } catch (error) {
      console.log('Vibration not supported');
    }
    
    // הפעלת כל האפקטים בבת אחת (ללא קונפטי)
    setShowStarburst(true);
    setShowSparkles(true);
    
    // איפוס ערכי האנימציות
    starburstAnim.setValue(0);
    sparkleAnim.setValue(0);
    wheelGlowAnim.setValue(0);
    wheelPulseAnim.setValue(1);
    
    // אנימציית הזוהר של הגלגל
    Animated.sequence([
      Animated.timing(wheelGlowAnim, {
        toValue: 1,
        duration: 500,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(wheelGlowAnim, {
        toValue: 0,
        duration: 1000,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();

    // אנימציית פעימה של הגלגל
    Animated.loop(
      Animated.sequence([
        Animated.timing(wheelPulseAnim, {
          toValue: 1.05,
          duration: 200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(wheelPulseAnim, {
          toValue: 1,
          duration: 200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
      { iterations: 6 }
    ).start();



    // אנימציית התפרצות כוכבים
    Animated.timing(starburstAnim, {
      toValue: 1,
      duration: 1500,
      easing: Easing.out(Easing.back(1.5)),
      useNativeDriver: true,
    }).start(() => {
      setShowStarburst(false);
    });

    // אנימציית נצנוצים
    Animated.loop(
      Animated.sequence([
        Animated.timing(sparkleAnim, {
          toValue: 1,
          duration: 300,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(sparkleAnim, {
          toValue: 0,
          duration: 300,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
      { iterations: 8 }
    ).start(() => {
      setShowSparkles(false);
    });
  };

  const startConfetti = () => {
    startExcitingWinAnimation();
  };

  const generateBarcode = () => {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000);
    return `LW${timestamp}${random}`;
  };

  const saveCouponToUser = async (prize: typeof PRIZES[0], barcode: string) => {
    console.log('💾 saveCouponToUser started for prize:', prize.couponTitle, 'barcode:', barcode);
    try {
      const user = await getCurrentUserFromSupabase();
      if (!user) {
        console.error('❌ No current user found');
        return;
      }
      console.log('✅ Current user found:', user.id);
      
      const couponData = {
        coupon_title: prize.couponTitle.replace('\n', ' '),
        coupon_description: prize.couponTitle.replace('\n', ' '),
        coins_spent: 0, // קופון זכייה - לא עלה מטבעות
        barcode: barcode
      };
      
      console.log('💾 About to save coupon data:', couponData);
      console.log('💾 User ID:', user.id);
      console.log('💾 Calling savePurchasedCoupon...');
      
      // שמור את הקופון למשתמש בסופה בייס
      const result = await savePurchasedCoupon(user.id, couponData);
      console.log('✅ Lucky wheel coupon saved successfully with result:', result);
      console.log('✅ Barcode:', barcode);
      console.log('✅ Coupon data:', couponData);
    } catch (error) {
      console.error('❌ Error saving lucky wheel coupon:', error);
    }
  };

  const showBarcodeForPrize = async (prize: typeof PRIZES[0]) => {
    console.log('🎟️ showBarcodeForPrize called for:', prize.couponTitle);
    const barcode = generateBarcode();
    console.log('🎟️ Generated barcode:', barcode);
    setCurrentBarcode(barcode);
    setShowBarcodeModal(true);
    console.log('🎟️ About to save coupon to user...');
    await saveCouponToUser(prize, barcode);
    console.log('🎟️ Coupon save completed');
  };

  const resetWheel = () => {
    // מתחילים איפוס מיד אחרי הסיבוב, במקביל לבאנר
    setIsResetting(true);
    
    // אנימציה שמחזירה את הגלגל למצב ההתחלתי
    Animated.timing(spinValue, {
      toValue: 0,
      duration: 2000, // 2 שניות כדי שיתסיים עם הבאנר
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start(() => {
      setIsResetting(false);
      setTargetIndex(-1);
      if (selectedIndex !== 2) { // לא סיבוב נוסף (אינדקס 2)
        setSelectedIndex(-1);
      }
    });
  };

  if (selectedIndex !== -1) {
    const currentPrize = PRIZES[selectedIndex];
    
    if (selectedIndex === 2) { // סיבוב נוסף (אינדקס 2)
      console.log('זכית בסיבוב נוסף!');
      startSpin(); // הפעל סיבוב נוסף
    } else {
      console.log(`זכית ב-${currentPrize.couponTitle}!`);
      resetWheel(); // מתאפסים רק אם זה לא סיבוב נוסף
      handlePrize(currentPrize, selectedIndex);
    }
  }

  // Simple iPad detection for responsive text (iPhone UI stays exactly the same)
  const { width: screenWidth } = Dimensions.get('window');
  const isIPad = Platform.OS === 'ios' && screenWidth >= 768;
  const responsiveFontSize = (baseSize: number) => isIPad ? baseSize * 1.2 : baseSize;

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
            <Text style={[styles.backButtonText, { fontSize: responsiveFontSize(18) }]}>חזרה לחנות</Text>
          </TouchableOpacity>

        <View style={styles.coinsContainer}>
          <View style={styles.coinsContent}>
            <Icon 
              name="cash-multiple" 
              size={28} 
              color="#FFD700" 
            />
            <Text style={[styles.coinsText, { fontSize: responsiveFontSize(18) }]}>
              {displayedCoins.toLocaleString()}
            </Text>
          </View>
          <Text style={[styles.coinsLabel, { fontSize: responsiveFontSize(14) }]}>
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
                transform: [
                  {
                    rotate: spinValue.interpolate({
                      inputRange: [0, 360],
                      outputRange: ['0deg', '360deg']
                    })
                  },
                  { scale: wheelPulseAnim }
                ],
                shadowOpacity: wheelGlowAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.3, 1],
                }),
                shadowRadius: wheelGlowAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [6, 25],
                }),
                elevation: wheelGlowAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [8, 25],
                }),
              }
            ]}
          >
            {renderWheel()}
            
            {/* זוהר מסביב לגלגל */}
            <Animated.View
              style={[
                styles.wheelGlow,
                {
                  opacity: wheelGlowAnim,
                  transform: [{ scale: wheelGlowAnim }],
                }
              ]}
            />
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
                (isSpinning || isResetting) && styles.spinButtonDisabled,
                hasFreeSpins && styles.freeSpinButton
              ]}
              onPress={startSpin}
              disabled={isSpinning || isResetting}
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
                  <View style={styles.spinButtonTextContainer}>
                    <Text style={[styles.spinButtonText, { fontSize: responsiveFontSize(24) }]}>
                      {getSpinButtonText()}
                    </Text>
                    {!hasFreeSpins && (
                      <Text style={[styles.spinCostText, { fontSize: responsiveFontSize(12) }]}>עלות סיבוב 1000 מטבעות</Text>
                    )}
                  </View>
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

        {/* באנר זכייה - עיצוב מעודכן */}
        {showWinBanner && currentPrize && (
          <View style={styles.bannerOverlay}>
            <Animated.View
              style={[
                styles.winBanner,
                {
                  transform: [{ scale: winBannerScale }],
                  opacity: winBannerOpacity,
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
                  {rewardText}
                </Text>
                <View style={styles.winBannerEmojis}>
                  {currentPrize.value === 1500 ? (
                    <>
                      <Text style={styles.winBannerEmoji}>🪙</Text>
                      <Text style={styles.winBannerEmoji}>🪙</Text>
                      <Text style={styles.winBannerEmoji}>🪙</Text>
                    </>
                  ) : (
                    <Text style={styles.winBannerEmoji}>{currentPrize.icon}</Text>
                  )}
                </View>
              </LinearGradient>
            </Animated.View>
          </View>
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

        {/* חלון ברקוד - זהה לחנות */}
        <Modal
          visible={showBarcodeModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowBarcodeModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.barcodeModal}>
              <Text style={styles.modalTitle}>
                {currentPrize?.couponTitle.replace('\n', ' ')}
              </Text>
              <View style={styles.qrContainer}>
                {currentPrize && (
                  <QRCode
                    value={`coupon-${currentPrize.couponTitle.replace('\n', '')}-${Date.now()}`}
                    size={200}
                  />
                )}
              </View>
              <Text style={styles.modalDescription}>
                הצג את הברקוד בקופה למימוש ההטבה
              </Text>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setShowBarcodeModal(false)}
              >
                <Text style={styles.closeButtonText}>סגור</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* חלון סיבוב נוסף */}
        <Modal
          visible={showFreeSpinModal}
          transparent={true}
          animationType="fade"
        >
          <View style={styles.specialModalOverlay}>
            <View style={styles.specialModalContent}>
              <LinearGradient
                colors={['#FFD700', '#FFA500']}
                style={styles.specialModalGradient}
              >
                <Text style={styles.specialModalIcon}>🎡</Text>
                <Text style={styles.specialModalTitle}>איזה כיף!</Text>
                <Text style={styles.specialModalSubtitle}>זכית בסיבוב נוסף!</Text>
              </LinearGradient>
            </View>
          </View>
        </Modal>

        {/* חלון מטבעות */}
        <Modal
          visible={showCoinsModal}
          transparent={true}
          animationType="fade"
        >
          <View style={styles.specialModalOverlay}>
            <View style={styles.specialModalContent}>
              <LinearGradient
                colors={['#4CAF50', '#45A049']}
                style={styles.specialModalGradient}
              >
                <Text style={styles.specialModalIcon}>🪙</Text>
                <Text style={styles.specialModalTitle}>מזל טוב!</Text>
                <Text style={styles.specialModalSubtitle}>נוספו לקופה שלך</Text>
                <Text style={styles.coinsAmountText}>1500 מטבעות!</Text>
                <View style={styles.coinsDisplayContainer}>
                  <Icon name="cash-multiple" size={24} color="#FFD700" />
                  <Text style={styles.currentCoinsText}>{displayedCoins.toLocaleString()}</Text>
                </View>
              </LinearGradient>
            </View>
          </View>
        </Modal>

      </LinearGradient>
      


      {/* התפרצות כוכבים */}
      {showStarburst && (
        <View style={styles.starburstContainer}>
          {[...Array(12)].map((_, index) => {
            const angle = (index * 30) * Math.PI / 180;
            const radius = 120;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;
            
            return (
              <Animated.View
                key={index}
                style={[
                  styles.starburstStar,
                  {
                    left: width / 2 + x,
                    top: Dimensions.get('window').height / 2 + y,
                    opacity: starburstAnim,
                    transform: [
                      {
                        scale: starburstAnim.interpolate({
                          inputRange: [0, 0.5, 1],
                          outputRange: [0, 1.5, 0.8],
                        })
                      },
                      {
                        rotate: starburstAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: ['0deg', '360deg'],
                        })
                      }
                    ]
                  }
                ]}
              >
                <Text style={styles.starburstIcon}>⭐</Text>
              </Animated.View>
            );
          })}
        </View>
      )}

      {/* נצנוצים */}
      {showSparkles && (
        <View style={styles.sparkleContainer}>
          {[...Array(20)].map((_, index) => {
            const randomX = Math.random() * width;
            const randomY = Math.random() * Dimensions.get('window').height;
            const randomDelay = Math.random() * 1000;
            
            return (
              <Animated.View
                key={index}
                style={[
                  styles.sparkle,
                  {
                    left: randomX,
                    top: randomY,
                    opacity: sparkleAnim,
                    transform: [
                      {
                        scale: sparkleAnim.interpolate({
                          inputRange: [0, 0.5, 1],
                          outputRange: [0, 1.2, 0],
                        })
                      }
                    ]
                  }
                ]}
              >
                <Text style={styles.sparkleIcon}>✨</Text>
              </Animated.View>
            );
          })}
        </View>
      )}
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
    color: '#000000',
    marginBottom: 20,
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
  bannerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 1000,
  },
  winBanner: {
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
  winBannerEmojis: {
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
  barcodeModal: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 20,
    alignItems: 'center',
  },
  qrContainer: {
    marginBottom: 20,
  },
  modalDescription: {
    color: '#000000',
    fontSize: 16,
    textAlign: 'center',
  },
  closeButton: {
    backgroundColor: '#FF6B6B',
    padding: 15,
    borderRadius: 25,
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  wheelGlow: {
    position: 'absolute',
    top: -20,
    left: -20,
    right: -20,
    bottom: -20,
    borderRadius: WHEEL_SIZE / 2 + 20,
    backgroundColor: '#FFD700',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 30,
    elevation: 20,
  },
  starburstContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1001,
    pointerEvents: 'none',
  },
  starburstStar: {
    position: 'absolute',
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  starburstIcon: {
    fontSize: 24,
    textShadowColor: '#FFD700',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  sparkleContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1002,
    pointerEvents: 'none',
  },
  sparkle: {
    position: 'absolute',
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sparkleIcon: {
    fontSize: 16,
    textShadowColor: '#FFFFFF',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 5,
  },
  spinButtonTextContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  spinCostText: {
    fontSize: 12,
    color: '#FFFFFF',
    opacity: 0.9,
    textAlign: 'center',
    marginTop: 4,
  },
  specialModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  specialModalContent: {
    width: '80%',
    borderRadius: 20,
    overflow: 'hidden',
  },
  specialModalGradient: {
    padding: 40,
    alignItems: 'center',
  },
  specialModalIcon: {
    fontSize: 60,
    marginBottom: 20,
  },
  specialModalTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 10,
    textAlign: 'center',
  },
  specialModalSubtitle: {
    fontSize: 24,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 10,
  },
  coinsAmountText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 20,
  },
  coinsDisplayContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 15,
    gap: 10,
  },
  currentCoinsText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});

export default LuckyWheelScreen; 