import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { deleteConfig } from '../api/api';

export default function ProfileScreen({ userName, onLogout, onConfigDeleted }) {
  
  const handleDeleteConfig = () => {
    Alert.alert(
      'Excluir Configuração',
      'Tem certeza que deseja excluir a configuração do servidor? Você precisará configurar novamente.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteConfig();
              Alert.alert('Sucesso', 'Configuração excluída');
              onConfigDeleted && onConfigDeleted();
              onLogout();
            } catch (error) {
              Alert.alert('Erro', 'Não foi possível excluir a configuração');
            }
          },
        },
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert(
      'Sair',
      'Tem certeza que deseja sair?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sair',
          style: 'destructive',
          onPress: onLogout,
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header do Perfil */}
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <Ionicons name="person" size={50} color="#fff" />
        </View>
        <Text style={styles.userName}>{userName}</Text>
        <Text style={styles.userRole}>Usuário do Sistema</Text>
      </View>

      {/* Opções */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Configurações</Text>
        
        <TouchableOpacity style={styles.option} onPress={handleDeleteConfig}>
          <Ionicons name="trash-outline" size={24} color="#e74c3c" />
          <Text style={[styles.optionText, { color: '#e74c3c' }]}>
            Excluir Configuração do Servidor
          </Text>
          <Ionicons name="chevron-forward" size={20} color="#ccc" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.option} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={24} color="#e74c3c" />
          <Text style={[styles.optionText, { color: '#e74c3c' }]}>Sair</Text>
          <Ionicons name="chevron-forward" size={20} color="#ccc" />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingBottom: Platform.OS === 'ios' ? 88 : 70,
  },
  header: {
    backgroundColor: '#47a2f5',
    padding: 32,
    alignItems: 'center',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  userRole: {
    fontSize: 14,
    color: '#e3f2fd',
  },
  section: {
    padding: 16,
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  option: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  optionText: {
    flex: 1,
    fontSize: 16,
    marginLeft: 12,
  },
});