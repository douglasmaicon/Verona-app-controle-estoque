import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useUser } from '../context/UserContext';

export default function HomeScreen() {
  const { user } = useUser();

  const cards = [
    { 
      icon: 'barcode-outline', 
      title: 'Últimas Leituras', 
      value: '0', 
      color: '#FF9800'
    },
    { 
      icon: 'cube-outline', 
      title: 'Itens no Estoque', 
      value: '-', 
      color: '#2196F3' 
    },
    { 
      icon: 'checkmark-circle-outline', 
      title: 'Conferências Hoje', 
      value: '0', 
      color: '#4CAF50' 
    },
  ];

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.greeting}>Olá, {user?.nome || 'Usuário'}! 👋</Text>
        <Text style={styles.subtitle}>Bem-vindo ao sistema de controle</Text>
      </View>

      {/* Cards de Estatísticas */}
      <View style={styles.cardsContainer}>
        {cards.map((card, index) => (
          <View key={index} style={[styles.card, { borderLeftColor: card.color }]}>
            <Ionicons name={card.icon} size={32} color={card.color} />
            <Text style={styles.cardTitle}>{card.title}</Text>
            <Text style={styles.cardValue}>{card.value}</Text>
          </View>
        ))}
      </View>

      {/* Ações Rápidas */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Ações Rápidas</Text>
        
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="scan-outline" size={24} color="#47a2f5" />
          <Text style={styles.actionText}>Escanear Código de Barras</Text>
          <Ionicons name="chevron-forward" size={20} color="#ccc" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="document-text-outline" size={24} color="#47a2f5" />
          <Text style={styles.actionText}>Ver Relatórios</Text>
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
    padding: 24,
    paddingTop: 40,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#e3f2fd',
  },
  cardsContainer: {
    padding: 16,
    gap: 12,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
  cardValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 4,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  actionButton: {
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
  actionText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
  },
});