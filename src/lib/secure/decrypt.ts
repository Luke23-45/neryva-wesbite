function hexToBuffer(hex: string): ArrayBuffer {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = Number.parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes.buffer;
}

async function deriveKey(password: string, saltHex: string): Promise<CryptoKey> {
  const salt = hexToBuffer(saltHex);
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveKey'],
  );
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: 100_000, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['decrypt'],
  );
}

export interface EncryptedPayload {
  readonly ciphertext: string;
  readonly iv: string;
  readonly salt: string;
  readonly tag: string;
}

export async function decryptContent(
  data: EncryptedPayload,
  password: string,
): Promise<string> {
  const key = await deriveKey(password, data.salt);
  const iv = hexToBuffer(data.iv);
  const tag = new Uint8Array(hexToBuffer(data.tag));
  const ciphertext = new Uint8Array(hexToBuffer(data.ciphertext));

  const combined = new Uint8Array(ciphertext.length + tag.length);
  combined.set(ciphertext, 0);
  combined.set(tag, ciphertext.length);

  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv, tagLength: 128 },
    key,
    combined,
  );
  return new TextDecoder().decode(decrypted);
}
