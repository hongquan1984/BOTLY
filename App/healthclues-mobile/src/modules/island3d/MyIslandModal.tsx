import React from 'react';
import { Modal, StyleSheet, View } from 'react-native';
import { MyIslandScreen } from './components/MyIslandScreen';

interface MyIslandModalProps {
  visible: boolean;
  onClose: () => void;
  userId?: string;
}

export const MyIslandModal: React.FC<MyIslandModalProps> = ({
  visible,
  onClose,
  userId = 'player_hero_01',
}) => {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <MyIslandScreen userId={userId} onBackToHealthClues={onClose} />
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#022c22',
  },
});
