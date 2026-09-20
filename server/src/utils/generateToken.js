import crypto from "node:crypto";
import { env } from "../config/environment.js";

export const generateOpaqueToken = () =>
  crypto.randomBytes(32).toString("base64url");

// Only this hash is stored, so a database leak can't be used to replay tokens.
export const hashToken = (token) =>
  crypto
    .createHmac("sha256", env.JWT_REFRESH_SECRET)
    .update(token)
    .digest("hex");
