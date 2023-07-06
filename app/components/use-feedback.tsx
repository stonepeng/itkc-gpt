import Locale from "../locales";
import styles from "./settings.module.scss";

import { Input, List, ListItem, Modal, showToast, Select } from "./ui-lib";
import { IconButton } from "./button";
import { useState } from "react";
import { useAccessStore } from "../store";
import { getServerSideConfig } from "../config/server";

export function UseFeedbackModal(props: { onClose: () => void }) {
  const [userInput, setUserInput] = useState({
    type: "advise",
    question: "",
    phone: "",
  });
  const accessStore = useAccessStore();
  const serverConfig = getServerSideConfig();
  const formats = [
    { label: "功能建议", value: "advise" },
    { label: "bug反馈", value: "bug" },
  ] as const;
  function updateFeeedback(updater: (feeedback: typeof userInput) => void) {
    const feeedback = { ...userInput };
    updater(feeedback);
    setUserInput(feeedback);
  }

  const subFeedback = (prompt: typeof userInput) => {
    if (!prompt.question) {
      showToast("请填写具体问题内容");
      return;
    }
    const validString = (x: string) => x && x.length > 0;

    let headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (validString(accessStore.jpToken)) {
      headers.Authorization = accessStore.jpToken;
    }

    fetch(serverConfig.appUrl ?? process.env.appUrl + "/api/basic/feedback", {
      method: "POST",
      headers,
      body: JSON.stringify({
        phone: prompt.phone,
        question: prompt.question,
        type: prompt.type,
        code: accessStore.accessCode,
      }),
    })
      .then((res) => res.json())
      .then((result) => {
        if (result?.code == 200) {
          showToast("反馈成功，感谢您的反馈意见");
          props.onClose();
        } else {
          showToast("反馈失败");
        }
        return;
      })
      .catch(() => {
        showToast("反馈失败");
      });
  };
  return (
    <div className="modal-mask">
      <Modal
        title="意见反馈"
        onClose={props.onClose}
        actions={[
          <IconButton
            key="reset"
            bordered
            text="提交反馈"
            onClick={() => {
              subFeedback(userInput);
            }}
          />,
        ]}
      >
        <div style={{ minHeight: "10vh" }} className={styles["settings"]}>
          <List>
            <ListItem title="反馈类型">
              <Select
                onChange={(e) =>
                  updateFeeedback(
                    (feeedback) => (feeedback.type = e.currentTarget.value),
                  )
                }
              >
                {formats.map((f) => (
                  <option key={f.value} value={f.value}>
                    {f.label}
                  </option>
                ))}
              </Select>
            </ListItem>
            <ListItem title="请描述具体问题" className={styles["feedback"]}>
              <Input
                style={{ height: "100px" }}
                onInput={(e) =>
                  updateFeeedback(
                    (feeedback) => (feeedback.question = e.currentTarget.value),
                  )
                }
              />
            </ListItem>
            <ListItem title="联系方式" subTitle="选填，便于我们与你联系">
              <input
                type="text"
                onInput={(e) =>
                  updateFeeedback(
                    (feeedback) => (feeedback.phone = e.currentTarget.value),
                  )
                }
              ></input>
            </ListItem>
          </List>
        </div>
      </Modal>
    </div>
  );
}
