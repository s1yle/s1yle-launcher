export interface GameVersion {
  id: string;
  name: string;
  type_: string;
  release_time: string;
  url: string;
}

export interface LatestVersion {
  release: string;
  snapshot: string;
}

export interface VersionManifest {
  latest: LatestVersion;
  versions: GameVersion[];
}

export interface DownloadTask {
  id: string;
  url: string;
  path: string;
  filename: string;
  total_size: number;
  downloaded_size: number;
  status: string;
}

export interface DownloadProgress {
  task_id: string;
  downloaded: number;
  total: number;
  speed: number;
  status: string;
}

export interface FileDownload {
  url: string;
  sha1: string | null;
  size: number;
  path: string;
}

export interface VersionDownloadManifest {
  version_id: string;
  client_jar: FileDownload | null;
  libraries: FileDownload[];
  assets: FileDownload[];
  natives: FileDownload[];
  asset_index: FileDownload | null;
}

export interface MigrationResult {
  migrated_versions: string[];
  migrated_libraries: number;
  migrated_assets: number;
  errors: string[];
}

export interface DeployOptions {
  instance_name: string;
  version_id: string;
  loader_type: string;
  loader_version: string | null;
  target_existing_instance: string | null;
}

export interface DeployResult {
  success: boolean;
  instance_id: string;
  instance_name: string;
  version: string;
  deployed_files_count: number;
  total_files_count: number;
  message: string;
}
