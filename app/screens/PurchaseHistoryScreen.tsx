import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    Animated,
    Dimensions,
    FlatList,
    Modal,
    Platform,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    Vibration,
    View
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getCurrentUserFromSupabase, getUserPurchasedCoupons, markCouponAsUsed } from '../db/supabaseApi';

// Define PurchasedCoupon type locally since it's not exported from supabaseApi
interface PurchasedCoupon {
  id: string;
  coupon_id: string;
  coupon_title: string;
  coupon_description: string;
  coins_spent: number;
  created_at?: string;
  purchase_date?: string;
  is_used: boolean;
  barcode: string;
}

const { width } = Dimensions.get('window');

type RootStackParamList = {
  Gift: undefined;
  PurchaseHistory: undefined;
};

type NavigationProp = StackNavigationProp<RootStackParamList>;

const PurchaseHistoryScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const [purchasedCoupons, setPurchasedCoupons] = useState<PurchasedCoupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState<PurchasedCoupon | null>(null);
  const [showBarcodeModal, setShowBarcodeModal] = useState(false);
  const modalAnimation = React.useRef(new Animated.Value(0)).current;

  // Simple iPad detection for responsive text (iPhone UI stays exactly the same)
  const { width: screenWidth } = Dimensions.get('window');
  const isIPad = Platform.OS === 'ios' && screenWidth >= 768;
  const responsiveFontSize = (baseSize: number) => isIPad ? baseSize * 1.2 : baseSize;

  useEffect(() => {
    loadPurchasedCoupons();
  }, []);

  const loadPurchasedCoupons = async () => {
    try {
      setLoading(true);
      const currentUser = await getCurrentUserFromSupabase();
      if (!currentUser) {
        console.log('❌ לא נמצא משתמש מחובר');
        return;
      }

      const coupons = await getUserPurchasedCoupons(currentUser.id);
      console.log('🎟️ Loaded coupons from Supabase:', coupons.length, 'coupons');
      console.log('🎟️ Coupons data:', coupons);
      setPurchasedCoupons(coupons);
    } catch (error) {
      console.error('Error loading purchased coupons:', error);
      Alert.alert('שגיאה', 'לא ניתן לטעון את הקופונים');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadPurchasedCoupons();
  };

  const handleCouponPress = (coupon: PurchasedCoupon) => {
    if (coupon.is_used) {
      Alert.alert('קופון בשימוש', 'קופון זה כבר נוצל');
      return;
    }

    setSelectedCoupon(coupon);
    setShowBarcodeModal(true);
    modalAnimation.setValue(0);
    Animated.spring(modalAnimation, {
      toValue: 1,
      friction: 8,
      tension: 65,
      useNativeDriver: true
    }).start();
  };

  const closeBarcodeModal = () => {
    Animated.timing(modalAnimation, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setShowBarcodeModal(false);
      setSelectedCoupon(null);
    });
  };

  const handleMarkAsUsed = async (coupon: PurchasedCoupon) => {
    Alert.alert(
      'סימון כמשומש',
      'האם אתה בטוח שרצונך לסמן קופון זה כמשומש?',
      [
        { text: 'ביטול', style: 'cancel' },
        {
          text: 'כן, סמן כמשומש',
          onPress: async () => {
            try {
              const success = await markCouponAsUsed(coupon.id);
              if (success) {
                Vibration.vibrate(100);
                Alert.alert('הצלחה', 'הקופון סומן כמשומש');
                loadPurchasedCoupons(); // Refresh the list
                closeBarcodeModal();
              } else {
                Alert.alert('שגיאה', 'לא ניתן לסמן את הקופון כמשומש');
              }
            } catch (error) {
              console.error('Error marking coupon as used:', error);
              Alert.alert('שגיאה', 'אירעה שגיאה בעדכון הקופון');
            }
          }
        }
      ]
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('he-IL', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderCouponItem = ({ item }: { item: PurchasedCoupon }) => (
    <TouchableOpacity
      style={[
        styles.couponCard,
        item.is_used && styles.usedCouponCard
      ]}
      onPress={() => handleCouponPress(item)}
    >
      <View style={styles.couponHeader}>
        <Text style={[styles.couponTitle, item.is_used && styles.usedText, { fontSize: responsiveFontSize(18) }]}>
          {item.coupon_title}
        </Text>
        <View style={[
          styles.statusBadge,
          item.is_used ? styles.usedBadge : styles.activeBadge
        ]}>
          <Text style={styles.statusText}>
            {item.is_used ? 'נוצל' : 'פעיל'}
          </Text>
        </View>
      </View>
      
      <Text style={[styles.couponDescription, item.is_used && styles.usedText, { fontSize: responsiveFontSize(14) }]}>
        {item.coupon_description}
      </Text>
      
      <View style={styles.couponFooter}>
        <Text style={[styles.coinValue, item.is_used && styles.usedText, { fontSize: responsiveFontSize(16) }]}>
          💰 {item.coins_spent} מטבעות
        </Text>
        <Text style={[styles.purchaseDate, item.is_used && styles.usedText]}>
          {formatDate(item.created_at || item.purchase_date || new Date().toISOString())}
        </Text>
      </View>

      {item.is_used && (
        <View style={styles.usedOverlay}>
          <Text style={styles.usedOverlayText}>✓ נוצל</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const EmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateIcon}>🎁</Text>
      <Text style={[styles.emptyStateTitle, { fontSize: responsiveFontSize(24) }]}>אין קופונים עדיין</Text>
              <Text style={[styles.emptyStateSubtitle, { fontSize: responsiveFontSize(16) }]}>
          לך לחנות המתנות ורכוש קופונים עם המטבעות שלך!
        </Text>
      <TouchableOpacity
        style={styles.backToShopButton}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.backToShopText}>חזור לחנות</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { fontSize: responsiveFontSize(24) }]}>הקופונים שלי</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>טוען קופונים...</Text>
        </View>
      ) : (
        <FlatList
          data={purchasedCoupons}
          keyExtractor={(item) => item.id}
          renderItem={renderCouponItem}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={<EmptyState />}
        />
      )}

      {/* Barcode Modal */}
      <Modal
        visible={showBarcodeModal}
        transparent={true}
        animationType="fade"
        onRequestClose={closeBarcodeModal}
      >
        <Animated.View 
          style={[
            styles.modalOverlay,
            { opacity: modalAnimation }
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
              {selectedCoupon?.coupon_title}
            </Text>
            
            <View style={styles.qrContainer}>
              {selectedCoupon && (
                <QRCode
                  value={selectedCoupon.barcode}
                  size={200}
                />
              )}
            </View>
            
            <Text style={styles.modalDescription}>
              הצג את הברקוד בקופה למימוש ההטבה
            </Text>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.markUsedButton}
                onPress={() => selectedCoupon && handleMarkAsUsed(selectedCoupon)}
              >
                <Text style={styles.markUsedButtonText}>סמן כמשומש</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={closeBarcodeModal}
              >
                <Text style={styles.closeButtonText}>סגור</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </Animated.View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FEF6DA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#D7D2B6',
  },
  backIcon: {
    fontSize: 24,
    color: '#333',
    fontWeight: 'bold',
    padding: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  placeholder: {
    width: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    color: '#666',
  },
  listContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  couponCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    position: 'relative',
  },
  usedCouponCard: {
    backgroundColor: '#f5f5f5',
    opacity: 0.7,
  },
  couponHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  couponTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  activeBadge: {
    backgroundColor: '#4CAF50',
  },
  usedBadge: {
    backgroundColor: '#9E9E9E',
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  couponDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  couponFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  coinValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2D3748',
  },
  purchaseDate: {
    fontSize: 12,
    color: '#999',
  },
  usedText: {
    color: '#999',
  },
  usedOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#4CAF50',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderTopRightRadius: 15,
    borderBottomLeftRadius: 15,
  },
  usedOverlayText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 80,
  },
  emptyStateIcon: {
    fontSize: 80,
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  backToShopButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
  },
  backToShopText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
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
    width: width * 0.9,
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
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
    shadowOffset: { width: 0, height: 1 },
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
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  markUsedButton: {
    backgroundColor: '#FF9500',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 16,
  },
  markUsedButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  closeButton: {
    backgroundColor: '#2D3748',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 16,
  },
  closeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default PurchaseHistoryScreen; 