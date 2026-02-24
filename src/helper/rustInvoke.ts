import { invoke, InvokeArgs, InvokeOptions } from "@tauri-apps/api/core";

/**
 * 调用Rust函数的通用工具函数
 * @param fnName Rust函数名
 * @param args 传给Rust的参数（可选）
 * @param options invoke配置（可选）
 * @returns Promise<any> Rust函数的返回值
 */
export const invokeRustFunction = async (
  fnName: string,
  args: InvokeArgs = {}, // 默认空对象，避免传undefined
  options?: InvokeOptions // 可选参数，符合Tauri原生设计
): Promise<any> => {
  try {
    // 1. 校验函数名
    const trimmedFnName = fnName.trim();
    if (trimmedFnName.length === 0) {
      throw new Error("Rust函数名不能为空！");
    }

    console.log('调用Tauri的invoke，返回Promise');
    
    // 2. 调用Tauri的invoke，返回Promise
    const result = await invoke(trimmedFnName, args, options);
    return result;
  } catch (e) {

    console.log('错误，抛出自定义错误对象');

    // 3. 统一错误处理，抛出自定义错误对象
    const errorMsg = e instanceof Error ? e.message : "调用Rust函数失败";
    console.error(`[Rust调用失败] ${fnName}:`, errorMsg);
    throw new Error(errorMsg);
  }
};

/**
 * 添加账户的专用函数（业务逻辑封装）
 * @param accountName 账户名称（1-16字）
 * @param accountArgs 账户相关参数（传给Rust）
 * @param options invoke配置（可选）
 * @returns Promise<any> Rust返回的账户添加结果
 */
export const addAccount = async (
  accountName: string,
  accountArgs?: InvokeArgs,
  options?: InvokeOptions
): Promise<any> => {
  // 1. 校验账户名称
  const trimmedName = accountName.trim();
  if (trimmedName.length < 1 || trimmedName.length > 16) {
    throw new Error("账户名称必须控制在1-16字之间且不能为空！");
  }

  accountArgs = {name:accountName};
  console.log('accountArgs, ', accountArgs);

  // 2. 校验账户参数
  if (!accountArgs || Object.keys(accountArgs).length === 0) {
    throw new Error("账户参数不能为空！");
  }

  // 3. 调用通用Rust函数（假设Rust端的函数名是 "add_account"）
  return await invokeRustFunction("add_account", {
    name: trimmedName,
    ...accountArgs, // 合并账户名称和其他参数
  }, options);
};