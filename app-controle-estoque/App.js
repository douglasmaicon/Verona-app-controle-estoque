import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { UserProvider } from './src/context/UserContext';
import { initConfigDatabase, getConfig } from './src/api/api';
import LoginScreen from './src/screens/LoginScreen';
import MainNavigation from './src/navigation/MainNavigation';

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [hasConfig, setHasConfig] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      // Inicializa banco de dados
      await initConfigDatabase();
      
      // Verifica se tem configuração salva
      const config = await getConfig();
      setHasConfig(!!config);
    } catch (error) {
      console.error('Erro ao inicializar app:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    setUser(null);
  };

  const handleConfigSaved = () => {
    setHasConfig(true);
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#47a2f5" />
      </View>
    );
  }

  return (
    <UserProvider>
      <NavigationContainer>
        {user ? (
          <MainNavigation user={user} onLogout={handleLogout} />
        ) : (
          <LoginScreen
            onLogin={handleLogin}
            isConfigMode={!hasConfig}
            onConfigSaved={handleConfigSaved}
          />
        )}
      </NavigationContainer>
    </UserProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});