/**
 * 版本号迭代演示脚本
 * 
 * 演示 alpha 阶段多次更新的版本号变化
 * 运行：node scripts/demo-version-iteration.js
 */

import { parseVersion, formatVersion, bumpVersion, compareSemVer } from './bump-version.js';

console.log('🎬 版本号迭代演示 - Alpha 阶段多次更新\n');
console.log('='.repeat(70));

// 模拟 alpha 阶段的 15 次迭代
console.log('\n📦 Alpha 阶段迭代演示（每日构建）\n');

let currentVersion = parseVersion('0.1.0-alpha.1');

console.log('第 1 天：初始 alpha 版本');
console.log(`  → ${formatVersion(currentVersion)}`);

for (let day = 2; day <= 15; day++) {
  currentVersion = bumpVersion(currentVersion, 'prerelease', 'alpha');
  const versionStr = formatVersion(currentVersion);
  
  console.log(`第 ${day} 天：日常迭代`);
  console.log(`  → ${versionStr}`);
  
  // 每 5 天显示一个里程碑
  if (day % 5 === 0) {
    console.log(`  ✨ 里程碑：完成第 ${day} 次 alpha 迭代\n`);
  }
}

console.log('\n' + '='.repeat(70));

// 演示从 alpha 到 beta 的过渡
console.log('\n📦 从 Alpha 过渡到 Beta\n');

currentVersion = parseVersion('0.1.0-alpha.15');
console.log(`Alpha 最终版本：${formatVersion(currentVersion)}`);

currentVersion = bumpVersion(currentVersion, 'preminor', 'beta');
console.log(`  ↓ 切换到 Beta 阶段`);
console.log(`Beta 初始版本：${formatVersion(currentVersion)}`);

// 模拟 beta 阶段的 8 次迭代
for (let i = 1; i <= 8; i++) {
  currentVersion = bumpVersion(currentVersion, 'prerelease', 'beta');
  console.log(`  → Beta 迭代 ${i}: ${formatVersion(currentVersion)}`);
}

console.log('\n' + '='.repeat(70));

// 演示版本号比较
console.log('\n📦 版本号大小比较演示\n');

const versions = [
  '0.1.0-alpha.1',
  '0.1.0-alpha.5',
  '0.1.0-alpha.10',
  '0.1.0-alpha.15',
  '0.1.0-beta.1',
  '0.1.0-beta.5',
  '0.1.0-rc.1',
  '0.1.0'
];

console.log('版本号递增顺序：\n');
versions.forEach((v, index) => {
  if (index > 0) {
    const prev = versions[index - 1];
    const result = compareSemVer(prev, v);
    const symbol = result < 0 ? '📈' : '❓';
    console.log(`${symbol} ${v.padEnd(20)} (比 ${prev} 新)`);
  } else {
    console.log(`   ${v.padEnd(20)} (初始版本)`);
  }
});

console.log('\n' + '='.repeat(70));

// 演示特殊情况
console.log('\n📦 特殊版本号格式测试\n');

const specialVersions = [
  '0.1.0-alpha.100',      // 大序号
  '0.1.0-alpha.999',      // 超大序号
  '0.1.11-alpha.11',      // 补丁版本和序号都较大
  '10.20.30-beta.50',     // 大版本号
  '0.1.0-alpha-beta.1',   // 带连字符的预发布阶段
  '0.1.0-alpha.1+build.1' // 带构建元数据（当前不支持）
];

specialVersions.forEach(v => {
  try {
    const parsed = parseVersion(v);
    const formatted = formatVersion(parsed);
    console.log(`✅ ${v.padEnd(25)} → 解析成功`);
  } catch (error) {
    console.log(`⚠️  ${v.padEnd(25)} → ${error.message.split(':')[0]}`);
  }
});

console.log('\n' + '='.repeat(70));
console.log('\n✅ 演示完成！\n');

console.log('📋 关键要点：');
console.log('  1. Alpha 阶段可以有任意多次迭代（alpha.1, alpha.2, ..., alpha.999）');
console.log('  2. 补丁版本号可以是任意数字（0.1.11, 0.1.99, 0.1.999）');
console.log('  3. 序号没有上限，支持长期开发周期');
console.log('  4. 每次 prerelease 升级都会递增序号');
console.log('  5. 切换到新阶段（beta/rc）时序号从 0 重新开始\n');
