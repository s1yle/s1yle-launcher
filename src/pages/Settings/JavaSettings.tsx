import { ListItem, SettingsPanel } from "@/components/common";
import { FLEX_DIR } from "@/components/common/settings/ListItem";
import { CheckIcon, File } from "lucide-react";
import { useState } from "react";


export interface JavaSettingsProps {

}

const JavaSettings = ({

}: JavaSettingsProps) => {

  const [isSelected, selectJavaVersion] = useState(true);

  let version = {
    number: "21.0.11",
    major: "21",
    vendor: "Red_Hat",
    path: "/usr/lib/jvm/java-21-openjdk/bin/java"
  };

  return (
    <>
      <div className="p-3">

        <SettingsPanel label="Java">

          {/* Java版本列表项 */}
          <ListItem selected={isSelected} onClick={() => { }}>
            <ListItem.Left direction={FLEX_DIR.COL}>
              <div>
                <ListItem.Title>JDK {version.number}</ListItem.Title>
                <ListItem.Tag variant="primary">{version.vendor}</ListItem.Tag>
              </div>
              <ListItem.Description>{version.path}</ListItem.Description>
            </ListItem.Left>

            <ListItem.Right>
              {isSelected && <CheckIcon className="w-5 h-5 text-(--color-primary)" />}
            </ListItem.Right>
          </ListItem>

        </SettingsPanel>
      </div >
    </>
  )
}

export default JavaSettings;
