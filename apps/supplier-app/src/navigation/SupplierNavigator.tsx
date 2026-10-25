import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { ClipboardList, Home, MessageCircle, MessageSquareQuote, Package } from "lucide-react-native";
import { useQuery } from "../hooks/useQuery";
import { api } from "../lib/api";
import { CatalogueImport } from "../screens/supplier/CatalogueImport";
import { Catalog } from "../screens/supplier/Catalog";
import { SupplierHome } from "../screens/supplier/Home";
import { OrderDetail } from "../screens/supplier/OrderDetail";
import { Orders } from "../screens/supplier/Orders";
import { PackProof } from "../screens/supplier/PackProof";
import { ProductForm } from "../screens/supplier/ProductForm";
import { SupplierProfile } from "../screens/supplier/Profile";
import { Requests } from "../screens/supplier/Requests";
import { RfqDetail } from "../screens/supplier/RfqDetail";
import { ChatList, ChatThread } from "../screens/shared/Chat";
import { tabScreenOptions } from "./TabBar";
import type { SupplierStackParams, SupplierTabParams } from "./types";

const Tab = createBottomTabNavigator<SupplierTabParams>();
const Stack = createNativeStackNavigator<SupplierStackParams>();

function Tabs() {
  // Badges: unread chats and requests waiting for a quote.
  const threads = useQuery(() => api.listThreads(), [], { refreshMs: 15_000 });
  const rfqs = useQuery(() => api.listRfqs(), [], { refreshMs: 30_000 });
  const unread = (threads.data ?? []).reduce((a, t) => a + t.unread, 0);
  const open = (rfqs.data ?? []).filter((r) => r.status === "open").length;

  return (
    <Tab.Navigator screenOptions={tabScreenOptions}>
      <Tab.Screen name="Home" component={SupplierHome} options={{ tabBarIcon: ({ color, size }) => <Home color={color} size={size} /> }} />
      <Tab.Screen name="Requests" component={Requests} options={{ tabBarBadge: open || undefined, tabBarIcon: ({ color, size }) => <MessageSquareQuote color={color} size={size} /> }} />
      <Tab.Screen name="Catalog" component={Catalog} options={{ tabBarLabel: "Catalogue", tabBarIcon: ({ color, size }) => <Package color={color} size={size} /> }} />
      <Tab.Screen name="Orders" component={Orders} options={{ tabBarIcon: ({ color, size }) => <ClipboardList color={color} size={size} /> }} />
      <Tab.Screen name="Chat" component={ChatList} options={{ tabBarBadge: unread || undefined, tabBarIcon: ({ color, size }) => <MessageCircle color={color} size={size} /> }} />
    </Tab.Navigator>
  );
}

export function SupplierNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Tabs" component={Tabs} />
      <Stack.Screen name="RfqDetail" component={RfqDetail} />
      <Stack.Screen name="ProductForm" component={ProductForm} />
      <Stack.Screen name="OrderDetail" component={OrderDetail} />
      <Stack.Screen name="PackProof" component={PackProof} />
      <Stack.Screen name="ChatThread" component={ChatThread} />
      <Stack.Screen name="CatalogueImport" component={CatalogueImport} />
      <Stack.Screen name="Profile" component={SupplierProfile} />
    </Stack.Navigator>
  );
}
