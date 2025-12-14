import crypto from "crypto";

export function uuid() {
  return crypto.randomUUID();
}

export function timestamp() {
  return new Date().toISOString(); // ISO + ms + Z
}

export function encrypt(data, publicKey) {
  const buffer = Buffer.from(data, "utf8");
  const encrypted = crypto.publicEncrypt(
    {
      key: `-----BEGIN PUBLIC KEY-----\n${publicKey}\n-----END PUBLIC KEY-----`,
      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING
    },
    buffer
  );
  return encrypted.toString("base64");
}
