declare module 'libsodium-wrappers' {
  export const ready: Promise<void>;
  export function randombytes_buf(length: number): Uint8Array;
  export const crypto_box_NONCEBYTES: number;
  export function from_string(str: string): Uint8Array;
  export function to_string(bytes: Uint8Array): string;
  export function from_base64(str: string): Uint8Array;
  export function to_base64(bytes: Uint8Array): string;
} 