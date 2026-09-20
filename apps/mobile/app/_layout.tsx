import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Colors } from '../constants/colors';
import { AuthProvider } from '../contexts/AuthContext';
import { MobileContainer } from '../components/ui/MobileContainer';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StatusBar style="light" backgroundColor={Colors.primary.orange} />
        <MobileContainer>
          <RootNavigator />
        </MobileContainer>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

function RootNavigator() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}
