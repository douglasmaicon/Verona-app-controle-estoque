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