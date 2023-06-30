import { create } from "zustand";
import { persist } from "zustand/middleware";
import { StoreKey } from "../constant";
import { getHeaders } from "../client/api";
import { BOT_HELLO } from "./chat";
import { ALL_MODELS } from "./config";
import { getServerSideConfig } from "../config/server";
export interface AccessControlStore {
  accessCode: string;
  token: string;
  jpToken: string | boolean;
  needCode: boolean;
  hideUserApiKey: boolean;
  openaiUrl: string;
  updateJPToken: (_: string) => void;
  updateToken: (_: string) => void;
  updateCode: (_: string) => void;
  enabledAccessControl: () => boolean;
  isAuthorized: () => boolean;
  fetch: () => void;
}

let fetchState = 0; // 0 not fetch, 1 fetching, 2 done

const serverConfig = getServerSideConfig();
export const useAccessStore = create<AccessControlStore>()(
  persist(
    (set, get) => ({
      token: "",
      jpToken: false,
      accessCode: "",
      needCode: true,
      hideUserApiKey: false,
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
      isAuthorized() {
        get().fetch();

        if (get().jpToken) {
          return true;
        } else {
          const searchParams = new URLSearchParams(window.location.search);
          const token = searchParams.get("token") ?? false;
          if (token) {
            //调用接口  token传参
            fetch(
              serverConfig.appUrl ??
                process.env.appUrl + "/api/best/getBestMemberStaff",
              {
                method: "GET",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: token,
                },
              },
            )
              .then((res) => res.json())
              .then((res) => {
                if (res.code == 200) {
                  if (!res.data) return false;
                  get().updateJPToken(token);
                  return true;
                } else {
                  return false;
                }
              });
          } else {
            return false;
          }
        }
        return false;
        // has token or has code or disabled access control
        // return (
        //   !!get().token || !!get().accessCode || !get().enabledAccessControl()
        // );
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
