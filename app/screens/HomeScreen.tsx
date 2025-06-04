import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
    Animated,
    Dimensions,
    Easing,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import ConfettiCannon from 'react-native-confetti-cannon';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { addCoinsUpdateListener, removeCoinsUpdateListener } from '../utils/eventEmitter';
import { User, userManager } from '../utils/userManager';

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
};

type NavigationProp = StackNavigationProp<RootStackParamList>;

// הוספת טיפים והודעות מהאווטר
const AVATAR_MESSAGES = {
  lowCoins: 'בוא נתנדב יחד כדי להרוויח עוד מטבעות! 💪',
  closeToNextStage: 'כמעט שם! עוד קצת להשלמת השלב! 🎯',
  stageComplete: 'כל הכבוד! השלמת את השלב! 🌟',
  dailyTip: 'היי! יש לנו היום הזדמנויות התנדבות חדשות! 🎁',
};

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

export default function HomeScreen() {
  const navigation = useNavigation<NavigationProp>();
  const scrollViewRef = useRef<ScrollView | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userCoins, setUserCoins] = React.useState(0);
  const [confettiVisible, setConfettiVisible] = React.useState(false);
  const [isAvatarWalking, setIsAvatarWalking] = useState(false);
  const [avatarMessage, setAvatarMessage] = useState('');
  const [showTip, setShowTip] = useState(false);
  const [totalStages, setTotalStages] = useState(15);
  const [currentAvatar, setCurrentAvatar] = useState('🐣');
  const avatarPosition = React.useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const lastProgress = useRef(0);
  const messageOpacity = useRef(new Animated.Value(0)).current;
  const [selectedStage, setSelectedStage] = useState<number | null>(null);
  const stageScale = useRef(new Animated.Value(1)).current;
  const messageSlideAnim = useRef(new Animated.Value(-100)).current;
  const prevCompletedStagesRef = useRef(0);
  const prevCurrentAvatarRef = useRef(currentAvatar);
  const [messageQueue, setMessageQueue] = useState<string[]>([]);
  const animationState = useRef({ isAnimating: false }).current;

  // טעינת נתוני המשתמש בעת טעינת המסך
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

  const loadUserData = async () => {
    const user = await userManager.getCurrentUser();
    if (user) {
      setCurrentUser(user);
      setUserCoins(user.coins);
    }
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
    await userManager.updateUserCoins(newCoins);
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

  // יצירת מערך שלבים דינמי
  const stages = React.useMemo(() => Array.from({ length: totalStages }, (_, i) => {
    const number = i + 1;
    const requiredCoins = number * 100;
    let status: 'completed' | 'current' | 'locked';
    
    if (userCoins >= requiredCoins) {
      status = 'completed';
    } else if (userCoins >= i * 100) {
      status = 'current';
    } else {
      status = 'locked';
    }
    
    return {
      number,
      coins: requiredCoins,
      status,
      avatar: getAvatarForStage(number)
    };
  }), [userCoins, totalStages]);

  function getStagePosition(index: number) {
    const leftX = horizontalPadding;
    const rightX = width - STAGE_SIZE - horizontalPadding;
    const y = (stages.length - 1 - index) * verticalGap + INITIAL_STAGE_OFFSET;
    const x = index % 2 === 0 ? rightX : leftX;
    return { x, y };
  }

  // קונפטי כאשר שלב נפתח
  const prevStages = React.useRef(stages.map(s => s.status));
  React.useEffect(() => {
    const prev = prevStages.current;
    let opened = false;
    for (let i = 0; i < stages.length; i++) {
      if ((prev[i] === 'locked') && (stages[i].status !== 'locked')) {
        opened = true;
        break;
      }
    }
    if (opened) {
      setConfettiVisible(true);
      setTimeout(() => setConfettiVisible(false), 2500);
    }
    prevStages.current = stages.map(s => s.status);
  }, [stages]);

  // אנימציית אווטאר בין שלבים
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
    if (Math.abs(progress - lastProgress.current) > 0.01) {
      setIsAvatarWalking(true);

      // חישוב נקודת היעד על המסלול
      const targetX = fromCenterX + (toCenterX - fromCenterX) * progress;
      const targetY = fromCenterY + (toCenterY - fromCenterY) * progress + 
                     Math.sin(progress * Math.PI * 2) * 8 * (1 - Math.abs(progress - 0.5));

      // אנימציה חלקה למיקום החדש
      Animated.spring(avatarPosition, {
        toValue: {
          x: targetX - 20,
          y: targetY - 20
        },
        useNativeDriver: true,
        friction: 8,
        tension: 40,
        restDisplacementThreshold: 0.01,
        restSpeedThreshold: 0.01
      }).start(() => {
        setIsAvatarWalking(false);
      });

      // עדכון הסקרול כדי לעקוב אחרי האווטר באופן אוטומטי
      const targetScrollY = Math.max(0, targetY - 300); // שומר על האווטר במרכז המסך
      
      // אנימציה חלקה של הסקרול
      Animated.spring(new Animated.Value((scrollViewRef.current as any)?.contentOffset?.y || 0), {
        toValue: targetScrollY,
        useNativeDriver: false,
        friction: 8,
        tension: 40
      }).start(({ finished }) => {
        if (finished) {
          scrollViewRef.current?.scrollTo({
            y: targetScrollY,
            animated: false
          });
        }
      });

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

  // פונקציה להוספת הודעה לתור
  const queueMessage = useCallback((message: string) => {
    setMessageQueue(prev => [...prev, message]);
  }, []);

  // טיפול בהודעות בתור
  useLayoutEffect(() => {
    if (messageQueue.length > 0 && !animationState.isAnimating && !showTip) {
      animationState.isAnimating = true;
      const currentMessage = messageQueue[0];
      
      setAvatarMessage(currentMessage);
      setShowTip(true);
      messageSlideAnim.setValue(-100);
      messageOpacity.setValue(0);

      Animated.parallel([
        Animated.timing(messageSlideAnim, {
          toValue: 120,
          duration: 600,
          easing: Easing.out(Easing.back(1.5)),
          useNativeDriver: true
        }),
        Animated.timing(messageOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true
        })
      ]).start();

      const hideTimer = setTimeout(() => {
        Animated.parallel([
          Animated.timing(messageSlideAnim, {
            toValue: -100,
            duration: 400,
            useNativeDriver: true
          }),
          Animated.timing(messageOpacity, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true
          })
        ]).start(() => {
          setShowTip(false);
          setMessageQueue(prev => prev.slice(1));
          animationState.isAnimating = false;
        });
      }, 3000);

      return () => {
        clearTimeout(hideTimer);
        animationState.isAnimating = false;
      };
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

  // בדיקת מצב המשתמש והצגת טיפים רלוונטיים
  useEffect(() => {
    const checkUserProgress = () => {
      const currentStage = stages.find(s => s.status === 'current');
      if (!currentStage) return;

      const coinsToNext = currentStage.coins - userCoins;
      
      if (coinsToNext <= 20) {
        queueMessage(AVATAR_MESSAGES.closeToNextStage);
      } else if (userCoins < 50) {
        queueMessage(AVATAR_MESSAGES.lowCoins);
      }
    };

    checkUserProgress();
  }, [userCoins, stages]);

  // הוספת טיפ יומי בטעינת המסך
  useEffect(() => {
    const timeout = setTimeout(() => {
      queueMessage(AVATAR_MESSAGES.dailyTip);
    }, 1000);

    return () => clearTimeout(timeout);
  }, []);

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
      queueMessage(`נדרשים ${stage.coins} מטבעות לפתיחת השלב הזה! 🔒`);
    } else if (stage.status === 'completed') {
      queueMessage('כל הכבוד! השלמת את השלב הזה! 🌟');
    } else {
      const coinsNeeded = stage.coins - userCoins;
      queueMessage(`עוד ${coinsNeeded} מטבעות להשלמת השלב! 💪`);
    }

    // אנימציית האווטר לשלב הנבחר
    if (stage.status !== 'locked') {
      const stagePos = getStagePosition(index);
      setIsAvatarWalking(true);
      
      Animated.spring(avatarPosition, {
        toValue: {
          x: stagePos.x + STAGE_SIZE / 2 - 20,
          y: stagePos.y + STAGE_SIZE / 2 - 20
        },
        friction: 6,
        tension: 40,
        useNativeDriver: true
      }).start(() => {
        setIsAvatarWalking(false);
        if (stage.status === 'current') {
          queueMessage('אני כאן! בוא נתקדם יחד! 🚀');
        }
      });
    }
  };

  // בדיקה והוספת שלבים חדשים
  useLayoutEffect(() => {
    const completedStages = stages.filter(s => s.status === 'completed').length;
    
    if (completedStages !== prevCompletedStagesRef.current) {
      prevCompletedStagesRef.current = completedStages;
      
      if (completedStages >= totalStages - 3) {
        setTotalStages(prev => prev + 5);
        queueMessage('נפתחו שלבים חדשים! 🎉');
      }
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

  return (
    <View style={styles.wrapper}>
      {/* באנר עליון קבוע */}
      <View style={styles.topBanner}>
        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, justifyContent: 'flex-start' }}>
          <Image 
            source={{ uri: currentUser?.profileImage }} 
            style={styles.profileImageLarge}
            defaultSource={require('../../assets/images/icon.png')}
          />
          <View style={{ marginLeft: 10 }}>
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#222' }}>
              {`שלום, ${currentUser?.firstName || 'אורח'}!`}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
              <Image source={require('../../assets/images/coin.png')} style={{ width: 20, height: 20, marginRight: 4 }} />
              <Text style={{ fontSize: 15, color: '#2D5DC6', fontWeight: 'bold' }}>{`יש לך ${animatedCoins} מטבעות`}</Text>
            </View>
            <Text onPress={handleAddCoins} style={{ color: '#2D5DC6', fontSize: 13, marginTop: 4, textDecorationLine: 'underline' }}>
              + הוסף 20 מטבעות (הדגמה)
            </Text>
          </View>
        </View>
      </View>

      {/* תוכן גולל */}
      <ScrollView 
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={{
          paddingBottom: BOTTOM_BANNER_HEIGHT + BOTTOM_PADDING,
          minHeight: verticalGap * totalStages + BOTTOM_PADDING + INITIAL_STAGE_OFFSET
        }}
        showsVerticalScrollIndicator={true}
        bounces={true}
        scrollEventThrottle={16}
      >
        <View style={styles.stagesContainer}>
          {stages.slice(0, -1).map((_, i) => {
            const from = getStagePosition(i);
            const to = getStagePosition(i + 1);
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
            return (
              <Svg
                key={`sinpath-${i}`}
                style={{ position: 'absolute', left: 0, top: 0, zIndex: 1 }}
                width={width}
                height={stages.length * verticalGap + 120}
                pointerEvents="none"
              >
                <Path
                  d={path}
                  stroke="#B8860B"
                  strokeWidth={3}
                  fill="none"
                  opacity={0.7}
                  strokeDasharray="8 6"
                />
              </Svg>
            );
          })}

          {stages.map((stage, i) => {
            const { x, y } = getStagePosition(i);
            const isSelected = selectedStage === i;

            return (
              <React.Fragment key={i}>
                {confettiVisible && i === 4 && (
                  <ConfettiCannon
                    count={80}
                    origin={{ x: width / 2, y: 0 }}
                    fadeOut
                    autoStart
                    explosionSpeed={350}
                  />
                )}
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
                      backgroundColor: stage.status === 'locked' ? '#aaa' : stage.status === 'current' ? '#f1c40f' : '#2ecc71',
                      borderWidth: isSelected ? 2 : 0,
                      borderColor: isSelected ? '#f1c40f' : 'transparent',
                      elevation: 0,
                      shadowOpacity: 0,
                      shadowRadius: 0,
                      shadowOffset: { width: 0, height: 0 },
                      transform: [
                        { scale: isSelected ? stageScale : 1 }
                      ]
                    }
                  ]}
                >
                  {stage.status === 'locked' ? (
                    <Text style={styles.lockText}>🔒</Text>
                  ) : (
                    <Text style={styles.starText}>★</Text>
                  )}
                  <Text style={styles.stageNumber}>{stage.number}</Text>
                </TouchableOpacity>
                {/* כמות מטבעות מתחת לשלבים */}
                <View style={{
                  position: 'absolute',
                  left: x + STAGE_SIZE / 2 - 32,
                  top: y + STAGE_SIZE + 2,
                  width: 64,
                  alignItems: 'center'
                }}>
                  <View style={{
                    backgroundColor: stage.status === 'locked' ? '#444' : stage.status === 'current' ? '#f1c40f' : '#2ecc71',
                    borderRadius: 8,
                    paddingHorizontal: 8,
                    paddingVertical: 2,
                    shadowColor: '#000',
                    shadowOpacity: 0.12,
                    shadowRadius: 2,
                    shadowOffset: { width: 0, height: 1 }
                  }}>
                    <Text style={{
                      color: 'white',
                      fontWeight: 'bold',
                      fontSize: 11
                    }}>
                      {`${i * 100} מטבעות`}
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

            const fromPos = getStagePosition(currentIdx);
            const toPos = getStagePosition(currentIdx + 1);
            const direction = toPos.x > fromPos.x ? 'right' : 'left';

            return (
              <Animated.View
                style={{
                  position: 'absolute',
                  transform: [
                    { translateX: avatarPosition.x },
                    { translateY: avatarPosition.y },
                    { scaleX: direction === 'left' ? -1 : 1 }
                  ],
                  zIndex: 30
                }}
              >
                <View style={styles.avatarContainer}>
                  <Text style={styles.avatarEmoji}>{currentAvatar}</Text>
                </View>
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
            onPress={() => navigation.navigate('Trophy')}
          >
            <Image 
              source={require('../../assets/images/trophy.png')}
              style={styles.bannerIcon}
            />
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
            onPress={() => navigation.navigate('Calendar')}
          >
            <Image 
              source={require('../../assets/images/calander.png')}
              style={styles.bannerIcon}
            />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.bannerIconWrap}
            onPress={() => navigation.navigate('Volunteer', { from: 'Home' })}
          >
            <Image 
              source={require('../../assets/images/volunteer.png')}
              style={styles.bannerIcon}
            />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* הודעות אווטר */}
      {showTip && (
        <Animated.View 
          style={[
            styles.avatarMessage,
            {
              opacity: messageOpacity,
              transform: [{ translateY: messageSlideAnim }],
              position: 'absolute',
              top: 0,
              left: 20,
              right: 20,
              zIndex: 1000,
            }
          ]}
        >
          <Text style={styles.messageText}>{avatarMessage}</Text>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: '#FEF6DA',
  },
  scrollView: {
    flex: 1,
    marginTop: 30, // הקטנת המרווח מ-60 ל-30
  },
  contentContainer: {
    paddingBottom: BOTTOM_BANNER_HEIGHT + BOTTOM_PADDING,
    minHeight: verticalGap * 15 + BOTTOM_PADDING + INITIAL_STAGE_OFFSET,
  },
  stagesContainer: {
    flex: 1,
    position: 'relative',
  },
  topBanner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    width: '100%',
    height: 120,
    backgroundColor: '#FEF6DA',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingTop: 60,
    zIndex: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 5,
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
    zIndex: 1000,
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
  profileImageLarge: {
    width: 66,
    height: 66,
    borderRadius: 33,
    borderWidth: 3,
    borderColor: '#f1c40f',
    marginLeft: 0,
    marginRight: 0,
    backgroundColor: '#fff',
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
  avatarEmoji: {
    fontSize: 40,
    textAlign: 'center',
  }
});