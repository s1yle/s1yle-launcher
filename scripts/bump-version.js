import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import readline from 'readline';


// 获取 __dirname（ES Modules 兼容）
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// 配置文件路径
const PACKAGE_JSON_PATH = path.join(__dirname, '../package.json');
const TAURI_CONF_PATH = path.join(__dirname, '../src-tauri/tauri.conf.json');

// 版本号解析正则（符合 SemVer 2.0.0）
const VERSION_REGEX = /^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z-]+)(?:\.([0-9A-Za-z-]+)))?$/;

/**
 * 解析版本号
 * @param {string} version 版本号字符串
 * @returns {Object} 解析后的版本对象
 */
function parseVersion(version) {
  const match = version.match(VERSION_REGEX);
  if (!match) {
    throw new Error(`无效的版本号格式: ${version}（应符合 SemVer 2.0.0 规范）`);
  }

  return {
    major: parseInt(match[1], 10),
    minor: parseInt(match[2], 10),
    patch: parseInt(match[3], 10),
    preRelease: match[4] || null,
    preReleaseNumber: match[5] ? parseInt(match[5], 10) : 0,
  };
}

/**
 * 格式化版本号
 * @param {Object} versionObj 版本对象
 * @returns {string} 格式化后的版本号字符串
 */
function formatVersion(versionObj) {
  let version = `${versionObj.major}.${versionObj.minor}.${versionObj.patch}`;
  if (versionObj.preRelease) {
    version += `-${versionObj.preRelease}.${versionObj.preReleaseNumber}`;
  }
  return version;
}

/**
 * 比较两个版本号（完整 SemVer 2.0.0 比较，包括预发布版本）
 * @param {string} versionA 版本号 A
 * @param {string} versionB 版本号 B
 * @returns {number} -1 (A < B), 0 (A = B), 1 (A > B)
 */
function compareSemVer(versionA, versionB) {
  const a = parseVersion(versionA);
  const b = parseVersion(versionB);

  // 比较主版本、次版本、补丁版本
  if (a.major !== b.major) return a.major - b.major > 0 ? 1 : -1;
  if (a.minor !== b.minor) return a.minor - b.minor > 0 ? 1 : -1;
  if (a.patch !== b.patch) return a.patch - b.patch > 0 ? 1 : -1;
  
  // 如果都没有预发布版本，则相等
  if (!a.preRelease && !b.preRelease) return 0;
  
  // 一个有预发布，一个没有（正式版 > 预发布）
  if (!a.preRelease && b.preRelease) return 1;
  if (a.preRelease && !b.preRelease) return -1;
  
  // 都有预发布，比较预发布阶段
  if (a.preRelease !== b.preRelease) {
    // alpha < beta < rc
    const stageOrder = { alpha: 1, beta: 2, rc: 3 };
    const aOrder = stageOrder[a.preRelease] || 0;
    const bOrder = stageOrder[b.preRelease] || 0;
    return aOrder - bOrder > 0 ? 1 : -1;
  }
  
  // 预发布阶段相同，比较序号
  if (a.preReleaseNumber !== b.preReleaseNumber) {
    return a.preReleaseNumber - b.preReleaseNumber > 0 ? 1 : -1;
  }
  
  return 0;
}

/**
 * 计算新版本号
 * @param {Object} current 当前版本对象
 * @param {string} type 升级类型
 * @param {string} preReleaseStage 预发布阶段 (alpha/beta/rc)
 * @returns {Object} 新版本对象
 */
function bumpVersion(current, type, preReleaseStage = 'alpha') {
  const newVersion = { ...current };

  switch (type) {
    case 'patch':
      newVersion.patch += 1;
      newVersion.preRelease = null;
      newVersion.preReleaseNumber = 0;
      break;

    case 'minor':
      newVersion.minor += 1;
      newVersion.patch = 0;
      newVersion.preRelease = null;
      newVersion.preReleaseNumber = 0;
      break;

    case 'major':
      newVersion.major += 1;
      newVersion.minor = 0;
      newVersion.patch = 0;
      newVersion.preRelease = null;
      newVersion.preReleaseNumber = 0;
      break;

    case 'prepatch':
      newVersion.patch += 1;
      newVersion.preRelease = preReleaseStage;
      newVersion.preReleaseNumber = 0;
      break;

    case 'preminor':
      newVersion.minor += 1;
      newVersion.patch = 0;
      newVersion.preRelease = preReleaseStage;
      newVersion.preReleaseNumber = 0;
      break;

    case 'premajor':
      newVersion.major += 1;
      newVersion.minor = 0;
      newVersion.patch = 0;
      newVersion.preRelease = preReleaseStage;
      newVersion.preReleaseNumber = 0;
      break;

    case 'prerelease':
      if (newVersion.preRelease) {
        newVersion.preReleaseNumber += 1;
      } else {
        newVersion.patch += 1;
        newVersion.preRelease = preReleaseStage;
        newVersion.preReleaseNumber = 0;
      }
      break;

    case 'reset':
      // 硬重置到指定的 alpha 版本
      newVersion.major = 0;
      newVersion.minor = 1;
      newVersion.patch = 0;
      newVersion.preRelease = preReleaseStage;
      newVersion.preReleaseNumber = 1; // 从 1 开始，不是 0
      break;

    default:
      throw new Error(`未知的升级类型: ${type}`);
  }

  return newVersion;
}

/**
 * 验证版本升级是否合法（防止降级）
 * @param {string} currentVersionStr 当前版本号
 * @param {string} newVersionStr 新版本号
 */
