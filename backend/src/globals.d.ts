declare const process: {
  env: Record<string, string | undefined>;
};

declare class Buffer extends Uint8Array {
  static from(
    data: string | ArrayBufferLike | ArrayLike<number>,
    encoding?: string
  ): Buffer;
  static byteLength(text: string, encoding?: string): number;
  toString(encoding?: string): string;
}

declare module "node:crypto" {
  export function createHash(algorithm: string): {
    update(data: string): {
      digest(encoding: string): string;
    };
  };

  export function randomUUID(): string;
}
