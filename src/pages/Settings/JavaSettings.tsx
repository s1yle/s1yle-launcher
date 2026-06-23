import { motion } from 'framer-motion';
import { staggerContainer, staggerSection } from '@/utils/animations';
import { ListItem, SettingsPanel, LoadingSurface } from "@/components/common";
import { FLEX_DIR } from "@/components/common/settings/ListItem";
import { JavaInstallation, scanJavaInstallations } from "@/helper/rustInvoke";
import { useLoadingAction } from "@/hooks/useLoadingAction";
import useJavaStore from "@/stores/javaStore";
import { CheckIcon } from "lucide-react";
import { useEffect } from "react";

const JavaSettings = () => {
  const { curJava, setCurJava, javas: versions, setJavas: setVersions } = useJavaStore();

  const scanJava = useLoadingAction<JavaInstallation[]>({
    key: 'java:scan',
    action: scanJavaInstallations,
    onSuccess: (result) => setVersions(result),
  });

  useEffect(() => {
    scanJava();
  }, [scanJava]);

  const renderJavaListItem = (java: JavaInstallation) => {
    const isSelected = curJava?.path == java.path;

    return (
      <ListItem selected={isSelected} onClick={() => { setCurJava(java) }}>
        <ListItem.Left direction={FLEX_DIR.COL}>
          <div>
            <ListItem.Title>
              {java.is_jdk ? "JDK" : "JRE"} {java.version}
            </ListItem.Title>
            <ListItem.Tag variant="primary">{java.vendor}</ListItem.Tag>
          </div>
          <ListItem.Description>{java.path}</ListItem.Description>
        </ListItem.Left>

        <ListItem.Right>
          {isSelected && <CheckIcon className="w-5 h-5 text-(--color-primary)" />}
        </ListItem.Right>
      </ListItem>
    )
  }

  return (
    <motion.div
      className="p-3"
      variants={staggerContainer}
      initial="initial"
      animate="animate"
    >
      <motion.div variants={staggerSection}>
        <SettingsPanel label="Java">
          <LoadingSurface loadingKey="java:scan" skeleton="list" skeletonCount={(versions ?? []).length}>
            {(versions ?? []).map(renderJavaListItem)}
          </LoadingSurface>
        </SettingsPanel>
      </motion.div>
    </motion.div>
  )
}

export default JavaSettings;
