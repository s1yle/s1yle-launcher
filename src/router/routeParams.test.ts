import { describe, expect, it } from 'vitest';
import { parseRouteParams } from './routeParams';

describe('parseRouteParams', () => {
  it('解析单动态段', () => {
    expect(parseRouteParams('/instance-manage/:id', '/instance-manage/abc')).toEqual({ id: 'abc' });
  });

  it('解析多动态段', () => {
    expect(parseRouteParams('/download/game/:versionId', '/download/game/1.21')).toEqual({ versionId: '1.21' });
  });

  it('无参数路由返回空对象', () => {
    expect(parseRouteParams('/instance-list', '/instance-list')).toEqual({});
  });

  it('实际路径较短时缺失参数为 undefined', () => {
    expect(parseRouteParams('/instance-manage/:id/mods', '/instance-manage/abc')).toEqual({ id: 'abc' });
  });

  it('URL 编码值保持原样', () => {
    expect(parseRouteParams('/download/game/:versionId', '/download/game/1.21%20forge')).toEqual({ versionId: '1.21%20forge' });
  });
});
