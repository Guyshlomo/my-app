import { Dimensions, Platform } from 'react-native';

const { width, height } = Dimensions.get('window');

// Detect if device is iPad
export const isIPad = Platform.OS === 'ios' && width >= 768;

// Get responsive padding based on device
export const getResponsivePadding = () => {
  if (isIPad) {
    return {
      horizontal: Math.max(width * 0.15, 60), // 15% of screen width, minimum 60
      vertical: 40,
    };
  }
  return {
    horizontal: 16, // iPhone - keep existing
    vertical: 16,
  };
};

// Get responsive font sizes
export const getResponsiveFontSize = (baseSize: number) => {
  if (isIPad) {
    return baseSize * 1.2; // 20% bigger on iPad
  }
  return baseSize; // iPhone - keep existing
};

// Get responsive dimensions
export const getResponsiveDimensions = () => {
  const padding = getResponsivePadding();
  
  return {
    containerWidth: isIPad ? Math.min(width - padding.horizontal * 2, 600) : width - padding.horizontal * 2,
    isIPad,
    screenWidth: width,
    screenHeight: height,
  };
};

// Get responsive margins
export const getResponsiveMargin = (baseMargin: number) => {
  if (isIPad) {
    return baseMargin * 1.5; // 50% bigger margins on iPad
  }
  return baseMargin; // iPhone - keep existing
}; 