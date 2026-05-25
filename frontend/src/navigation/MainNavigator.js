import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import HomeScreen from '../screens/HomeScreen';
import UploadScreen from '../screens/UploadScreen';
import ProgressScreen from '../screens/ProgressScreen';
import ProfileScreen from '../screens/ProfileScreen';
import CameraCaptureScreen from '../screens/CameraCaptureScreen';
import { BRAND } from '../theme/brand';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const TAB_COLORS = {
  active: BRAND.medical600,
  inactive: '#9ca3af',
  barBg: BRAND.white,
  border: BRAND.neutral200,
};

function TabIcon({ label, focused }) {
  return (
    <Text style={[styles.tabIcon, { color: focused ? TAB_COLORS.active : TAB_COLORS.inactive }]}>
      {label}
    </Text>
  );
}

const TAB_BAR_CONTENT_HEIGHT = 56;

function MainTabs({ token, userEmail, onLogout, pendingCapture, onPendingCaptureHandled }) {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: TAB_COLORS.active,
        tabBarInactiveTintColor: TAB_COLORS.inactive,
        tabBarStyle: {
          ...styles.tabBar,
          height: TAB_BAR_CONTENT_HEIGHT + insets.bottom,
          paddingBottom: insets.bottom,
          paddingTop: 8,
        },
        tabBarLabelStyle: styles.tabBarLabel,
      }}
    >
      <Tab.Screen
        name="Home"
        options={{
          tabBarLabel: '홈',
          tabBarIcon: ({ focused }) => <TabIcon label="⌂" focused={focused} />,
        }}
      >
        {(props) => <HomeScreen {...props} token={token} />}
      </Tab.Screen>
      <Tab.Screen
        name="Analysis"
        options={{
          tabBarLabel: '분석',
          tabBarIcon: ({ focused }) => <TabIcon label="◎" focused={focused} />,
        }}
      >
        {(props) => (
          <UploadScreen
            {...props}
            token={token}
            pendingCapture={pendingCapture}
            onPendingCaptureHandled={onPendingCaptureHandled}
            onOpenCustomCamera={() => props.navigation.getParent()?.navigate('Camera')}
          />
        )}
      </Tab.Screen>
      <Tab.Screen
        name="Records"
        options={{
          tabBarLabel: '기록',
          tabBarIcon: ({ focused }) => <TabIcon label="▤" focused={focused} />,
        }}
      >
        {(props) => <ProgressScreen {...props} token={token} />}
      </Tab.Screen>
      <Tab.Screen
        name="Settings"
        options={{
          tabBarLabel: '설정',
          tabBarIcon: ({ focused }) => <TabIcon label="⚙" focused={focused} />,
        }}
      >
        {() => <ProfileScreen userEmail={userEmail} onLogout={onLogout} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

export default function MainNavigator({
  token,
  userEmail,
  onLogout,
  pendingCapture,
  onPendingCaptureHandled,
  onPendingCapture,
}) {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="MainTabs">
          {() => (
            <MainTabs
              token={token}
              userEmail={userEmail}
              onLogout={onLogout}
              pendingCapture={pendingCapture}
              onPendingCaptureHandled={onPendingCaptureHandled}
            />
          )}
        </Stack.Screen>
        <Stack.Screen
          name="Camera"
          options={{ presentation: 'fullScreenModal', animation: 'slide_from_bottom' }}
        >
          {({ navigation }) => (
            <CameraCaptureScreen
              onCapture={(asset) => {
                onPendingCapture(asset);
                navigation.goBack();
              }}
              onCancel={() => navigation.goBack()}
            />
          )}
        </Stack.Screen>
      </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: TAB_COLORS.barBg,
    borderTopWidth: 1,
    borderTopColor: TAB_COLORS.border,
  },
  tabBarLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  tabIcon: {
    fontSize: 20,
    marginBottom: 2,
  },
});
