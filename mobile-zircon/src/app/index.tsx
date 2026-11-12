import { Redirect } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';

export default function IndexRedirect() {
  const { accessToken, user } = useAuthStore();
  if (accessToken && user?.user_type === 'PROFISSIONAL') {
    return <Redirect href="/(tabs)" />;
  }
  return <Redirect href="/(auth)/welcome" />;
}
