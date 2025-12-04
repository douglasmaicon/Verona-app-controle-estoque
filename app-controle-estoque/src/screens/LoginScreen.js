import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Image,
} from "react-native";
import { Formik } from "formik";
import * as Yup from "yup";
import { Ionicons } from "@expo/vector-icons";
import { getApiBaseUrl, saveConfig } from "../api/api";
import { useUser } from "../context/UserContext";

// Schemas de validação
const loginValidationSchema = Yup.object({
  nome: Yup.string()
    .required("Nome é obrigatório")
    .min(3, "Nome deve ter pelo menos 3 caracteres"),
  password: Yup.string()
    .required("Senha é obrigatória")
    .min(3, "Senha deve ter pelo menos 3 caracteres"),
});

const ipRegex = /^(25[0-5]|2[0-4]\d|1?\d?\d)(\.(25[0-5]|2[0-4]\d|1?\d?\d)){3}$/;
const configValidationSchema = Yup.object({
  host: Yup.string()
    .required("Host é obrigatório")
    .matches(ipRegex, "Endereço IP inválido (ex: 192.168.0.10)"),
  port: Yup.number()
    .typeError("Porta deve ser numérica")
    .integer("Porta inválida")
    .min(1, "Porta inválida")
    .max(65535, "Porta inválida")
    .required("Porta é obrigatória"),
});

