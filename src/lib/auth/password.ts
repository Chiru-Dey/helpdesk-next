import { compare, hash } from "bcryptjs";

const ROUNDS = 10;

export async function hashPassword(plain: string): Promise<string> {
  return hash(plain, ROUNDS);
}

export async function verifyPassword(plain: string, hashed: string): Promise<boolean> {
  return compare(plain, hashed);
}

let dummyPromise: Promise<string> | null = null;
function dummy(): Promise<string> {
  if (!dummyPromise) dummyPromise = hash("timing-equalizer", ROUNDS);
  return dummyPromise;
}

export async function verifyTimingSafe(plain: string, hashed: string | null): Promise<boolean> {
  const target = hashed ?? (await dummy());
  const ok = await compare(plain, target);
  return hashed !== null && ok;
}