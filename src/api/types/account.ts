export enum AccountType {
  Microsoft = "microsoft",
  Offline = "offline",
}

export interface AccountInfo {
  name: string;
  account_type: AccountType;
  uuid: string;
  create_time: string;
  last_login_time: string | null;
}

export interface Account {
  info: AccountInfo;
  access_token: string | null;
  refresh_token: string | null;
}

export interface AdminSession {
  email: string;
  admin_id: string;
  bound_player_uuids: string[];
  login_time: string;
}

export interface AdminAccountInfo {
  email: string;
  admin_id: string;
  created_at: string;
  bound_player_uuids: string[];
}