function validateVersionBump(currentVersionStr, newVersionStr) {
  const comparison = compareSemVer(currentVersionStr, newVersionStr);
  if (comparison > 0) {
    throw new Error(
      `版本号不能降级！当前版本: ${currentVersionStr}，目标版本: ${newVersionStr}`
    );
  }
  if (comparison === 0) {
    throw new Error(`版本号没有变化！当前版本: ${currentVersionStr}`);
  }
}

/**
 * 读取 JSON 文件
 * @param {string} filePath 文件路径
 * @returns {Object} JSON 对象
 */
function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

/**
 * 写入 JSON 文件
 * @param {string} filePath 文件路径
 * @param {Object} data JSON 对象
 */
function writeJson(filePath, data) {
  fs.writeFileSync(
    filePath,
    JSON.stringify(data, null, 2) + '\n',
    'utf8'
  );
}

// 主函数
async function main() {
  const args = process.argv.slice(2);
  const type = args[0] || 'prerelease';
  const preReleaseStage = args[1] || 'alpha';
  const dryRun = args.includes('--dry-run');
  const useGit = args.includes('--git'); // 默认不执行 git 操作

  try {
    // 读取当前版本
    const packageJson = readJson(PACKAGE_JSON_PATH);
    const tauriConf = readJson(TAURI_CONF_PATH);
    const currentVersionStr = packageJson.version;

    console.log(`当前版本: ${currentVersionStr}`);

    // 检查版本一致性（Tauri 2.x 的 version 在根级别）
    const tauriVersion = tauriConf.version || tauriConf.package?.version;
    if (tauriVersion !== currentVersionStr) {
      console.warn(
        `⚠️  警告: tauri.conf.json 版本号 (${tauriVersion}) 与 package.json 不一致`
      );
    }

    // 计算新版本
    const currentVersion = parseVersion(currentVersionStr);
    const newVersion = bumpVersion(currentVersion, type, preReleaseStage);
    const newVersionStr = formatVersion(newVersion);

    console.log(`新版本: ${newVersionStr}`);

    // 验证版本升级（防止降级），reset 类型除外
    if (!dryRun && type !== 'reset') {
      validateVersionBump(currentVersionStr, newVersionStr);
    } else if (type === 'reset' && !dryRun) {
      // reset 类型时，如果版本号相同，显示警告
      if (currentVersionStr === newVersionStr) {
        console.warn(`⚠️  警告: 版本号没有变化，仍为 ${currentVersionStr}`);
      } else {
        // reset 可能导致版本号降低（如从 0.2.0 重置到 0.1.0-alpha.1），需要确认
        const comparison = compareSemVer(currentVersionStr, newVersionStr);
        if (comparison > 0) {
          console.warn(`⚠️  注意: 版本号将从 ${currentVersionStr} 降低到 ${newVersionStr}`);
        }
      }
    }

    if (dryRun) {
      console.log('✅ 预览模式，未修改任何文件');
      return;
    }

    // 更新文件
    packageJson.version = newVersionStr;

    // Tauri 2.x 的 version 在根级别
    if (tauriConf.version !== undefined) {
      tauriConf.version = newVersionStr;
    } else if (tauriConf.package) {
      tauriConf.package.version = newVersionStr;
    }

    writeJson(PACKAGE_JSON_PATH, packageJson);
    writeJson(TAURI_CONF_PATH, tauriConf);

    console.log('✅ 已更新 package.json 和 tauri.conf.json');

    // Git 操作（需要显式启用）
    if (useGit) {
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });

      try {
        // 显示确认信息
        console.log('\n📋 即将执行以下 Git 操作:');
        console.log(`   1. git add ${PACKAGE_JSON_PATH}`);
        console.log(`   2. git add ${TAURI_CONF_PATH}`);
        console.log(`   3. git commit -m "chore: bump version to ${newVersionStr}"`);
        console.log(`   4. git tag v${newVersionStr}`);
        console.log('');

        const answer = await new Promise((resolve) => {
          console.log('---> ❗ git操作需谨慎！  <---');
          console.log('');
          rl.question('⚠️  确定要继续吗？(y/n): ', resolve);
        });

        const confirmed = answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes';

        if (!confirmed) {
          console.log('❌ 已取消 Git 操作');
          return;
        }

        console.log('📝 正在创建 Git 提交和标签...');
        execSync(`git add ${PACKAGE_JSON_PATH} ${TAURI_CONF_PATH}`);
        execSync(`git commit -m "chore:  bump version to ${newVersionStr}"`);
        execSync(`git tag v${newVersionStr}`);
        console.log(`✅ 已创建提交和标签: v${newVersionStr}`);
        console.log('💡 执行 git push && git push --tags 推送到远程');
      } finally {
        rl.close();
      }
    } else {
      // 一些提示
      console.log('💡 如需创建 Git 提交和标签，请添加 --git 参数');
      // console.log('❗(请谨慎使用git操作!) 如需创建 Git 提交和标签，请添加 --git 参数，或手动执行如下：');
      // console.log('git操作如下: ');
      // console.log('Git 命令 1: 暂存文件');
      // console.log('->   示例:  git add c: /WeCraft-Launcher/package.json')
      // console.log('->         git add c: /WeCraft-Launcher/src-tauri/tauri.conf.json')
      // console.log('Git 命令 2: 创建提交');
      // console.log('->   示例:  git commit -m "chore:  bump version to 0.1.0-alpha.2"');
      // console.log('Git 命令 3: 创建标签');
      // console.log('->   示例:  git tag v0.1.0-alpha.2"');
      // console.log('Git 命令 4 (不执行): 推送到远程');
      // console.log('->   示例:  git push && git push --tags"');
    }
  } catch (error) {
    console.error('❌ 错误: ', error.message);
    process.exit(1);
  }
}

// 导出函数供测试使用
export { parseVersion, formatVersion, bumpVersion, compareSemVer, validateVersionBump };

main();
