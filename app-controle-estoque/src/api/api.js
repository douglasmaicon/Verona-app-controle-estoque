import * as SQLite from 'expo-sqlite';

// Abre/cria o banco de dados
const db = SQLite.openDatabaseSync('controle_estoque.db');

// Inicializa a tabela de configuração
export const initConfigDatabase = async () => {
  try {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS config (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        host TEXT NOT NULL,
        port INTEGER NOT NULL
      );
    `);
    console.log('Banco de dados inicializado');
  } catch (error) {
    console.error('Erro ao inicializar banco:', error);
    throw error;
  }
};

// Salva configuração do servidor
export const saveConfig = async (host, port) => {
  try {
    // Apaga config antiga
    await db.runAsync('DELETE FROM config;');
    // Insere nova
    await db.runAsync(
      'INSERT INTO config (host, port) VALUES (?, ?);',
      [host, port]
    );
    console.log('Configuração salva:', host, port);
  } catch (error) {
    console.error('Erro ao salvar config:', error);
    throw error;
  }
};

// Busca configuração salva
export const getConfig = async () => {
  try {
    const result = await db.getFirstAsync('SELECT * FROM config LIMIT 1;');
    return result || null;
  } catch (error) {
    console.error('Erro ao buscar config:', error);
    throw error;
  }
};

// Deleta configuração
export const deleteConfig = async () => {
  try {
    await db.runAsync('DELETE FROM config;');
    console.log('Configuração deletada');
  } catch (error) {
    console.error('Erro ao deletar config:', error);
    throw error;
  }
};

// Retorna URL base da API
export const getApiBaseUrl = async () => {
  const config = await getConfig();
  if (!config) {
    throw new Error('Configuração não encontrada. Configure o servidor primeiro.');
  }
  return `http://${config.host}:${config.port}`;
};

// ========== FUNÇÕES PARA DELIVERY (VOLUMES LIDOS) ==========
// Inicializa tabela de volumes lidos
export const initVolumesDatabase = async () => {
  try {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS volumes_lidos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        codigoBarras TEXT NOT NULL UNIQUE,
        produto_codigo INTEGER NOT NULL,
        itemVenda_codigo INTEGER NOT NULL,
        dataLeitura TEXT NOT NULL
      );
    `);
    console.log('Tabela volumes_lidos inicializada');
  } catch (error) {
    console.error('Erro ao inicializar tabela volumes_lidos:', error);
    throw error;
  }
};

// Verifica se código de barras já foi lido
export const verificarCodigoLido = async (codigoBarras) => {
  try {
    const result = await db.getFirstAsync(
      'SELECT * FROM volumes_lidos WHERE codigoBarras = ?;',
      [codigoBarras]
    );
    return result !== null;
  } catch (error) {
    console.error('Erro ao verificar código:', error);
    throw error;
  }
};

// Salva leitura de código de barras
export const salvarCodigoLido = async (codigoBarras, produtoCodigo, itemVendaCodigo) => {
  try {
    await db.runAsync(
      'INSERT INTO volumes_lidos (codigoBarras, produto_codigo, itemVenda_codigo, dataLeitura) VALUES (?, ?, ?, ?);',
      [codigoBarras, produtoCodigo, itemVendaCodigo, new Date().toISOString()]
    );
    console.log('Código salvo:', codigoBarras);
  } catch (error) {
    console.error('Erro ao salvar código:', error);
    throw error;
  }
};

// Busca volumes lidos de um item
export const buscarVolumesLidos = async (itemVendaCodigo) => {
  try {
    const result = await db.getAllAsync(
      'SELECT * FROM volumes_lidos WHERE itemVenda_codigo = ? ORDER BY dataLeitura;',
      [itemVendaCodigo]
    );
    return result || [];
  } catch (error) {
    console.error('Erro ao buscar volumes:', error);
    throw error;
  }
};

// Limpa volumes lidos (após liberar entrega)
export const limparVolumesLidos = async (itemVendaCodigo) => {
  try {
    await db.runAsync(
      'DELETE FROM volumes_lidos WHERE itemVenda_codigo = ?;',
      [itemVendaCodigo]
    );
    console.log('Volumes lidos limpos para item:', itemVendaCodigo);
  } catch (error) {
    console.error('Erro ao limpar volumes:', error);
    throw error;
  }
};