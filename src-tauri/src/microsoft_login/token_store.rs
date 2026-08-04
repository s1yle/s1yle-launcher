//! Microsoft Token 凭据存储

use serde_json::from_str;
#[cfg(target_os = "windows")]
use crate::microsoft_login::MinecraftLoginResponse;

/// 通过可信化存储保存 Microsoft Token
#[cfg(target_os = "windows")]
pub fn set_mc_token(username: String, token_resp: &MinecraftLoginResponse) -> Result<(), String> {
    use crate::credential::write_credential;

    println!("[set_mc_token] 开始存储凭据, username={}", username);

    let mut data = serde_json::to_vec(&token_resp).map_err(|e| {
        println!("[set_mc_token] 序列化失败: {}", e);
        e.to_string()
    })?;
    println!("[set_mc_token] 序列化成功, 数据长度={} bytes", data.len());

    write_credential(
        "microsoft_token",
        &username,
        &mut data,
        "Microsoft Token",
    )
    .map_err(|e| {
        println!("[set_mc_token] write_credential 失败: {}", e);
        e.to_string()
    })?;

    println!("[set_mc_token] 凭据存储成功");
    Ok(())
}

/// 通过可信方式获取 token 令牌
#[cfg(target_os = "windows")]
pub fn get_mc_token() -> Result<MinecraftLoginResponse, String> {
    use crate::credential::read_credential;

    println!("[get_mc_token] 开始读取凭据...");

    let token_resp = read_credential("microsoft_token").map_err(|err| {
        println!("[get_mc_token] read_credential 失败: {}", err);
        err.to_string()
    })?;
    println!("[get_mc_token] 读取成功, 数据长度={} bytes", token_resp.1.len());

    let token_str = String::from_utf8(token_resp.1).map_err(|e| {
        println!("[get_mc_token] UTF-8 转换失败: {}", e);
        e.to_string()
    })?;

    let token_resp = from_str::<MinecraftLoginResponse>(&token_str).map_err(|e| {
        println!("[get_mc_token] 反序列化失败: {}", e);
        e.to_string()
    })?;

    println!("[get_mc_token] 凭据读取成功, username={}", token_resp.username);
    Ok(token_resp)
}

/// 删除 Microsoft Token
#[cfg(target_os = "windows")]
pub fn delete_mc_token() -> Result<(), String> {
    use crate::credential::delete_credential;

    println!("[delete_mc_token] 开始删除凭据...");

    delete_credential("microsoft_token").map_err(|err| {
        println!("[delete_mc_token] delete_credential 失败: {}", err);
        err.to_string()
    })?;

    println!("[delete_mc_token] 凭据删除成功");
    Ok(())
}
