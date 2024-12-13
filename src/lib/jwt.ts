import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.NEXTAUTH_SECRET!;

interface TokenPayload {
  id: string;
  email: string;
  name: string | null;
  emailVerified: boolean;
}

export function signJwtAccessToken(payload: TokenPayload) {
  const token = jwt.sign(payload, JWT_SECRET, {
    expiresIn: "1d",
  });
  return token;
}

export function verifyJwt(token: string) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded as TokenPayload;
  } catch (error) {
    console.error("JWT verification error:", error);
    return null;
  }
} 