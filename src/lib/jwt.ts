import { SignJWT, jwtVerify } from 'jose';

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'sentient_cortex_mini_erp_secure_jwt_secret_key_2026'
);

export async function signToken(payload: {
  id: string;
  email: string;
  role: string;
  name: string;
}): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(SECRET);
}

export async function verifyToken(token: string): Promise<{
  id: string;
  email: string;
  role: string;
  name: string;
} | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload as any;
  } catch (error) {
    return null;
  }
}
