import React from 'react';
import { Tabs } from 'expo-router';
import { Text, View } from 'react-native';
import { Bookmark, Briefcase, House, User } from 'lucide-react-native';
import { FONTS, useZirconTheme } from '@/constants/classical';
import { useMyApplicationsQuery } from '@/hooks/useZirconQueries';

export default function TabsLayout() {
  const { palette } = useZirconTheme();
  const { data: applications = [] } = useMyApplicationsQuery();
  const activeCount = applications.filter((a) => a.status === 'PENDENTE' || a.status === 'EM_ANALISE').length;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: palette.accent,
        tabBarInactiveTintColor: palette.textMuted,
        tabBarStyle: {
          backgroundColor: palette.bg,
          borderTopColor: palette.divider,
          borderTopWidth: 1,
          height: 68,
          paddingBottom: 10,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontFamily: FONTS.body,
          fontSize: 11,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Início',
          tabBarIcon: ({ color }) => <House size={22} color={color} strokeWidth={1.6} />,
        }}
      />
      <Tabs.Screen
        name="salvas"
        options={{
          title: 'Salvas',
          tabBarIcon: ({ color }) => <Bookmark size={22} color={color} strokeWidth={1.6} />,
        }}
      />
      <Tabs.Screen
        name="candidaturas"
        options={{
          title: 'Candidaturas',
          tabBarIcon: ({ color }) => (
            <View>
              <Briefcase size={22} color={color} strokeWidth={1.6} />
              {activeCount > 0 ? (
                <View
                  style={{
                    position: 'absolute',
                    top: -4,
                    right: -10,
                    minWidth: 17,
                    height: 17,
                    paddingHorizontal: 4,
                    borderRadius: 9,
                    borderWidth: 1,
                    borderColor: palette.accent,
                    backgroundColor: palette.bg,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text style={{ fontFamily: FONTS.body, fontSize: 10, color: palette.accent }}>{activeCount}</Text>
                </View>
              ) : null}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="perfil"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color }) => <User size={22} color={color} strokeWidth={1.6} />,
        }}
      />
    </Tabs>
  );
}
