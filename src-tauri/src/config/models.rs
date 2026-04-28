use std::path::PathBuf;

use once_cell::sync::Lazy;

/// # BASE_PATH
pub static BASE_PATH: Lazy<PathBuf> =
    Lazy::new(|| std::env::current_dir().unwrap_or(PathBuf::from("")));

/// # minecraft 根目录
pub static DEAMON_BASE_PATH: Lazy<PathBuf> = Lazy::new(|| BASE_PATH.join("minecraft"));

/// # 默认的 实例名称
pub static DEFAULT_DEAMON_PATH: Lazy<PathBuf> =
    Lazy::new(|| BASE_PATH.join("minecraft").join("default"));

/// # 下载路径
pub static DOWNLOAD_BASE_PATH: Lazy<PathBuf> = Lazy::new(|| CONFIG_APPLICATION.join("download"));

pub static INSTANCE_META_FILE_NAME: &str = "instance_meta.json";

/// # InstanceMeta 路径
pub static INSTANCE_META_PATH: Lazy<PathBuf> =
    Lazy::new(|| DEAMON_BASE_PATH.join(PathBuf::from(INSTANCE_META_FILE_NAME)));

/// # 应用配置目录
pub static CONFIG_APPLICATION: Lazy<PathBuf> = Lazy::new(|| {
    Lazy::<PathBuf>::get(&BASE_PATH)
        .unwrap_or(&PathBuf::new())
        .join(".smcl")
});

/// # 应用配置文件名  /.smcl/app_config.json
pub static CONFIG_FILE_PATH: Lazy<PathBuf> = Lazy::new(|| {
    Lazy::<PathBuf>::get(&CONFIG_APPLICATION)
        .unwrap_or(&PathBuf::from(".smcl"))
        .join("app_config.json")
});

/// # 最小窗口宽度
pub static MIN_WIDTH: Lazy<u32> = Lazy::new(|| 960);

/// # 最小窗口高度
pub static MIN_HEIGHT: Lazy<u32> = Lazy::new(|| 600);


