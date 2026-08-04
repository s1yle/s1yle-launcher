//! Microsoft 登录集成测试

use crate::microsoft_login::{do_minecraft_login, do_xbox_auth, do_xsts_auth, finalize_and_store, poll_oauth_token, start_device_code};

use super::oauth::{get_devicecode, get_user_authorize};
use super::xbox::{get_xbox_live_validation, get_xsts_validation, get_minecraft_access_token};
use super::uuid::get_user_uuid;

#[tokio::test]
async fn login_microsoft() {
    let client_id = "07e2e2dd-ee1f-4a8f-a09a-1325ba9ff0cd".to_string();
    let device_code = get_devicecode(&client_id)
        .await
        .expect("get_devicecode failed");

    let (handle, mut rx) = get_user_authorize(client_id, device_code)
        .await
        .expect("get_user_authorize failed");
    let ms_token = rx;
    println!("Microsoft Access Token: {:?}", ms_token.access_token);
    handle
        .await
        .expect("Task panicked")
        .expect("Task returned error");

    let xbl_response = get_xbox_live_validation(&ms_token.access_token)
        .await
        .expect("xbox 验证失败");
    let uhs = xbl_response
        .display_claims
        .xui
        .first()
        .map(|x| x.uhs.as_str())
        .expect("uhs not found");
    println!("Xbox Live UHS: {}", uhs);

    let xsts_response = get_xsts_validation(&vec![xbl_response.token])
        .await
        .expect("xsts 验证失败");

    let mc_token = get_minecraft_access_token(uhs, &xsts_response.token)
        .await
        .expect("minecraft 登录失败");
    println!("Minecraft Access Token: {}", mc_token.access_token);
}

#[tokio::test]
async fn test_user_uuid() {
    // match get_user_uuid().await {
    //     Ok(user) => {
    //         println!("User: {:?}", user);
    //     }
    //     Err(e) => {
    //         println!("get_user_uuid failed: {}", e);
    //     }
    // };
}


#[tokio::test]
async fn test_mc_login() {
    println!("[TEST] ===== test_mc_login 开始 =====");

    println!("[TEST] Step 1: start_device_code");
    let rs = start_device_code().await.expect("start_device_code 失败");
    println!("[TEST] Step 1 完成: user_code={}", rs.user_code);

    println!("[TEST] Step 2: poll_oauth_token (等待用户授权)");
    poll_oauth_token().await.expect("poll_oauth_token 失败");
    println!("[TEST] Step 2 完成: OAuth token 已获取");

    println!("[TEST] Step 3: do_xbox_auth");
    do_xbox_auth().await.expect("do_xbox_auth 失败");
    println!("[TEST] Step 3 完成: Xbox Live 认证通过");

    println!("[TEST] Step 4: do_xsts_auth");
    do_xsts_auth().await.expect("do_xsts_auth 失败");
    println!("[TEST] Step 4 完成: XSTS 认证通过");

    println!("[TEST] Step 5: do_minecraft_login");
    do_minecraft_login().await.expect("do_minecraft_login 失败");
    println!("[TEST] Step 5 完成: Minecraft 登录成功");

    println!("[TEST] Step 6: get_user_uuid");
    get_user_uuid().await.expect("get_user_uuid 失败");
    println!("[TEST] Step 6 完成: 用户 UUID 已获取");

    println!("[TEST] Step 8: finalize_and_store");
    finalize_and_store().await.expect("finalize_and_store 失败");
    println!("[TEST] Step 8 完成: 凭据已存储");

    println!("[TEST] ===== test_mc_login 全部完成 =====");
}