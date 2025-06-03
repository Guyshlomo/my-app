import React from 'react';
import { SafeAreaView, StyleSheet, Text, View } from 'react-native';

function VolunteerScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.text}>Volunteer Screen</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FEF6DA',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 85, // Add margin to prevent content from being hidden behind the banner
  },
  text: {
    fontSize: 24,
    color: '#222',
  },
});

export default VolunteerScreen; 