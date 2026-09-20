import dotenv from "dotenv";
import { z } from "zod";

dotenv.config({ quiet: true });

const UNITS = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 };

export const durationToMs = (value) => {
  const match = /^(\d+)([smhd])$/.exec(value);
  if (!match) throw new Error(`Invalid duration: ${value}`);
  return Number(match[1]) * UNITS[match[2]];
};

const duration = z
  .string()
  .regex(/^\d+[smhd]$/, "Use a duration like 15m, 12h or 7d");

const schema = z
  .object({
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
    PORT: z.coerce.number().int().positive().default(5000),
    CLIENT_URL: z.string().url().default("http://localhost:5173"),

    DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
    DATABASE_SSL: z
      .enum(["true", "false"])
      .default("false")
      .transform((v) => v === "true"),
    DB_POOL_MAX: z.coerce.number().int().positive().default(10),

    JWT_ACCESS_SECRET: z.string().min(32, "must be at least 32 characters"),
    JWT_REFRESH_SECRET: z.string().min(32, "must be at least 32 characters"),
    JWT_ACCESS_EXPIRES_IN: duration.default("15m"),
    JWT_REFRESH_EXPIRES_IN: duration.default("7d"),

    COOKIE_SAME_SITE: z.enum(["lax", "strict", "none"]).default("lax"),

    CLOUDINARY_CLOUD_NAME: z.string().default(""),
    CLOUDINARY_API_KEY: z.string().default(""),
    CLOUDINARY_API_SECRET: z.string().default(""),

    SMTP_HOST: z.string().default(""),
    SMTP_PORT: z.coerce.number().int().positive().default(587),
    SMTP_USER: z.string().default(""),
    SMTP_PASS: z.string().default(""),
    EMAIL_FROM: z.string().default("YouTube Clone <no-reply@localhost>"),
  })
  .refine(
    (value) =>
      value.NODE_ENV !== "production" ||
      (!value.JWT_ACCESS_SECRET.includes("change_me") &&
        !value.JWT_REFRESH_SECRET.includes("change_me")),
    {
      message: "JWT secrets must not be the example placeholders in production",
      path: ["JWT_ACCESS_SECRET"],
    },
  );

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment configuration:");
  for (const issue of parsed.error.issues) {
    console.error(`  - ${issue.path.join(".") || "env"}: ${issue.message}`);
  }
  process.exit(1);
}

const data = parsed.data;

export const env = Object.freeze({
  ...data,
  isProd: data.NODE_ENV === "production",
  isTest: data.NODE_ENV === "test",
  isDev: data.NODE_ENV === "development",
  refreshTtlMs: durationToMs(data.JWT_REFRESH_EXPIRES_IN),
});
