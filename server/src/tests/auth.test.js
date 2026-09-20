import { describe, expect, it } from "vitest";
import request from "supertest";
import app from "../app.js";
import {
  registerSchema,
  changePasswordSchema,
} from "../validators/auth.validator.js";
import { generateOpaqueToken, hashToken } from "../utils/generateToken.js";
import { signAccessToken, verifyAccessToken } from "../config/jwt.js";
import { durationToMs } from "../config/environment.js";

describe("platform", () => {
  it("reports health", async () => {
    const res = await request(app).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe("ok");
  });

  it("returns a JSON 404 for unknown routes", async () => {
    const res = await request(app).get("/api/does-not-exist");
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("NOT_FOUND");
  });

  it("rejects malformed JSON with 400", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .set("Content-Type", "application/json")
      .send("{bad json");
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("INVALID_JSON");
  });

  it("blocks state-changing requests from foreign origins", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .set("Origin", "http://evil.example")
      .send({ email: "a@b.co", password: "x" });
    expect(res.status).toBe(403);
  });
});

describe("auth validation and guards", () => {
  it("rejects a weak password on register", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({
        email: "user@example.com",
        password: "short",
        displayName: "User",
      });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
    expect(res.body.error.details[0].field).toBe("password");
  });

  it("rejects unknown fields on register", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({
        email: "user@example.com",
        password: "Passw0rd!",
        displayName: "User",
        role: "admin",
      });
    expect(res.status).toBe(400);
  });

  it("requires a body on login", async () => {
    const res = await request(app).post("/api/auth/login");
    expect(res.status).toBe(400);
  });

  it("protects /me without a token", async () => {
    const res = await request(app).get("/api/auth/me");
    expect(res.status).toBe(401);
  });

  it("flags an invalid bearer token", async () => {
    const res = await request(app)
      .get("/api/auth/me")
      .set("Authorization", "Bearer not-a-token");
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("INVALID_TOKEN");
  });

  it("protects channel and user updates", async () => {
    expect(
      (await request(app).patch("/api/channels/me").send({ name: "x" })).status,
    ).toBe(401);
    expect(
      (await request(app).patch("/api/users/me").send({ displayName: "x" }))
        .status,
    ).toBe(401);
  });

  it("validates the channel handle param", async () => {
    const res = await request(app).get("/api/channels/a");
    expect(res.status).toBe(400);
  });
});

describe("schemas and helpers", () => {
  it("normalizes email and handle, and blocks reserved handles", () => {
    const ok = registerSchema.parse({
      email: "  User@Example.COM ",
      password: "Passw0rd!",
      displayName: " Selam ",
      handle: "Selam_01",
    });
    expect(ok.email).toBe("user@example.com");
    expect(ok.displayName).toBe("Selam");
    expect(ok.handle).toBe("selam_01");

    const reserved = registerSchema.safeParse({
      email: "a@b.co",
      password: "Passw0rd!",
      displayName: "A",
      handle: "admin",
    });
    expect(reserved.success).toBe(false);
  });

  it("requires a different new password", () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: "Passw0rd!",
      newPassword: "Passw0rd!",
    });
    expect(result.success).toBe(false);
  });

  it("hashes tokens deterministically without exposing them", () => {
    const token = generateOpaqueToken();
    expect(token.length).toBeGreaterThanOrEqual(43);
    expect(hashToken(token)).toBe(hashToken(token));
    expect(hashToken(token)).not.toContain(token);
  });

  it("round-trips access tokens", () => {
    const token = signAccessToken({
      id: "3f4b5a2e-8c1d-4e6f-9a7b-1c2d3e4f5a6b",
      role: "user",
    });
    const payload = verifyAccessToken(token);
    expect(payload.sub).toBe("3f4b5a2e-8c1d-4e6f-9a7b-1c2d3e4f5a6b");
    expect(payload.role).toBe("user");
  });

  it("parses durations", () => {
    expect(durationToMs("15m")).toBe(900_000);
    expect(durationToMs("7d")).toBe(604_800_000);
    expect(() => durationToMs("abc")).toThrow();
  });
});
