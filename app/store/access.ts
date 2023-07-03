import { create } from "zustand";
import { persist } from "zustand/middleware";
import { StoreKey } from "../constant";
import { getHeaders } from "../client/api";
import { BOT_HELLO } from "./chat";
import { ALL_MODELS } from "./config";
import { getServerSideConfig } from "../config/server";
import { resolve } from "path";
import { showToast } from "../components/ui-lib";
export interface AccessControlStore {
  accessCode: string;
  token: string;
  jpToken: string | boolean;
  needCode: boolean;
  hideUserApiKey: boolean;
  openaiUrl: string;
  fetchBoolean: boolean;
  updateJPToken: (_: string | boolean) => void;
  updateToken: (_: string) => void;
  updateCode: (_: string) => void;
  updateFetchBoolean: (_: boolean) => void;
  enabledAccessControl: () => boolean;
  isAuthorized: () => boolean;
  fetch: () => void;
  result: () => void;
}

let fetchState = 0;
let fetchStateTwo = 0;
export async function fetchFuncion(url: string, token: any) {
  if (fetchStateTwo > 0) return;
  fetchStateTwo = 1;
  const validString = (x: string) => x && x.length > 0;

  let headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (validString(token)) {
    headers.Authorization = token;
  }
  return fetch(url, {
    method: "GET",
    headers,
  })
    .then((res) => res.json())
    .then((res) => {
      return res;
    })
    .catch((res) => {
      return res;
    })
    .finally(() => {
      fetchStateTwo = 2;
      return;
    });
}
const serverConfig = getServerSideConfig();
export const useAccessStore = create<AccessControlStore>()(
  persist(
    (set, get) => ({
      token: "",
      jpToken: false,
      accessCode: "",
      needCode: true,
      hideUserApiKey: false,
      fetchBoolean: false,
      openaiUrl: "/api/openai/",

      enabledAccessControl() {
        get().fetch();

        return get().needCode;
      },
      updateCode(code: string) {
        set(() => ({ accessCode: code }));
      },
      updateToken(token: string) {
        set(() => ({ token }));
      },
      updateJPToken(jpToken: string | boolean) {
        set(() => ({ jpToken }));
      },
      updateFetchBoolean(fetchBoolean: boolean) {
        set(() => ({ fetchBoolean }));
      },
      isAuthorized() {
        console.log(console.log(get().accessCode));
        get().fetch();
        get().result();
        return get().fetchBoolean;
        // has token or has code or disabled access control
        // return (
        //   !!get().token || !!get().accessCode || !get().enabledAccessControl()
        // );
      },
      async result() {
        if (fetchStateTwo > 0) return;
        const searchParams = new URLSearchParams(window.location.search);
        const token = get().jpToken ? get().jpToken : searchParams.get("token");
        const url =
          serverConfig.appUrl ??
          process.env.appUrl +
            "/api/best/getBestMemberStaff" +
            (get().accessCode ? "?code=" + get().accessCode : "");

        if (token || get().accessCode) {
          //调用接口  token传参
          const result = await fetchFuncion(url, token);

          if (result?.code == 200) {
            get().updateFetchBoolean(true);
            get().updateJPToken(token);
            return;
          }
        }
        if (get().fetchBoolean) {
          get().updateFetchBoolean(false);
        } else {
          showToast("无访问权限");
        }
        return;
      },
      fetch() {
        if (fetchState > 0) return;
        fetchState = 1;
        fetch("/api/config", {
          method: "post",
          body: null,
          headers: {
            ...getHeaders(),
          },
        })
          .then((res) => res.json())
          .then((res: DangerConfig) => {
            console.log("[Config] got config from server", res);
            set(() => ({ ...res }));

            if (!res.enableGPT4) {
              ALL_MODELS.forEach((model) => {
                if (model.name.startsWith("gpt-4")) {
                  (model as any).available = false;
                }
              });
            }

            if ((res as any).botHello) {
              BOT_HELLO.content = (res as any).botHello;
            }
          })
          .catch(() => {
            console.error("[Config] failed to fetch config");
          })
          .finally(() => {
            fetchState = 2;
          });
      },
    }),
    {
      name: StoreKey.Access,
      version: 1,
    },
  ),
);
