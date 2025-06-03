import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import React, { useEffect, useRef, useState } from 'react';
import {
    Animated,
    Dimensions,
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
import AnimatedAvatar from '../components/AnimatedAvatar';
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

export default function HomeScreen() {
  const navigation = useNavigation<NavigationProp>();
  const scrollViewRef = useRef<ScrollView | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userCoins, setUserCoins] = React.useState(0);
  const [confettiVisible, setConfettiVisible] = React.useState(false);
  const [isAvatarWalking, setIsAvatarWalking] = useState(false);
  const avatarPosition = React.useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const lastProgress = React.useRef(0);

  // טעינת נתוני המשתמש בעת טעינת המסך
  useEffect(() => {
    loadUserData();
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

  // יצירת מערך שלבים לפי כמות מטבעות
  const stages = React.useMemo(() => Array.from({ length: 15 }, (_, i) => {
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
      status
    };
  }), [userCoins]);

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
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        bounces={false}
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
            const animation = React.useRef(new Animated.Value(stage.status === 'completed' ? 1 : 0)).current;
            const isOpening = stage.status === 'current';

            React.useEffect(() => {
              if (isOpening) {
                Animated.timing(animation, {
                  toValue: 1,
                  duration: 1000,
                  useNativeDriver: false
                }).start();
              }
            }, [isOpening]);

            const bgColor = animation.interpolate({
              inputRange: [0, 1],
              outputRange:
                stage.status === 'locked'
                  ? ['#aaa', '#aaa']
                  : stage.status === 'current'
                  ? ['#f1c40f', '#2ecc71']
                  : ['#2ecc71', '#2ecc71']
            });

            const borderWidth = stage.status === 'current' ? 2 : 0;
            const borderColor = stage.status === 'current' ? '#f1c40f' : 'transparent';

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
                <Animated.View
                  style={[
                    styles.stage,
                    {
                      left: x,
                      top: y,
                      width: STAGE_SIZE,
                      height: STAGE_SIZE,
                      borderRadius: STAGE_SIZE / 2,
                      backgroundColor: bgColor,
                      borderWidth,
                      borderColor,
                      elevation: 0,
                      shadowOpacity: 0,
                      shadowRadius: 0,
                      shadowOffset: { width: 0, height: 0 },
                    }
                  ]}
                >
                  {stage.status === 'locked' ? (
                    <Text style={styles.lockText}>🔒</Text>
                  ) : (
                    <Text style={styles.starText}>★</Text>
                  )}
                  <Text style={styles.stageNumber}>{stage.number}</Text>
                </Animated.View>
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

          {/* אווטאר מונפש */}
          {(() => {
            const currentIdx = stages.findIndex(s => s.status === 'current');
            if (currentIdx === -1 || currentIdx === stages.length - 1) return null;

            const fromPos = getStagePosition(currentIdx);
            const toPos = getStagePosition(currentIdx + 1);
            const direction = toPos.x > fromPos.x ? 'right' : 'left';

              return (
              <Animated.View
                style={{
                  position: 'absolute',
                  transform: [
                    { translateX: avatarPosition.x },
                    { translateY: avatarPosition.y }
                  ],
                  zIndex: 30
                }}
              >
                <AnimatedAvatar
                  isWalking={isAvatarWalking}
                  direction={direction}
                  size={50}
                />
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
  }
});