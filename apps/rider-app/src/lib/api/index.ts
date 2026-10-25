import { httpApi } from "./http";
import { mockApi } from "./mock";
import type { Api } from "./types";

export * from "./types";
export { setToken, setUnauthorizedHandler } from "./http";
export { MOCK_HINTS } from "./mock";

export const USING_MOCK = !process.env.EXPO_PUBLIC_API_URL;
export const api: Api = USING_MOCK ? mockApi : httpApi;
