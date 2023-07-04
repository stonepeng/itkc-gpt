import Locale from "../locales";
import styles from "./settings.module.scss";

import { Input, List, ListItem, Modal, showToast } from "./ui-lib";
import { IconButton } from "./button";
import { useState } from "react";
import { useAccessStore } from "../store";
import { getServerSideConfig } from "../config/server";

export function LoginModal(props: { onClose: () => void }) {
  const [userInput, setUserInput] = useState("");
  const accessStore = useAccessStore();
  const serverConfig = getServerSideConfig();

  const doLogin = (mobile: string) => {
    fetch(
      serverConfig.appUrl ?? process.env.appUrl + "/api/best/toMobileAuth",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phone: mobile,
        }),
      },
    )
      .then((res) => res.json())
      .then((result) => {
        if (result?.code == 200) {
          if (result.data.token) {
            accessStore.updateJPToken(result.data.token); //更新token
            showToast("登录成功");
          }
        } else {
          showToast("登录失败，请注册好玩会员");
        }
        return;
      })
      .catch(() => {
        showToast("登录失败，请注册好玩会员");
      });
  };
  return (
    <div className="modal-mask">
      <Modal
        title={Locale.Login.Title}
        onClose={props.onClose}
        actions={[
          <IconButton
            key="reset"
            bordered
            text={Locale.Login.Member}
            onClick={() => {
              window.location.href =
                serverConfig.webUrl ??
                process.env.webUrl + "/fun-demand-home-i";
            }}
          />,
          <IconButton
            key="reset"
            bordered
            text={Locale.Login.Title}
            onClick={() => {
              doLogin(userInput);
            }}
          />,
        ]}
      >
        <div style={{ minHeight: "5vh" }} className={styles["settings"]}>
          <List>
            <ListItem
              title={Locale.Login.Mobile}
              subTitle={Locale.Login.SubTitle}
            >
              <input
                type="text"
                value={userInput}
                onInput={(e) => setUserInput(e.currentTarget.value)}
              ></input>
            </ListItem>
          </List>
        </div>
      </Modal>
    </div>
  );
}
