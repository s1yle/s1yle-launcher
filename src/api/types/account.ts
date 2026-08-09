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

export interface DeviceCodeResponse {
  userCode: string;
  url: string;
}

/** Microsoft 登录流程状态 */
export type LoginStatus =
  /** 无进行中的登录 */
  | "idle"
  /** 等待用户授权（展示设备码中） */
  | "polling"
  /** 授权完成，正在执行认证与入库 */
  | "completing"
  /** 登录已完成 */
  | "done"
  /** 已取消（终态） */
  | "cancelled";

/** Microsoft 登录进度事件（Rust 端逐步推送） */
export interface LoginProgressEvent {
  /** 步骤标识：device-code | polling | authorized | xbox | xsts | minecraft | uuid | storing | adding | done */
  step: string;
  /** 当前步骤的人类可读描述 */
  message: string;
}

/** 微软设备码响应 */
export interface MicrosoftDeviceCode {
  device_code: string;
  user_code: string;
  verification_uri: string;
  expires_in: number;
  interval: number;
  message: string;
}

export interface TokenResponse {
  token_type: string;
  scope: string;
  expires_in: number;
  access_token: string;
  refresh_token: string;
  id_token?: string;
}
