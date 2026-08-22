//! Microsoft Token 凭据存储

use serde_json::from_str;
use tauri::AppHandle;
use tauri_plugin_keyring::{CredentialType, CredentialValue, KeyringExt};

use super::types::MinecraftLoginResponse;

const MC_TOKEN_KEY: &str = "microsoft_token";

/// 通过系统密钥环保存 Microsoft Token
pub fn set_mc_token(app: &AppHandle, token_resp: &MinecraftLoginResponse) -> Result<(), String> {
    println!("[set_mc_token] 开始存储凭据, username={}", token_resp.username);

    let data = serde_json::to_vec(token_resp).map_err(|e| {
        println!("[set_mc_token] 序列化失败: {}", e);
        e.to_string()
    })?;
    println!("[set_mc_token] 序列化成功, 数据长度={} bytes", data.len());

    app.keyring()
        .set(
            MC_TOKEN_KEY,
            CredentialType::Secret,
            CredentialValue::Secret(data),
        )
        .map_err(|e| {
            println!("[set_mc_token] set_secret 失败: {}", e);
            e.to_string()
        })?;

    println!("[set_mc_token] 凭据存储成功");
    Ok(())
}

/// 从系统密钥环获取 Microsoft Token
pub fn get_mc_token(app: &AppHandle) -> Result<MinecraftLoginResponse, String> {
    println!("[get_mc_token] 开始读取凭据...");

    let token_resp = app
        .keyring()
        .get(MC_TOKEN_KEY, CredentialType::Secret)
        .map_err(|err| {
            println!("[get_mc_token] get_secret 失败: {}", err);
            err.to_string()
        })?;

    let bytes = match token_resp {
        CredentialValue::Secret(secret) => secret,
        _ => {
            println!("[get_mc_token] 凭据类型不匹配");
            return Err("credential type mismatch".to_string());
        }
    };
    println!("[get_mc_token] 读取成功, 数据长度={} bytes", bytes.len());

    let token_str = String::from_utf8(bytes).map_err(|e| {
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
pub fn delete_mc_token(app: &AppHandle) -> Result<(), String> {
    println!("[delete_mc_token] 开始删除凭据...");

    app.keyring()
        .delete(MC_TOKEN_KEY, CredentialType::Secret)
        .map_err(|err| {
            println!("[delete_mc_token] delete_secret 失败: {}", err);
            err.to_string()
        })?;

    println!("[delete_mc_token] 凭据删除成功");
    Ok(())
}
