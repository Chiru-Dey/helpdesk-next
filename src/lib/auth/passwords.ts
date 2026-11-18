import { compare, hash } from "bcryptjs";

const BCRYPT_ROUNDS = 10;

export async function hashPassword(plain: string): Promise<string> {
  return hash(plain, BCRYPT_ROUNDS);
}

export async function verifyPassword(
  plain: string,
  hashed: string,
): Promise<boolean> {
  return compare(plain, hashed);
}

let dummyHashPromise: Promise<string> | null = null;

function getDummyHash(): Promise<string> {
  if (dummyHashPromise === null) {
    dummyHashPromise = hash("dummy-value-for-timing-equality", BCRYPT_ROUNDS);
  }
  return dummyHashPromise;
}

/**
 * Verifies a password even when the user does not exist, so that
 * response timing does not reveal which emails are registered.
 */
export async function verifyPasswordTimingSafe(
  plain: string,
  hashed: string | null,
): Promise<boolean> {
  const target = hashed ?? (await getDummyHash());
  const matches = await compare(plain, target);
  return hashed !== null && matches;
}