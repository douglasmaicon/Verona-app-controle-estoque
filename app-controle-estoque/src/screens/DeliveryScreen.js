import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
  Vibration,
  RefreshControl,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { getApiBaseUrl, verificarCodigoLido, salvarCodigoLido, buscarVolumesLidos, limparVolumesLidos } from '../api/api';
import { useUser } from '../context/UserContext';

export default function DeliveryScreen() {
  const { user } = useUser();
  const [permission, requestPermission] = useCameraPermissions();
  
  // Estados
  const [vendas, setVendas] = useState([]);
  const [vendaSelecionada, setVendaSelecionada] = useState(null);
  const [itemSelecionado, setItemSelecionado] = useState(null);
  const [volumesLidos, setVolumesLidos] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [sound, setSound] = useState(null);

  useEffect(() => {
    carregarVendas();
    carregarSom();
    
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, []);

  // Carrega som de beep
  const carregarSom = async () => {
    try {
      const { sound } = await Audio.Sound.createAsync(
        require('../../assets/beep.mp3') // Vamos criar este arquivo
      );
      setSound(sound);
    } catch (error) {
      console.log('Erro ao carregar som:', error);
    }
  };

  // Toca beep
  const tocarBeep = async () => {
    if (soundEnabled && sound) {
      try {
        await sound.replayAsync();
      } catch (error) {
        console.log('Erro ao tocar som:', error);
      }
    }
  };

  // Carrega vendas pendentes do backend
  const carregarVendas = async () => {
    setIsLoading(true);
    try {
      const baseUrl = await getApiBaseUrl();
      console.log('Buscando vendas em:', `${baseUrl}/vendas-pendentes`);
      
      const response = await fetch(`${baseUrl}/vendas-pendentes`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Vendas recebidas:', JSON.stringify(data, null, 2));
        setVendas(data);
      } else {
        Alert.alert('Erro', 'Não foi possível carregar as vendas');
      }
    } catch (error) {
      console.error('Erro ao carregar vendas:', error);
      Alert.alert('Erro de Conexão', 'Não foi possível conectar ao servidor');
    } finally {
      setIsLoading(false);
    }
  };

  // Pull to refresh
  const onRefresh = async () => {
    setIsRefreshing(true);
    await carregarVendas();
    setIsRefreshing(false);
  };

  // Seleciona uma venda
  const selecionarVenda = (venda) => {
    setVendaSelecionada(venda);
    setItemSelecionado(null);
    setVolumesLidos([]);
  };

  // Seleciona um item para leitura
  const selecionarItem = async (item) => {
    console.log('Item selecionado:', JSON.stringify(item, null, 2));
    setItemSelecionado(item);
    // Carrega volumes já lidos do SQLite
    const volumes = await buscarVolumesLidos(item.codigo);
    setVolumesLidos(volumes);
  };

  // Abre o scanner
  const abrirScanner = async () => {
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
  const fecharScanner = () => {
    setIsScanning(false);
    setScanned(false);
  };

  // Processa código de barras escaneado
  const handleBarCodeScanned = async ({ data }) => {
    if (scanned || !itemSelecionado) return;

    setScanned(true);
    Vibration.vibrate(100);
    tocarBeep();

    console.log('Código escaneado:', data);
    console.log('Produto esperado:', itemSelecionado.produto_codigo);

    try {
      // PRIMEIRO: Extrai código do produto e valida
      const codigoProdutoLido = extrairCodigoProduto(data);
      const codigoProdutoEsperado = itemSelecionado.produto_codigo.toString();

      console.log('Código extraído:', codigoProdutoLido);
      console.log('Código esperado:', codigoProdutoEsperado);

      if (codigoProdutoLido !== codigoProdutoEsperado) {
        Alert.alert(
          '❌ Código Inválido', 
          `Este código pertence ao produto ${codigoProdutoLido}, mas você está lendo volumes do produto ${codigoProdutoEsperado} (${itemSelecionado.produtoNome})`,
          [{ text: 'OK', onPress: () => setScanned(false) }]
        );
        return;
      }

      // DEPOIS: Verifica se já foi lido PARA ESTE ITEM
      const volumesAtuais = await buscarVolumesLidos(itemSelecionado.codigo);
      const jaLidoNesteItem = volumesAtuais.some(v => v.codigoBarras === data);
      
      if (jaLidoNesteItem) {
        Alert.alert('Atenção', 'Este código já foi lido para este item!', [
          { text: 'OK', onPress: () => setScanned(false) }
        ]);
        return;
      }

      // Salva no SQLite
      await salvarCodigoLido(data, itemSelecionado.produto_codigo, itemSelecionado.codigo);

      // Atualiza lista de volumes lidos
      const volumes = await buscarVolumesLidos(itemSelecionado.codigo);
      setVolumesLidos(volumes);

      // Verifica se completou todos os volumes
      if (volumes.length >= itemSelecionado.totalVolumesEsperados) {
        fecharScanner();
        // Não pede confirmação, libera direto
        liberarEntrega();
      } else {
        Alert.alert(
          '✓ Volume Registrado!',
          `${volumes.length}/${itemSelecionado.totalVolumesEsperados} volumes lidos`,
          [{ text: 'OK', onPress: () => setScanned(false) }]
        );
      }
    } catch (error) {
      console.error('Erro ao processar código:', error);
      Alert.alert('Erro', 'Erro ao processar código de barras: ' + error.message, [
        { text: 'OK', onPress: () => setScanned(false) }
      ]);
    }
  };

  // Extrai código do produto do CODE128
  const extrairCodigoProduto = (codigoBarras) => {
    // Remove últimos 8 caracteres (6 data + 2 sequencial)
    if (codigoBarras.length < 9) return '';
    return codigoBarras.slice(0, -8);
  };

  // Libera entrega no backend
  const liberarEntrega = async () => {
    setIsLoading(true);
    try {
      const baseUrl = await getApiBaseUrl();
      const codigosBarras = volumesLidos.map(v => v.codigoBarras);

      console.log('Liberando entrega:', {
        itemVendaCodigo: itemSelecionado.codigo,
        usuarioId: user?.id || user?.codigo,
        usuarioNome: user?.nome,
        codigosBarras: codigosBarras
      });

      const response = await fetch(`${baseUrl}/liberar-entrega`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemVendaCodigo: itemSelecionado.codigo,
          usuarioId: user?.id || user?.codigo, // Tenta id ou codigo
          usuarioNome: user?.nome,
          codigosBarras: codigosBarras,
        }),
      });

      const result = await response.json();
      console.log('Resposta do servidor:', result);

      if (response.ok && result.success) {
        // Limpa volumes lidos do SQLite
        await limparVolumesLidos(itemSelecionado.codigo);
        
        Alert.alert('✅ Sucesso!', result.message, [
          { text: 'OK', onPress: () => {
            setItemSelecionado(null);
            setVolumesLidos([]);
            carregarVendas();
          }}
        ]);
      } else {
        Alert.alert('Erro', result.message || 'Erro: ' + JSON.stringify(result));
      }
    } catch (error) {
      console.error('Erro ao liberar entrega:', error);
      Alert.alert('Erro de Conexão', 'Detalhes: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Volta para lista de vendas
  const voltarParaVendas = () => {
    setVendaSelecionada(null);
    setItemSelecionado(null);
    setVolumesLidos([]);
  };

  // Volta para lista de itens
  const voltarParaItens = () => {
    setItemSelecionado(null);
    setVolumesLidos([]);
  };

  // Renderiza card de venda
  const renderVenda = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => selecionarVenda(item)}
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>Venda #{item.codigo}</Text>
        <Ionicons name="chevron-forward" size={20} color="#999" />
      </View>
      <Text style={styles.cardSubtitle}>{item.clienteNome}</Text>
      <View style={styles.cardRow}>
        <Ionicons name="location-outline" size={16} color="#666" />
        <Text style={styles.cardText}>
          {item.logradouro}, {item.numero} - {item.bairro}
        </Text>
      </View>
      <View style={styles.cardFooter}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{item.itens.length} itens</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  // Renderiza card de item
  const renderItem = ({ item }) => {
    const isLiberado = item.libEntrega === 'SIM';
    
    return (
      <TouchableOpacity
        style={[styles.card, isLiberado && styles.cardLiberado]}
        onPress={() => selecionarItem(item)}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <View style={styles.itemTitleContainer}>
            <Text style={styles.cardTitle}>{item.produtoNome}</Text>
            <Text style={styles.produtoCodigo}>Cód: {item.produto_codigo}</Text>
          </View>
          {isLiberado ? (
            <Ionicons name="checkmark-circle" size={32} color="#4CAF50" />
          ) : (
            <Ionicons name="chevron-forward" size={20} color="#999" />
          )}
        </View>
        <View style={styles.cardRow}>
          <Text style={styles.cardLabel}>Quantidade:</Text>
          <Text style={styles.cardValue}>{item.quantidade} un.</Text>
        </View>
        <View style={styles.cardRow}>
          <Text style={styles.cardLabel}>Volumes por unidade:</Text>
          <Text style={styles.cardValue}>{item.volumesPorUnidade}</Text>
        </View>
        <View style={styles.cardRow}>
          <Text style={styles.cardLabel}>Total de volumes:</Text>
          <Text style={[styles.cardValue, styles.highlight]}>
            {item.totalVolumesEsperados}
          </Text>
        </View>
        {isLiberado && (
          <View style={styles.liberadoBadge}>
            <Text style={styles.liberadoText}>✓ Liberado para entrega</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  // Renderiza volume lido
  const renderVolume = ({ item, index }) => (
    <View style={styles.volumeItem}>
      <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
      <View style={styles.volumeInfo}>
        <Text style={styles.volumeNumero}>Volume {index + 1}</Text>
        <Text style={styles.volumeCodigo}>{item.codigoBarras}</Text>
      </View>
    </View>
  );

  // Loading inicial
  if (isLoading && vendas.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#47a2f5" />
        <Text style={styles.loadingText}>Carregando vendas...</Text>
      </View>
    );
  }

  // Tela de detalhes do item (scanner)
  if (itemSelecionado) {
    const isLiberado = itemSelecionado.libEntrega === 'SIM';
    
    return (
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={voltarParaItens} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Leitura de Volumes</Text>
        </View>

        {/* Info do Item */}
        <View style={styles.itemInfo}>
          <View style={styles.itemHeader}>
            <Text style={styles.itemNome}>{itemSelecionado.produtoNome}</Text>
            {!isLiberado && (
              <TouchableOpacity 
                onPress={() => setSoundEnabled(!soundEnabled)}
                style={styles.soundButton}
              >
                <Ionicons 
                  name={soundEnabled ? 'volume-high' : 'volume-mute'} 
                  size={24} 
                  color={soundEnabled ? '#47a2f5' : '#999'} 
                />
              </TouchableOpacity>
            )}
          </View>
          <View style={styles.progressContainer}>
            <Text style={styles.progressText}>
              {isLiberado 
                ? `Item liberado - ${itemSelecionado.totalVolumesEsperados} volumes`
                : `${volumesLidos.length} / ${itemSelecionado.totalVolumesEsperados} volumes lidos`
              }
            </Text>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill,
                  isLiberado && styles.progressFillCompleto,
                  { width: isLiberado ? '100%' : `${(volumesLidos.length / itemSelecionado.totalVolumesEsperados) * 100}%` }
                ]} 
              />
            </View>
          </View>
        </View>

        {/* Botão Scanner */}
        {!isLiberado && (
          <TouchableOpacity
            style={[
              styles.scanButton,
              volumesLidos.length >= itemSelecionado.totalVolumesEsperados && styles.scanButtonDisabled
            ]}
            onPress={abrirScanner}
            disabled={volumesLidos.length >= itemSelecionado.totalVolumesEsperados}
          >
            <Ionicons name="scan-outline" size={32} color="#fff" />
            <Text style={styles.scanButtonText}>
              {volumesLidos.length >= itemSelecionado.totalVolumesEsperados
                ? 'Todos os volumes lidos'
                : 'Escanear Código'
              }
            </Text>
          </TouchableOpacity>
        )}

        {/* Lista de Volumes Lidos */}
        <View style={styles.volumesContainer}>
          <Text style={styles.sectionTitle}>
            {isLiberado ? 'Item Liberado:' : 'Volumes Escaneados:'}
          </Text>
          {volumesLidos.length > 0 ? (
            <FlatList
              data={volumesLidos}
              renderItem={renderVolume}
              keyExtractor={(item) => item.id.toString()}
            />
          ) : (
            <Text style={styles.emptyText}>
              {isLiberado ? 'Volumes já foram liberados' : 'Nenhum volume escaneado ainda'}
            </Text>
          )}
        </View>

        {/* Botão Liberar */}
        {!isLiberado && volumesLidos.length >= itemSelecionado.totalVolumesEsperados && (
          <TouchableOpacity
            style={styles.liberarButton}
            onPress={liberarEntrega}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="checkmark-done-outline" size={24} color="#fff" />
                <Text style={styles.liberarButtonText}>Liberar para Entrega</Text>
              </>
            )}
          </TouchableOpacity>
        )}

        {isLiberado && (
          <View style={styles.itemLiberadoContainer}>
            <Ionicons name="checkmark-circle" size={64} color="#4CAF50" />
            <Text style={styles.itemLiberadoTitle}>Item Liberado!</Text>
            <Text style={styles.itemLiberadoSubtitle}>
              Este item já foi liberado para entrega
            </Text>
          </View>
        )}

        {/* Modal Scanner */}
        <Modal visible={isScanning} animationType="slide">
          <View style={styles.scannerContainer}>
            <View style={styles.scannerHeader}>
              <TouchableOpacity onPress={fecharScanner} style={styles.closeButton}>
                <Ionicons name="close" size={32} color="#fff" />
              </TouchableOpacity>
              <Text style={styles.scannerTitle}>Escaneie o código</Text>
              <TouchableOpacity 
                onPress={() => setSoundEnabled(!soundEnabled)}
                style={styles.soundButtonScanner}
              >
                <Ionicons 
                  name={soundEnabled ? 'volume-high' : 'volume-mute'} 
                  size={28} 
                  color="#fff" 
                />
              </TouchableOpacity>
            </View>

            <CameraView
              style={StyleSheet.absoluteFillObject}
              facing="back"
              onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
              barcodeScannerSettings={{ barcodeTypes: ['code128'] }}
            />

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
          </View>
        </Modal>
      </View>
    );
  }

  // Tela de itens da venda
  if (vendaSelecionada) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={voltarParaVendas} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Venda #{vendaSelecionada.codigo}</Text>
        </View>

        <View style={styles.vendaInfo}>
          <Text style={styles.clienteNome}>{vendaSelecionada.clienteNome}</Text>
          <Text style={styles.endereco}>
            {vendaSelecionada.logradouro}, {vendaSelecionada.numero}
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Selecione um item:</Text>

        <FlatList
          data={vendaSelecionada.itens}
          renderItem={renderItem}
          keyExtractor={(item) => item.codigo.toString()}
          contentContainerStyle={styles.list}
        />
      </View>
    );
  }

  // Tela de lista de vendas
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="truck-outline" size={32} color="#fff" />
        <Text style={styles.headerTitle}>Entregas Pendentes</Text>
      </View>

      {vendas.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="checkmark-done-circle-outline" size={64} color="#ccc" />
          <Text style={styles.emptyTitle}>Nenhuma entrega pendente</Text>
          <Text style={styles.emptySubtitle}>Todas as entregas foram liberadas!</Text>
        </View>
      ) : (
        <FlatList
          data={vendas}
          renderItem={renderVenda}
          keyExtractor={(item) => item.codigo.toString()}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  header: {
    backgroundColor: '#47a2f5',
    padding: 20,
    paddingTop: 50,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
  },
  list: {
    padding: 16,
    gap: 12,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardLiberado: {
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
    backgroundColor: '#f1f8f4',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemTitleContainer: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  produtoCodigo: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  cardSubtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 8,
  },
  cardText: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  cardLabel: {
    fontSize: 14,
    color: '#666',
  },
  cardValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  highlight: {
    color: '#47a2f5',
    fontSize: 16,
  },
  cardFooter: {
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badge: {
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    color: '#47a2f5',
    fontWeight: 'bold',
  },
  vendaInfo: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  clienteNome: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  endereco: {
    fontSize: 14,
    color: '#666',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    margin: 16,
    marginBottom: 8,
  },
  itemInfo: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  itemNome: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  soundButton: {
    padding: 8,
  },
  progressContainer: {
    gap: 8,
  },
  progressText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
  },
  scanButton: {
    backgroundColor: '#47a2f5',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  scanButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  volumesContainer: {
    flex: 1,
    padding: 16,
  },
  volumeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    gap: 12,
  },
  volumeInfo: {
    flex: 1,
  },
  volumeNumero: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  volumeCodigo: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    fontSize: 14,
    marginTop: 20,
  },
  liberarButton: {
    backgroundColor: '#4CAF50',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  liberarButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
});