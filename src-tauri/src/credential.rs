//! Windows 凭据管理器操作模块（通用版）
//! 支持存储任意二进制数据（不仅仅是字符串）

use windows::core::{Error, HSTRING, PCWSTR, PWSTR};
use windows::Win32::Security::Credentials::{
    CRED_FLAGS, CRED_PERSIST_LOCAL_MACHINE, CRED_TYPE_GENERIC, CREDENTIALW, CredDeleteW, CredFree, CredReadW, CredWriteW,
};
use std::ffi::c_void;

/// 存储凭据（写入）
/// - `target_name`: 唯一标识，例如 "MyApp_UserToken"
/// - `username`: 可选的用户名，若没有可传空字符串
/// - `secret`: 要存储的敏感数据（任意二进制数据，如 Token、密码、密钥）
/// - `comment`: 可选的备注信息
pub fn write_credential<T: AsRef<str>>(
    target_name: T,
    username: T,
    secret: &mut [u8],
    comment: T,
) -> Result<(), Error> {
    let target_name = target_name.as_ref();
    let username = username.as_ref();
    let comment = comment.as_ref();

    let target_wide = HSTRING::from(target_name);
    let username_wide = HSTRING::from(username);
    let comment_wide = HSTRING::from(comment);

    // 构建凭据结构
    let credential = CREDENTIALW {
        Flags: CRED_FLAGS(0),
        Type: CRED_TYPE_GENERIC,
        TargetName: PWSTR::from_raw(target_wide.as_ptr() as *mut u16),
        Comment: PWSTR::from_raw(comment_wide.as_ptr() as *mut u16),
        LastWritten: Default::default(),    
        CredentialBlobSize: secret.len() as u32,   // 直接使用字节长度
        CredentialBlob: secret.as_mut_ptr() , // 转为 *mut c_void
        Persist: CRED_PERSIST_LOCAL_MACHINE, // 持久化
        AttributeCount: 0,
        Attributes: std::ptr::null_mut(),
        TargetAlias: PWSTR::null(),
        UserName: PWSTR::from_raw(username_wide.as_ptr() as *mut u16),
    };

    unsafe {
        let result = CredWriteW(&credential, 0);
        if result.is_ok() {
            Ok(())
        } else {
            Err(result.unwrap_err())
        }
    }
}

/// 读取凭据
/// - `target_name`: 与存储时相同的唯一标识
/// 返回 `(username, secret_bytes)`，若不存在则返回错误
pub fn read_credential<T: AsRef<str>>(target_name: T) -> Result<(String, Vec<u8>), Error> {
    let target_wide = HSTRING::from(target_name.as_ref());

    unsafe {
        let mut cred_ptr = std::ptr::null_mut();
        let result = CredReadW(
PCWSTR::from_raw(target_wide.as_ptr()),
            CRED_TYPE_GENERIC,
            Some(0),
            &mut cred_ptr,
        );

        if result.is_err() {
            return Err(result.unwrap_err());
        }

        let cred = &*cred_ptr;

        // 读取二进制 blob
        let secret_bytes = if cred.CredentialBlob.is_null() || cred.CredentialBlobSize == 0 {
            Vec::new()
        } else {
            let slice = std::slice::from_raw_parts(
                cred.CredentialBlob as *const u8,
                cred.CredentialBlobSize as usize,
            );
            slice.to_vec()
        };

        // 读取用户名（PCWSTR 转 String）
        let username = if cred.UserName.is_null() {
            String::new()
        } else {
            // 使用 wcslen 计算长度
            let len = (0..).take_while(|&i| *cred.UserName.as_ptr().add(i) != 0).count();
            // let slice = std::slice::from_raw_parts_mut(cred.UserName, len);
            String::from_utf16_lossy(cred.UserName.as_wide())
        };

        // 释放系统分配的内存
        CredFree(cred_ptr as *const c_void);

        Ok((username, secret_bytes))
    }
}

/// 删除凭据
/// - `target_name`: 要删除的凭据名称
pub fn delete_credential<T: AsRef<str>>(target_name: T) -> Result<(), Error> {
    let target_wide = HSTRING::from(target_name.as_ref());
    unsafe {
        let result = CredDeleteW(
            PCWSTR::from_raw(target_wide.as_ptr()), 
            CRED_TYPE_GENERIC, 
            Some(0),
        );
        if result.is_ok() {
            Ok(())
        } else {
            Err(result.unwrap_err())
        }
    }
}

/// 检查凭据是否存在
pub fn credential_exists<T: AsRef<str>>(target_name: T) -> bool {
    read_credential(target_name).is_ok()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_write_read_delete() {
        let target = "MyApp_TestToken";
        let user = "test_user";
        let secret = b"super_secret_token_12345"; // 字节切片
        let comment = "测试用 Token";

        // 写入
        let write_result = write_credential(target, user, &mut secret.clone(), comment);
        assert!(write_result.is_ok(), "写入失败: {:?}", write_result);

        // 读取
        let (read_user, read_secret) = read_credential(target).expect("读取失败");
        println!("读取到的用户名: {:?}", read_user);
        let secret_text = String::from_utf8_lossy(&read_secret);
        println!("读取到的密码: {}", secret_text);
        assert_eq!(read_user, user);
        assert_eq!(read_secret, secret.to_vec());

        // 删除
        let delete_result = delete_credential(target);
        assert!(delete_result.is_ok(), "删除失败: {:?}", delete_result);

        // 再次读取应该失败
        let read_again = read_credential(target);
        assert!(read_again.is_err(), "删除后还能读取到数据");
    }
}