/**
 * bump-version.js 单元测试
 * 
 * 运行方式：node scripts/bump-version.test.js
 */

import { describe, it, assert } from 'node:test';
import { strictEqual, deepStrictEqual, throws, ok } from 'node:assert';
import { parseVersion, formatVersion, bumpVersion, compareSemVer, validateVersionBump } from './bump-version.js';

// 测试计数器
let passed = 0;
let failed = 0;

// 自定义测试运行器
function runTest(name, fn) {
  try {
    fn();
    console.log(`✅ ${name}`);
    passed++;
  } catch (error) {
    console.error(`❌ ${name}`);
    console.error(`   错误：${error.message}`);
    failed++;
  }
}

console.log('🧪 开始运行 bump-version.js 单元测试\n');
console.log('='.repeat(60));

// ============================================================================
// 1. parseVersion 测试
// ============================================================================
console.log('\n📦 parseVersion 测试\n');

runTest('解析标准版本号 1.2.3', () => {
  const result = parseVersion('1.2.3');
  deepStrictEqual(result, {
    major: 1,
    minor: 2,
    patch: 3,
    preRelease: null,
    preReleaseNumber: 0
  });
});

runTest('解析 alpha 版本号 0.1.0-alpha.1', () => {
  const result = parseVersion('0.1.0-alpha.1');
  deepStrictEqual(result, {
    major: 0,
    minor: 1,
    patch: 0,
    preRelease: 'alpha',
    preReleaseNumber: 1
  });
});

runTest('解析 beta 版本号 0.2.0-beta.5', () => {
  const result = parseVersion('0.2.0-beta.5');
  deepStrictEqual(result, {
    major: 0,
    minor: 2,
    patch: 0,
    preRelease: 'beta',
    preReleaseNumber: 5
  });
});

runTest('解析 rc 版本号 1.0.0-rc.3', () => {
  const result = parseVersion('1.0.0-rc.3');
  deepStrictEqual(result, {
    major: 1,
    minor: 0,
    patch: 0,
    preRelease: 'rc',
    preReleaseNumber: 3
  });
});

runTest('解析带连字符的预发布版本 1.0.0-alpha-beta.1', () => {
  const result = parseVersion('1.0.0-alpha-beta.1');
  deepStrictEqual(result, {
    major: 1,
    minor: 0,
    patch: 0,
    preRelease: 'alpha-beta',
    preReleaseNumber: 1
  });
});

runTest('解析大版本号 10.20.30', () => {
  const result = parseVersion('10.20.30');
  deepStrictEqual(result, {
    major: 10,
    minor: 20,
    patch: 30,
    preRelease: null,
    preReleaseNumber: 0
  });
});

runTest('解析无效版本号应该抛出错误', () => {
  throws(() => parseVersion('invalid'), /无效的版本号格式/);
});

runTest('解析缺失补丁版本号应该抛出错误', () => {
  throws(() => parseVersion('1.2'), /无效的版本号格式/);
});

// ============================================================================
// 2. formatVersion 测试
// ============================================================================
console.log('\n📦 formatVersion 测试\n');

runTest('格式化标准版本号', () => {
  const input = { major: 1, minor: 2, patch: 3, preRelease: null, preReleaseNumber: 0 };
  const result = formatVersion(input);
  strictEqual(result, '1.2.3');
});

runTest('格式化 alpha 版本号', () => {
  const input = { major: 0, minor: 1, patch: 0, preRelease: 'alpha', preReleaseNumber: 1 };
  const result = formatVersion(input);
  strictEqual(result, '0.1.0-alpha.1');
});

runTest('格式化 beta 版本号', () => {
  const input = { major: 0, minor: 2, patch: 0, preRelease: 'beta', preReleaseNumber: 5 };
  const result = formatVersion(input);
  strictEqual(result, '0.2.0-beta.5');
});

runTest('格式化 rc 版本号', () => {
  const input = { major: 1, minor: 0, patch: 0, preRelease: 'rc', preReleaseNumber: 3 };
  const result = formatVersion(input);
  strictEqual(result, '1.0.0-rc.3');
});

// ============================================================================
// 3. compareSemVer 测试（重点修复）
// ============================================================================
console.log('\n📦 compareSemVer 测试\n');

runTest('比较相同版本号', () => {
  strictEqual(compareSemVer('1.0.0', '1.0.0'), 0);
});

runTest('比较不同主版本', () => {
  strictEqual(compareSemVer('2.0.0', '1.0.0'), 1);
  strictEqual(compareSemVer('1.0.0', '2.0.0'), -1);
});

runTest('比较不同次版本', () => {
  strictEqual(compareSemVer('1.2.0', '1.1.0'), 1);
  strictEqual(compareSemVer('1.1.0', '1.2.0'), -1);
});

runTest('比较不同补丁版本', () => {
  strictEqual(compareSemVer('1.0.3', '1.0.2'), 1);
  strictEqual(compareSemVer('1.0.2', '1.0.3'), -1);
});

runTest('比较预发布版本和正式版（正式版 > 预发布）', () => {
  ok(compareSemVer('1.0.0', '1.0.0-alpha.1') > 0, '正式版应该大于 alpha');
  ok(compareSemVer('1.0.0', '1.0.0-beta.1') > 0, '正式版应该大于 beta');
  ok(compareSemVer('1.0.0', '1.0.0-rc.1') > 0, '正式版应该大于 rc');
});

runTest('比较不同预发布阶段（alpha < beta < rc）', () => {
  ok(compareSemVer('1.0.0-beta.1', '1.0.0-alpha.1') > 0, 'beta 应该大于 alpha');
  ok(compareSemVer('1.0.0-rc.1', '1.0.0-beta.1') > 0, 'rc 应该大于 beta');
  ok(compareSemVer('1.0.0-alpha.1', '1.0.0-beta.1') < 0, 'alpha 应该小于 beta');
});

