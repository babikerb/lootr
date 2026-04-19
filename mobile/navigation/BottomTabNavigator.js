import { Ionicons } from '@expo/vector-icons';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../theme';

import GameListScreen from '../screens/GameListScreen';
import HomeScreen from '../screens/HomeScreen';
import MapScreen from '../screens/MapScreen';

const Tab = createMaterialTopTabNavigator();

const TAB_CONFIG = {
  Home:  { focused: 'home',            outline: 'home-outline',            color: COLORS.seafoam },
  Map:   { focused: 'map',             outline: 'map-outline',             color: COLORS.coral },
  Games: { focused: 'game-controller', outline: 'game-controller-outline', color: COLORS.anemone },
};

function PillTabBar({ state, descriptors, navigation }) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.barWrapper, { paddingBottom: insets.bottom + 8 }]}>
      <View style={styles.bar}>
        {state.routes.map((route, index) => {
          const focused = state.index === index;
          const tab = TAB_CONFIG[route.name];
          const iconName = focused ? tab.focused : tab.outline;

          const onPress = () => {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
          };

          return (
            <TouchableOpacity
              key={route.key}
              onPress={onPress}
              activeOpacity={0.8}
              style={[styles.tab, focused && { backgroundColor: tab.color }]}
            >
              <Ionicons
                name={iconName}
                size={20}
                color={focused ? COLORS.bg : COLORS.textMuted}
              />
              {focused && (
                <Text style={styles.label}>{route.name}</Text>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

export default function BottomTabNavigator() {
  return (
    <Tab.Navigator
      initialRouteName="Home"
      tabBar={(props) => <PillTabBar {...props} />}
      tabBarPosition="bottom"
      swipeEnabled
      screenOptions={{}}
    >
      <Tab.Screen name="Map"   component={MapScreen} />
      <Tab.Screen name="Home"  component={HomeScreen} />
      <Tab.Screen name="Games" component={GameListScreen} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  barWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingTop: 8,
    backgroundColor: 'transparent',
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceLighter,
    borderRadius: 40,
    paddingHorizontal: 8,
    paddingVertical: 8,
    gap: 4,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 32,
    gap: 6,
  },
  label: {
    color: COLORS.bg,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
