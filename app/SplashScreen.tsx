import React, { useEffect } from 'react';
import { Animated, Easing, Image, Image as RNImage, StyleSheet, Text, View } from 'react-native';

// צבעים של שער הנגב (דוגמה, ניתן לעדכן לפי הצורך)
const COLORS = {
  blue: '#009FE3', // כחול
  green: '#8DC63F', // ירוק
  yellow: '#FFF200', // צהוב
  orange: '#F58220', // כתום
  white: '#FFFFFF',
};

const SplashScreen = () => {
  const scaleAnim = React.useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.1,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.8,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [scaleAnim]);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.logoContainer, { transform: [{ scale: scaleAnim }] }]}> 
        <Image source={require('../assets/images/shaarhanegev.png')} style={styles.logo} accessibilityLabel="שער הנגב לוגו" />
      </Animated.View>
      <Text style={styles.title}>ברוכים הבאים להתנדבות בקהילה!</Text>
      <Text style={styles.subtitle}>שער הנגב - עושים טוב יחד</Text>
      <View style={styles.bottomSection}>
        <Text style={styles.honorText}>זה לא שלם בלעדיהם 🎗️</Text>
        <View style={styles.honorImagesRow}>
          <RNImage source={require('../assets/images/galizivi.png')} style={styles.honorImage} />
          <RNImage source={require('../assets/images/omri.png')} style={styles.honorImage} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.blue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    backgroundColor: COLORS.yellow,
    borderRadius: 100,
    padding: 24,
    marginBottom: 32,
    borderWidth: 4,
    borderColor: COLORS.green,
    shadowColor: COLORS.orange,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  logo: {
    width: 120,
    height: 120,
    resizeMode: 'contain',
  },
  title: {
    fontSize: 26,
    color: COLORS.white,
    fontWeight: 'bold',
    marginBottom: 8,
    textShadowColor: COLORS.green,
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  subtitle: {
    fontSize: 18,
    color: COLORS.yellow,
    fontWeight: '600',
    textShadowColor: COLORS.orange,
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  bottomSection: {
    position: 'absolute',
    bottom: 32,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  honorText: {
    fontSize: 18,
    color: COLORS.white,
    fontWeight: 'bold',
    marginBottom: 8,
    textShadowColor: COLORS.orange,
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  honorImagesRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  honorImage: {
    width: 110,
    height: 110,
    borderRadius: 55,
    marginHorizontal: 10,
    borderWidth: 2,
    borderColor: COLORS.yellow,
    backgroundColor: COLORS.white,
  },
});

export default SplashScreen;
