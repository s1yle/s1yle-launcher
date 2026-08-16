/** Java 安装信息 */
export interface JavaInstallation {
  /** Java 可执行文件路径 */
  path: string,
  /** Java 版本号 */
  version: string,
  /** Java 供应商（如 Oracle, OpenJDK, GraalVM 等） */
  vendor: string,
  /** 是否为 JDK（而非 JRE） */
  is_jdk: boolean,
  /** 主版本号（8 / 11 / 17 / 21 ...） */
  major_version: number,
  /** 是否为 64 位 */
  is_64bit: boolean,
}
