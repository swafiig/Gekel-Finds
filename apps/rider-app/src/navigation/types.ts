import type { NavigatorScreenParams } from "@react-navigation/native";

export type AuthStackParams = {
  Welcome: undefined;
  Login: undefined;
};

export type RiderTabParams = {
  Radar: undefined;
  Deliveries: undefined;
  Earnings: undefined;
  Profile: undefined;
};

export type RiderStackParams = {
  Tabs: NavigatorScreenParams<RiderTabParams>;
  JobOffer: { id: string };
  Pickup: { id: string };
  Transit: { id: string };
  Handover: { id: string };
};
