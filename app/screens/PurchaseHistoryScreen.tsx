import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    Image,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { userManager } from '../utils/userManager';

const { width } = Dimensions.get('window');
const QR_SIZE = width * 0.4;

interface PurchasedCoupon {
  id: number;
  title: string;
  desc: string;
  coins: number;
  purchaseDate: string;
  barcode: string;
  isUsed: boolean;
}

function PurchaseHistoryScreen() {
  const navigation = useNavigation();
  const [purchases, setPurchases] = useState<PurchasedCoupon[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadPurchaseHistory();
  }, []);

  const loadPurchaseHistory = async () => {
    try {
      const purchasedCoupons = await userManager.getPurchasedCoupons();
      if (purchasedCoupons) {
        setPurchases(purchasedCoupons.map(coupon => ({
          id: coupon.id,
          title: coupon.title,
          desc: coupon.desc,
          coins: coupon.coins,
          purchaseDate: coupon.purchaseDate,
          barcode: `coupon-${coupon.id}-${Date.now()}`,
          isUsed: coupon.isUsed
        })));
      }
    } catch (error) {
      console.error('Error loading purchase history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUseCoupon = async (couponId: number) => {
    try {
      const success = await userManager.markCouponAsUsed(couponId);
      if (success) {
        // עדכון הרשימה המקומית
        setPurchases(prevPurchases =>
          prevPurchases.map(purchase =>
            purchase.id === couponId
              ? { ...purchase, isUsed: true }
              : purchase
          )
        );
      }
    } catch (error) {
      console.error('Error marking coupon as used:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('he-IL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#FEE2F8', '#A6E3E9']}
        style={styles.gradientBg}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <SafeAreaView style={styles.safeArea}>
          {/* כותרת */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.backArrow}>←</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>הקופונים שלי</Text>
          </View>

          {isLoading ? (
            <ActivityIndicator size="large" color="#2D3748" style={styles.loader} />
          ) : (
            <ScrollView 
              style={styles.scrollView} 
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              {purchases.map((purchase) => (
                <View
                  key={`${purchase.id}-${purchase.purchaseDate}`}
                  style={[
                    styles.purchaseCard,
                    purchase.isUsed && styles.usedPurchaseCard
                  ]}
                >
                  <View style={styles.purchaseHeader}>
                    <Text style={styles.purchaseTitle}>{purchase.title}</Text>
                    <Text style={styles.purchaseDate}>
                      {formatDate(purchase.purchaseDate)}
                    </Text>
                  </View>
                  
                  <Text style={styles.purchaseDesc}>{purchase.desc}</Text>
                  
                  <View style={styles.coinContainer}>
                    <Text style={styles.coinText}>{purchase.coins}</Text>
                    <Image
                      source={require('../../assets/images/coin.png')}
                      style={styles.coinIcon}
                      resizeMode="contain"
                    />
                  </View>

                  {purchase.isUsed ? (
                    <View style={styles.usedStamp}>
                      <Text style={styles.usedStampText}>✓ קופון זה מומש</Text>
                    </View>
                  ) : (
                    <View style={styles.qrContainer}>
                      <QRCode
                        value={purchase.barcode}
                        size={QR_SIZE}
                        backgroundColor="white"
                      />
                      <Text style={styles.qrText}>הצג בקופה למימוש</Text>
                    </View>
                  )}
                </View>
              ))}
            </ScrollView>
          )}
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
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  backButton: {
    position: 'absolute',
    left: 16,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 3.84,
    elevation: 5,
  },
  backArrow: {
    fontSize: 28,
    color: '#2D3748',
    fontWeight: '300',
    marginLeft: -2,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2D3748',
    textAlign: 'center',
  },
  loader: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  purchaseCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    alignItems: 'center',
  },
  usedPurchaseCard: {
    opacity: 0.7,
    backgroundColor: '#F7FAFC',
  },
  purchaseHeader: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  purchaseTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2D3748',
    flex: 1,
  },
  purchaseDate: {
    fontSize: 14,
    color: '#718096',
    marginLeft: 8,
  },
  purchaseDesc: {
    fontSize: 16,
    color: '#4A5568',
    marginBottom: 16,
    alignSelf: 'flex-start',
  },
  coinContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: '#FFF9E6',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  coinIcon: {
    width: 20,
    height: 20,
    marginLeft: 4,
  },
  coinText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2D3748',
  },
  qrContainer: {
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F7FAFC',
    borderRadius: 12,
    width: '100%',
  },
  qrText: {
    marginTop: 12,
    fontSize: 16,
    color: '#4A5568',
    fontWeight: '500',
  },
  usedStamp: {
    backgroundColor: '#E2E8F0',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 8,
  },
  usedStampText: {
    fontSize: 16,
    color: '#718096',
    fontWeight: '500',
  },
});

export default PurchaseHistoryScreen; 