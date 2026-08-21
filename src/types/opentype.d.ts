declare module 'opentype.js' {
  export interface Font {
    unitsPerEm: number;
    ascender: number;
    descender: number;
    getPath(text: string, x: number, y: number, fontSize: number, options?: Record<string, unknown>): Path;
    getAdvanceWidth(text: string, fontSize: number, options?: Record<string, unknown>): number;
  }
  export interface Path {
    toPathData(decimal?: number): string;
  }
  export function load(
    url: string,
    callback?: (err: unknown, font: Font) => void
  ): Promise<Font>;
  export function parse(buffer: ArrayBuffer): Font;
}
