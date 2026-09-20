import jwt from "jsonwebtoken";
import { env } from "./environment.js";

const ISSUER = "youtube-clone";

export const signAccessToken = (user) =>
  jwt.sign({ role: user.role }, env.JWT_ACCESS_SECRET, {
    subject: user.id,
    issuer: ISSUER,
    algorithm: "HS256",
    expiresIn: env.JWT_ACCESS_EXPIRES_IN,
  });

export const verifyAccessToken = (token) =>
  jwt.verify(token, env.JWT_ACCESS_SECRET, {
    issuer: ISSUER,
    algorithms: ["HS256"],
  });
