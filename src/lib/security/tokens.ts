import { randomBytes } from "crypto";

export function generateHighEntropyToken(length = 32): string {
  return randomBytes(length).toString("hex");
}

export function generatePublicId(): string {
  // URL-friendly, 12+ characters, collision-resistant
  return randomBytes(9).toString("base64url"); // 12 chars
}

export function generateDeliveryToken(): string {
  // Delivery tokens need even higher entropy
  return randomBytes(32).toString("hex"); // 64 chars
}
