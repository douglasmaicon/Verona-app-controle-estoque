import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function AuditScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Tela de Auditoria</Text>
      <Text style={styles.subtitle}>Em desenvolvimento 🚧</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  text: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
});