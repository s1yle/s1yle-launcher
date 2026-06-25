/** Java 安装信息 */
export interface JavaInstallation {
  /** Java 可执行文件路径 */
  path: String,
  /** Java 版本号 */
  version: String,
  /** Java 供应商（如 Oracle, OpenJDK, GraalVM 等） */
  vendor: String,
  /** 是否为 JDK（而非 JRE） */
  is_jdk: boolean,
}
