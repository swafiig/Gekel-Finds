import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Bike, Radar as RadarIcon, User, Wallet } from "lucide-react-native";
import { Deliveries } from "../screens/rider/Deliveries";
import { Earnings } from "../screens/rider/Earnings";
import { Handover } from "../screens/rider/Handover";
import { JobOffer } from "../screens/rider/JobOffer";
import { Pickup } from "../screens/rider/Pickup";
import { Radar } from "../screens/rider/Radar";
import { RiderProfile } from "../screens/rider/RiderProfile";
import { Transit } from "../screens/rider/Transit";
import { tabScreenOptions } from "./TabBar";
import type { RiderStackParams, RiderTabParams } from "./types";

const Tab = createBottomTabNavigator<RiderTabParams>();
const Stack = createNativeStackNavigator<RiderStackParams>();

function Tabs() {
  return (
    <Tab.Navigator screenOptions={tabScreenOptions}>
      <Tab.Screen name="Radar" component={Radar} options={{ tabBarIcon: ({ color, size }) => <RadarIcon color={color} size={size} /> }} />
      <Tab.Screen name="Deliveries" component={Deliveries} options={{ tabBarIcon: ({ color, size }) => <Bike color={color} size={size} /> }} />
      <Tab.Screen name="Earnings" component={Earnings} options={{ tabBarIcon: ({ color, size }) => <Wallet color={color} size={size} /> }} />
      <Tab.Screen name="Profile" component={RiderProfile} options={{ tabBarIcon: ({ color, size }) => <User color={color} size={size} /> }} />
    </Tab.Navigator>
  );
}

export function RiderNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Tabs" component={Tabs} />
      <Stack.Screen name="JobOffer" component={JobOffer} />
      {/* Delivery steps can't be swiped away mid-flow; the header back button returns to the tabs. */}
      <Stack.Screen name="Pickup" component={Pickup} options={{ gestureEnabled: false }} />
      <Stack.Screen name="Transit" component={Transit} options={{ gestureEnabled: false }} />
      <Stack.Screen name="Handover" component={Handover} options={{ gestureEnabled: false }} />
    </Stack.Navigator>
  );
}