runTest('比较相同预发布阶段的不同序号', () => {
  strictEqual(compareSemVer('1.0.0-alpha.2', '1.0.0-alpha.1'), 1);
  strictEqual(compareSemVer('1.0.0-alpha.1', '1.0.0-alpha.2'), -1);
  strictEqual(compareSemVer('1.0.0-alpha.1', '1.0.0-alpha.1'), 0);
});

runTest('比较 beta 版本号', () => {
  strictEqual(compareSemVer('1.0.0-beta.5', '1.0.0-beta.3'), 1);
  strictEqual(compareSemVer('1.0.0-beta.3', '1.0.0-beta.5'), -1);
});

runTest('比较 rc 版本号', () => {
  strictEqual(compareSemVer('1.0.0-rc.10', '1.0.0-rc.9'), 1);
  strictEqual(compareSemVer('1.0.0-rc.9', '1.0.0-rc.10'), -1);
});

runTest('复杂版本比较', () => {
  // 0.1.0-alpha.1 < 0.1.0-alpha.2 < 0.1.0-beta.1 < 0.1.0-rc.1 < 0.1.0
  const versions = [
    '0.1.0-alpha.1',
    '0.1.0-alpha.2',
    '0.1.0-beta.1',
    '0.1.0-rc.1',
    '0.1.0'
  ];
  
  for (let i = 0; i < versions.length - 1; i++) {
    ok(compareSemVer(versions[i], versions[i + 1]) < 0, 
      `${versions[i]} 应该小于 ${versions[i + 1]}`);
  }
});

// ============================================================================
// 4. bumpVersion 测试
// ============================================================================
console.log('\n📦 bumpVersion 测试\n');

runTest('patch 升级', () => {
  const current = { major: 1, minor: 2, patch: 3, preRelease: null, preReleaseNumber: 0 };
  const result = bumpVersion(current, 'patch');
  strictEqual(formatVersion(result), '1.2.4');
});

runTest('minor 升级', () => {
  const current = { major: 1, minor: 2, patch: 3, preRelease: null, preReleaseNumber: 0 };
  const result = bumpVersion(current, 'minor');
  strictEqual(formatVersion(result), '1.3.0');
});

runTest('major 升级', () => {
  const current = { major: 1, minor: 2, patch: 3, preRelease: null, preReleaseNumber: 0 };
  const result = bumpVersion(current, 'major');
  strictEqual(formatVersion(result), '2.0.0');
});

runTest('prerelease 升级（无预发布）', () => {
  const current = { major: 0, minor: 1, patch: 0, preRelease: null, preReleaseNumber: 0 };
  const result = bumpVersion(current, 'prerelease', 'alpha');
  strictEqual(formatVersion(result), '0.1.1-alpha.0');
});

runTest('prerelease 升级（有预发布）', () => {
  const current = { major: 0, minor: 1, patch: 0, preRelease: 'alpha', preReleaseNumber: 1 };
  const result = bumpVersion(current, 'prerelease', 'alpha');
  strictEqual(formatVersion(result), '0.1.0-alpha.2');
});

runTest('prepatch 升级', () => {
  const current = { major: 0, minor: 1, patch: 0, preRelease: null, preReleaseNumber: 0 };
  const result = bumpVersion(current, 'prepatch', 'alpha');
  strictEqual(formatVersion(result), '0.1.1-alpha.0');
});

runTest('preminor 升级', () => {
  const current = { major: 0, minor: 1, patch: 0, preRelease: null, preReleaseNumber: 0 };
  const result = bumpVersion(current, 'preminor', 'beta');
  strictEqual(formatVersion(result), '0.2.0-beta.0');
});

runTest('premajor 升级', () => {
  const current = { major: 0, minor: 1, patch: 0, preRelease: null, preReleaseNumber: 0 };
  const result = bumpVersion(current, 'premajor', 'rc');
  strictEqual(formatVersion(result), '1.0.0-rc.0');
});

runTest('reset 升级', () => {
  const current = { major: 2, minor: 5, patch: 10, preRelease: 'beta', preReleaseNumber: 3 };
  const result = bumpVersion(current, 'reset', 'alpha');
  strictEqual(formatVersion(result), '0.1.0-alpha.1');
});

// ============================================================================
// 5. validateVersionBump 测试
// ============================================================================
console.log('\n📦 validateVersionBump 测试\n');

runTest('验证正常升级（应该通过）', () => {
  // 不应该抛出错误
  validateVersionBump('0.1.0-alpha.1', '0.1.0-alpha.2');
  validateVersionBump('0.1.0', '0.2.0');
  validateVersionBump('1.0.0', '2.0.0');
});

runTest('验证降级（应该抛出错误）', () => {
  throws(() => validateVersionBump('0.2.0', '0.1.0'), /版本号不能降级/);
  throws(() => validateVersionBump('1.0.0', '0.9.0'), /版本号不能降级/);
});

runTest('验证相同版本（应该抛出错误）', () => {
  throws(() => validateVersionBump('0.1.0-alpha.1', '0.1.0-alpha.1'), /版本号没有变化/);
});

// ============================================================================
// 测试结果汇总
// ============================================================================
console.log('\n' + '='.repeat(60));
console.log(`\n测试结果：${passed} 通过，${failed} 失败\n`);

if (failed > 0) {
  console.log('❌ 部分测试失败，请检查上面的错误信息');
  process.exit(1);
} else {
  console.log('✅ 所有测试通过！');
  process.exit(0);
}
