/** Minecraft 账户类型 */
export enum AccountType {
  /** 占位符 */
  None = "none",
  /** 微软正版账户 */
  Microsoft = "microsoft",
  /** 离线（盗版）账户 */
  Offline = "offline",
  /** 第三方账户 */
  ThirdParty = "thrid-party",
  /** 服主账户 */
  Admin = "admin",
}

/** 账户基本信息 */
export interface AccountInfo {
  /** 账户名称（1-16 字符） */
  name: string;
  /** 账户类型 */
  account_type: AccountType;
  /** 账户 UUID */
  uuid: string;
  /** 创建时间 */
  create_time: string;
  /** 最后登录时间，未登录过为 null */
  last_login_time: string | null;
}

/** 完整账户数据（含 Token） */
export interface Account {
  /** 账户基本信息 */
  info: AccountInfo;
  /** 访问令牌，微软账户有效 */
  access_token: string | null;
  /** 刷新令牌，微软账户有效 */
  refresh_token: string | null;
}
