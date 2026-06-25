use std::fs;
use std::path::PathBuf;

/// 递归复制目录的全部内容到目标路径
///
/// 自动创建目标目录（若不存在），递归处理所有子目录和文件。
pub(crate) fn copy_dir_all(src: &PathBuf, dst: &PathBuf) -> Result<(), std::io::Error> {
    if !dst.exists() {
        fs::create_dir_all(dst)?;
    }
    for entry in fs::read_dir(src)? {
        let entry = entry?;
        let ty = entry.file_type()?;
        let dest_path = dst.join(entry.file_name());
        if ty.is_dir() {
            copy_dir_all(&entry.path(), &dest_path)?;
        } else {
            fs::copy(entry.path(), dest_path)?;
        }
    }
    Ok(())
}
