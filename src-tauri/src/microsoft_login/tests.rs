//! Microsoft 登录集成测试

use tokio_util::sync::CancellationToken;

use super::oauth::{get_devicecode, get_user_authorize};
use super::xbox::{get_minecraft_access_token, get_xbox_live_validation, get_xsts_validation};

#[tokio::test]
async fn login_microsoft() {
    let client_id = "07e2e2dd-ee1f-4a8f-a09a-1325ba9ff0cd".to_string();
    let device_code = get_devicecode(&client_id)
        .await
        .expect("get_devicecode failed");

    let cancel = CancellationToken::new();
    let handle = get_user_authorize(client_id, device_code, cancel)
        .await
        .expect("get_user_authorize failed");
    let ms_token = handle
        .await
        .expect("Task panicked")
        .expect("Task returned error");
    println!("Microsoft Access Token: {:?}", ms_token.access_token);

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
