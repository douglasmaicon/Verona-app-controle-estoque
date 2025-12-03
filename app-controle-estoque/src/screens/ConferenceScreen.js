import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
  Vibration,
  Platform,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { getApiBaseUrl } from '../api/api';
import { useUser } from '../context/UserContext';

export default function ConferenceScreen() {
  const { user } = useUser();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [lastScannedCode, setLastScannedCode] = useState(null);

  // Função chamada quando um código é escaneado
  const handleBarCodeScanned = async ({ type, data }) => {
    if (scanned) return; // Evita múltiplas leituras

    setScanned(true);
    Vibration.vibrate(100); // Feedback tátil
    setLastScannedCode(data);

    console.log(`Código escaneado: ${data} (Tipo: ${type})`);

    // Processa o código
    await processBarcode(data);
  };

  // Processa o código de barras (envia pro backend)
  const processBarcode = async (barcode) => {
    setIsLoading(true);
    try {
      const baseUrl = await getApiBaseUrl();
      
      const response = await fetch(`${baseUrl}/liberar-mercadoria`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          codigoBarras: barcode,
          usuarioId: user?.id,
          usuarioNome: user?.nome,
          timestamp: new Date().toISOString(),
        }),
      });

      const result = await response.json();

      if (response.ok) {
        Alert.alert(
          '✅ Sucesso!',
          result.message || 'Mercadoria liberada com sucesso!',
          [{ text: 'OK', onPress: resetScanner }]
        );
      } else {
        Alert.alert(
          '❌ Erro',
          result.error || 'Não foi possível liberar a mercadoria',
          [{ text: 'OK', onPress: resetScanner }]
        );
      }
    } catch (error) {
      console.error('Erro ao processar código:', error);
      Alert.alert(
        'Erro de Conexão',
        'Não foi possível conectar ao servidor. Verifique sua conexão.',
        [{ text: 'OK', onPress: resetScanner }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Reseta o scanner para escanear novamente
  const resetScanner = () => {
    setScanned(false);
    setLastScannedCode(null);
  };

  // Abre o scanner
  const openScanner = async () => {
    if (!permission?.granted) {
      const { granted } = await requestPermission();
      if (!granted) {
        Alert.alert('Permissão negada', 'É necessário permitir acesso à câmera');
        return;
      }
    }
    setIsScanning(true);
    setScanned(false);
  };

  // Fecha o scanner
  const closeScanner = () => {
    setIsScanning(false);
    setScanned(false);
    setLastScannedCode(null);
  };

  // Verifica permissão
  if (!permission) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#47a2f5" />
        <Text style={styles.text}>Carregando...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Ionicons name="camera-off" size={64} color="#e74c3c" />
          <Text style={styles.errorText}>Sem acesso à câmera</Text>
          <Text style={styles.subtitle}>
            É necessário permitir o acesso à câmera
          </Text>
        </View>
        <TouchableOpacity
          style={styles.scanButton}
          onPress={requestPermission}
          activeOpacity={0.8}
        >
          <Ionicons name="camera-outline" size={32} color="#fff" />
          <Text style={styles.scanButtonText}>Solicitar Permissão</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Ionicons name="scan-outline" size={48} color="#47a2f5" />
        <Text style={styles.title}>Conferência de Mercadorias</Text>
        <Text style={styles.subtitle}>
          Escaneie o código de barras para liberar
        </Text>
      </View>

      {/* Botão para abrir scanner */}
      <TouchableOpacity
        style={styles.scanButton}
        onPress={openScanner}
        activeOpacity={0.8}
      >
        <Ionicons name="barcode-outline" size={32} color="#fff" />
        <Text style={styles.scanButtonText}>Iniciar Scanner</Text>
      </TouchableOpacity>

      {/* Último código escaneado */}
      {lastScannedCode && (
        <View style={styles.lastScanContainer}>
          <Text style={styles.lastScanLabel}>Último código:</Text>
          <Text style={styles.lastScanCode}>{lastScannedCode}</Text>
        </View>
      )}

      {/* Instruções */}
      <View style={styles.instructionsContainer}>
        <Text style={styles.instructionsTitle}>Como usar:</Text>
        <View style={styles.instruction}>
          <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
          <Text style={styles.instructionText}>
            Toque em "Iniciar Scanner"
          </Text>
        </View>
        <View style={styles.instruction}>
          <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
          <Text style={styles.instructionText}>
            Aponte a câmera para o código CODE128
          </Text>
        </View>
        <View style={styles.instruction}>
          <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
          <Text style={styles.instructionText}>
            Aguarde a confirmação
          </Text>
        </View>
      </View>

      {/* Modal do Scanner */}
      <Modal
        visible={isScanning}
        animationType="slide"
        onRequestClose={closeScanner}
      >
        <View style={styles.scannerContainer}>
          {/* Header do Scanner */}
          <View style={styles.scannerHeader}>
            <TouchableOpacity onPress={closeScanner} style={styles.closeButton}>
              <Ionicons name="close" size={32} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.scannerTitle}>Escaneie o código</Text>
          </View>

          {/* Câmera */}
          <CameraView
            style={StyleSheet.absoluteFillObject}
            facing="back"
            onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
            barcodeScannerSettings={{
              barcodeTypes: ["code128"],
            }}
          />

          {/* Overlay com guia visual */}
          <View style={styles.overlay}>
            <View style={styles.scanArea}>
              <View style={[styles.corner, styles.topLeft]} />
              <View style={[styles.corner, styles.topRight]} />
              <View style={[styles.corner, styles.bottomLeft]} />
              <View style={[styles.corner, styles.bottomRight]} />
            </View>
            <Text style={styles.scanInstruction}>
              Posicione o código dentro da área
            </Text>
          </View>

          {/* Loading overlay */}
          {isLoading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color="#fff" />
              <Text style={styles.loadingText}>Processando...</Text>
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingBottom: Platform.OS === 'ios' ? 88 : 70,
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
    marginTop: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  text: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
  },
  errorText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#e74c3c',
    marginTop: 16,
  },
  scanButton: {
    backgroundColor: '#47a2f5',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#47a2f5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
    marginBottom: 24,
  },
  scanButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 12,
  },
  lastScanContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  lastScanLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  lastScanCode: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  instructionsContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  instruction: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  instructionText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  scannerContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  scannerHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingTop: 48,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    zIndex: 10,
  },
  closeButton: {
    padding: 8,
  },
  scannerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginRight: 48,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanArea: {
    width: 300,
    height: 200,
    borderWidth: 2,
    borderColor: '#fff',
    borderRadius: 12,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: '#47a2f5',
    borderWidth: 4,
  },
  topLeft: {
    top: -2,
    left: -2,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderTopLeftRadius: 12,
  },
  topRight: {
    top: -2,
    right: -2,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
    borderTopRightRadius: 12,
  },
  bottomLeft: {
    bottom: -2,
    left: -2,
    borderRightWidth: 0,
    borderTopWidth: 0,
    borderBottomLeftRadius: 12,
  },
  bottomRight: {
    bottom: -2,
    right: -2,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderBottomRightRadius: 12,
  },
  scanInstruction: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 32,
    textAlign: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 12,
    borderRadius: 8,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    fontSize: 18,
    marginTop: 16,
  },
});