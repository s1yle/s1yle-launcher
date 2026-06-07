export interface KnownPath {
  id: string;
  name: string;
  path: string;
  is_default: boolean;
}

export interface FolderValidationResult {
  is_valid: boolean;
  path: string;
  suggested_name: string;
  instances: DetectedInstance[];
  format: InstanceFormat;
  compatibility_score: number;
  warnings: string[];
}

export interface DetectedInstance {
  name: string;
  version: string;
  version_dir: string;
  format: InstanceFormat;
}

export enum InstanceFormat {
  Native = "Native",
  StandardMinecraft = "StandardMinecraft",
  Custom = "Custom",
  Invalid = "Invalid",
}
