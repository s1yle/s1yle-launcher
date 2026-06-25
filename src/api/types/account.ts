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


