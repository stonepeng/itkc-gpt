import Locale from "../locales";
import styles from "./settings.module.scss";

import { Input, List, ListItem, Modal } from "./ui-lib";
import { IconButton } from "./button";
import { useState } from "react";
import { useAccessStore } from "../store";
export function LoginModal(props: { onClose: () => void }) {
  const [userInput, setUserInput] = useState("");
  const accessStore = useAccessStore();
  const doLogin = (mobile: string) => {
    //手机号验证接口调用
    // accessStore.updateJPToken(mobile);
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
