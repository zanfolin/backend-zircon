import { Stack } from 'expo-router';
import { useZirconTheme } from '@/constants/classical';

export default function AuthLayout() {
  const { palette } = useZirconTheme();
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: palette.bg },
      }}
    />
  );
}