export default function LoginScreen({ 
  onLogin, 
  isConfigMode = false, 
  onConfigSaved 
}) {
  const { setUser } = useUser();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (values) => {
    setIsLoading(true);
    try {
      const baseUrl = await getApiBaseUrl();
      console.log("Tentando login em:", baseUrl);

      const response = await fetch(`${baseUrl}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nome: values.nome,
          senha: values.password,
        }),
      });

      console.log("Status da resposta:", response.status);

      if (response.status === 200) {
        const user = await response.json();
        setUser(user);
        onLogin(user);
      } else if (response.status === 401) {
        Alert.alert("Erro de autenticação", "Login ou senha incorretos");
      } else {
        Alert.alert("Erro", "Erro inesperado ao tentar logar");
      }
    } catch (error) {
      console.error("Erro na requisição:", error);
      Alert.alert(
        "Erro de conexão",
        "Não foi possível conectar com o servidor. Verifique sua conexão e tente novamente."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveConfig = async (values) => {
    setIsLoading(true);
    try {
      await saveConfig(values.host.trim(), parseInt(values.port, 10));
      Alert.alert("Sucesso", "Configuração salva com sucesso!");
      onConfigSaved && onConfigSaved();
    } catch (e) {
      console.error("Erro ao salvar configuração:", e);
      Alert.alert("Erro", "Não foi possível salvar a configuração.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <View style={styles.overlay}>
        <View style={styles.formContainer}>
          {isConfigMode ? (
            // MODO CONFIGURAÇÃO
            <>
              <View style={styles.header}>
                <Ionicons name="settings-outline" size={50} color="#47a2f5" />
                <Text style={styles.title}>Configuração</Text>
                <Text style={styles.subtitle}>
                  Configure o servidor para começar
                </Text>
              </View>

              <Formik
                initialValues={{ host: "", port: "" }}
                validationSchema={configValidationSchema}
                onSubmit={handleSaveConfig}
              >
                {({
                  handleChange,
                  handleBlur,
                  handleSubmit,
                  values,
                  errors,
                  touched,
                }) => (
                  <>
                    <View style={styles.inputContainer}>
                      <Ionicons
                        name="server-outline"
                        size={20}
                        color="#666"
                        style={styles.inputIcon}
                      />
                      <TextInput
                        style={styles.input}
                        placeholder="Host (ex: 192.168.0.10)"
                        placeholderTextColor="#999"
                        onChangeText={handleChange("host")}
                        onBlur={handleBlur("host")}
                        value={values.host}
                        autoCapitalize="none"
                        keyboardType="numeric"
                      />
                    </View>
                    {touched.host && errors.host && (
                      <Text style={styles.errorText}>{errors.host}</Text>
                    )}

                    <View style={styles.inputContainer}>
                      <Ionicons
                        name="wifi-outline"
                        size={20}
                        color="#666"
                        style={styles.inputIcon}
                      />
                      <TextInput
                        style={styles.input}
                        placeholder="Porta (ex: 8080)"
                        placeholderTextColor="#999"
                        onChangeText={handleChange("port")}
                        onBlur={handleBlur("port")}
                        value={values.port}
                        keyboardType="numeric"
                      />
                    </View>
                    {touched.port && errors.port && (
                      <Text style={styles.errorText}>{errors.port}</Text>
                    )}

                    <TouchableOpacity
                      style={[
                        styles.button,
                        isLoading && styles.buttonDisabled,
                      ]}
                      onPress={handleSubmit}
                      disabled={isLoading}
                      activeOpacity={0.8}
                    >
                      {isLoading ? (
                        <ActivityIndicator color="#fff" />
                      ) : (
                        <>
                          <Ionicons name="save-outline" size={20} color="#fff" />
                          <Text style={styles.buttonText}>Salvar</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </>
                )}
              </Formik>
            </>
          ) : (
            // MODO LOGIN
            <>
              <View style={styles.header}>
                <View style={styles.logoContainer}>                  
                  <Image
                    source={require('../../assets/verona_completo.png')}
                    style={styles.logo}
                    resizeMode="contain"
                  />
                                 
                </View>
                <Text style={styles.subtitle}>
                  Faça login para continuar
                </Text>
              </View>

              <Formik
                initialValues={{ nome: "", password: "" }}
                validationSchema={loginValidationSchema}
                onSubmit={handleLogin}
              >
                {({
                  handleChange,
                  handleBlur,
                  handleSubmit,
                  values,
                  errors,
                  touched,
                }) => (
                  <>
                    <View style={styles.inputContainer}>
                      <Ionicons
                        name="person-outline"
                        size={20}
                        color="#666"
                        style={styles.inputIcon}
                      />
                      <TextInput
                        style={styles.input}
                        autoCapitalize="none"
                        placeholder="Nome de usuário"
                        placeholderTextColor="#999"
                        onChangeText={handleChange("nome")}
                        onBlur={handleBlur("nome")}
                        value={values.nome}
                      />
                    </View>
                    {touched.nome && errors.nome && (
                      <Text style={styles.errorText}>{errors.nome}</Text>
                    )}

                    <View style={styles.inputContainer}>
                      <Ionicons
                        name="lock-closed-outline"
                        size={20}
                        color="#666"
                        style={styles.inputIcon}
                      />
                      <TextInput
                        style={styles.input}
                        placeholder="Senha"
                        placeholderTextColor="#999"
                        secureTextEntry={!showPassword}
                        onChangeText={handleChange("password")}
                        onBlur={handleBlur("password")}
                        value={values.password}
                      />
                      <TouchableOpacity
                        onPress={() => setShowPassword(!showPassword)}
                        style={styles.eyeIcon}
                      >
                        <Ionicons
                          name={showPassword ? "eye-off-outline" : "eye-outline"}
                          size={20}
                          color="#666"
                        />
                      </TouchableOpacity>
                    </View>
                    {touched.password && errors.password && (
                      <Text style={styles.errorText}>{errors.password}</Text>
                    )}

                    <TouchableOpacity
                      style={[
                        styles.button,
                        isLoading && styles.buttonDisabled,
                      ]}
                      onPress={handleSubmit}
                      disabled={isLoading}
                      activeOpacity={0.8}
                    >
                      {isLoading ? (
                        <ActivityIndicator color="#fff" />
                      ) : (
                        <>
                          <Ionicons name="log-in-outline" size={20} color="#fff" />
                          <Text style={styles.buttonText}>Entrar</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </>
                )}
              </Formik>
            </>
          )}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    paddingBottom: Platform.OS === 'ios' ? 88 : 70,
  },
  overlay: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
  },
  formContainer: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  header: {
    alignItems: "center",
    marginBottom: 32,
  },
  logoContainer: {
    width: 60,
    height: 60,
    borderRadius: 50,
    backgroundColor: "#e3f2fd",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 40,
  },
  logo: {
    width: 280,
    height: 280,
    // borderRadius: 50,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    marginBottom: 12,
    paddingHorizontal: 12,
    height: 50,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#333",
  },
  eyeIcon: {
    padding: 4,
  },
  errorText: {
    color: "#e74c3c",
    fontSize: 12,
    marginBottom: 8,
    marginLeft: 4,
  },
  button: {
    backgroundColor: "#47a2f5",
    borderRadius: 12,
    height: 50,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
    shadowColor: "#47a2f5",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    backgroundColor: "#a0c4e8",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 8,
  },
});