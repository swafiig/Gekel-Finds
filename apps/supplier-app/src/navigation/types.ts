import type { NavigatorScreenParams } from "@react-navigation/native";

export type AuthStackParams = {
  Welcome: undefined;
  Login: undefined;
};

export type SupplierTabParams = {
  Home: undefined;
  Requests: undefined;
  Catalog: undefined;
  Orders: { group?: "confirm" | "pack" | "handoff" | "done" } | undefined;
  Chat: undefined;
};

export type SupplierStackParams = {
  Tabs: NavigatorScreenParams<SupplierTabParams>;
  RfqDetail: { id: string };
  ProductForm: { id?: string };
  OrderDetail: { id: string };
  PackProof: { id: string };
  ChatThread: { id: string; title: string; subtitle?: string };
  CatalogueImport: undefined;
  Profile: undefined;
};
