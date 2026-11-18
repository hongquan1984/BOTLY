import React from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { MyIslandScreen } from './src/components/MyIslandScreen';

export default function App() {
  return (
    <SafeAreaProvider>
      <View style={styles.container}>
        <MyIslandScreen
          userId="player_hero_01"
          onBackToHealthClues={() => {
            console.log('Navigating back to HealthClues World');
          }}
        />
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#022c22',
  },
});
