import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Platform } from "react-native";
import { MaterialCommunityIcons, FontAwesome5 } from "@expo/vector-icons";

// Importação das telas
import HomeScreen from "../screens/HomeScreen";
import ProfileScreen from "../screens/ProfileScreen";
import DeliveryScreen from "../screens/DeliveryScreen";
import TransferScreen from "../screens/TransferScreen";
import ConferenceScreen from "../screens/ConferenceScreen";
import AuditScreen from "../screens/AuditScreen";

const Tab = createBottomTabNavigator();

// Configuração de ícones
const ICONS = {
  home: (props) => <MaterialCommunityIcons name="home" {...props} />,
  user: (props) => <MaterialCommunityIcons name="account" {...props} />,
  boxes: (props) => <FontAwesome5 name="boxes" {...props} />,
  truck: (props) => <MaterialCommunityIcons name="truck" {...props} />,
  transfer: (props) => <MaterialCommunityIcons name="swap-horizontal" {...props} />,
  audit: (props) => <MaterialCommunityIcons name="clipboard-check-outline" {...props} />,
};

// Cores do tema
const COLORS = {
  primary: "#47a2f5",
  active: "#ffffff",
  inactive: "#b3d9f7",
};

export default function MainNavigation({ user, onLogout }) {
  const { nome, tipo } = user || {};

  // Wrapper do ProfileScreen com props injetadas
  const ProfileScreenWrapper = (props) => (
    <ProfileScreen
      {...props}
      onLogout={onLogout}
      userName={nome || "Usuário"}
    />
  );

  // Definição de telas por tipo de usuário
  const getScreensByUserType = () => {
    const screens = {
      conferente: [
        {
          name: "Home",
          component: HomeScreen,
          icon: ICONS.home,
          label: "Início",
        },
        {
          name: "Conferências",
          component: ConferenceScreen,
          icon: ICONS.boxes,
          label: "Conferências",
        },
        {
          name: "Auditoria",
          component: AuditScreen,
          icon: ICONS.audit,
          label: "Auditoria",
        },
        {
          name: "Perfil",
          component: ProfileScreenWrapper,
          icon: ICONS.user,
          label: "Perfil",
        },
      ],
      entregador: [
        {
          name: "Home",
          component: HomeScreen,
          icon: ICONS.home,
          label: "Início",
        },
        {
          name: "Entregas",
          component: DeliveryScreen,
          icon: ICONS.truck,
          label: "Entregas",
        },
        {
          name: "Perfil",
          component: ProfileScreenWrapper,
          icon: ICONS.user,
          label: "Perfil",
        },
      ],
      vendedor: [
        {
          name: "Home",
          component: HomeScreen,
          icon: ICONS.home,
          label: "Início",
        },
        {
          name: "Transferências",
          component: TransferScreen,
          icon: ICONS.transfer,
          label: "Transferências",
        },
        {
          name: "Perfil",
          component: ProfileScreenWrapper,
          icon: ICONS.user,
          label: "Perfil",
        },
      ],
    };

    return screens[tipo] || screens.conferente;
  };

  const filteredScreens = getScreensByUserType();

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: COLORS.active,
        tabBarInactiveTintColor: COLORS.inactive,
        tabBarStyle: {
          backgroundColor: COLORS.primary,
          height: Platform.OS === "ios" ? 88 : 65,
          paddingBottom: Platform.OS === "ios" ? 28 : 8,
          paddingTop: 8,
          borderTopWidth: 0,
          elevation: 8,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "600",
          marginTop: 4,
        },
        headerShown: false,
        animation: "shift",
      }}
    >
      {filteredScreens.map((screen) => (
        <Tab.Screen
          key={screen.name}
          name={screen.name}
          component={screen.component}
          options={{
            tabBarLabel: screen.label || screen.name,
            tabBarIcon: ({ focused, color, size }) =>
              screen.icon({
                size: focused ? size + 2 : size,
                color,
              }),
          }}
        />
      ))}
    </Tab.Navigator>
  );
}