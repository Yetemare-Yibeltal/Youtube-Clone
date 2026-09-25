import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import request from "supertest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

process.env.NODE_ENV = "test";
process.env.JWT_ACCESS_SECRET = "test_access_secret_1234567890";
process.env.JWT_REFRESH_SECRET = "test_refresh_secret_1234567890";

let mongod;
let app;
let User;

async function registerAndLogin(overrides = {}) {
  const user = {
    username: "accountuser1",
    email: "accountuser1@example.com",
    fullName: "Account User",
    password: "Passw0rd!",
    ...overrides,
  };

  await request(app).post("/api/v1/auth/register").send(user);
  const loginRes = await request(app)
    .post("/api/v1/auth/login")
    .send({ identifier: user.email, password: user.password });

  const meRes = await request(app)
    .get("/api/v1/auth/me")
    .set("Cookie", loginRes.headers["set-cookie"]);

  return {
    user,
    cookies: loginRes.headers["set-cookie"],
    userId: meRes.body.data._id,
  };
}

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongod.getUri();

  await mongoose.connect(process.env.MONGODB_URI);
  ({ default: app } = await import("../app.js"));
  ({ default: User } = await import("../models/User.js"));
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

beforeEach(async () => {
  const collections = await mongoose.connection.db.collections();
  for (const collection of collections) {
    await collection.deleteMany({});
  }
});

describe("User account flow", () => {
  it("fetches the current authenticated user profile", async () => {
    const { user, cookies } = await registerAndLogin();

    const res = await request(app)
      .get("/api/v1/users/me")
      .set("Cookie", cookies);

    expect(res.status).toBe(200);
    expect(res.body.data.email).toBe(user.email);
    expect(res.body.data.password).toBeUndefined();
  });

  it("rejects fetching the profile without authentication", async () => {
    const res = await request(app).get("/api/v1/users/me");
    expect(res.status).toBe(401);
  });

  it("updates the full name and username on the account", async () => {
    const { cookies } = await registerAndLogin();

    const res = await request(app)
      .patch("/api/v1/users/me")
      .set("Cookie", cookies)
      .send({ fullName: "Updated Name", username: "updatedhandle" });

    expect(res.status).toBe(200);
    expect(res.body.data.fullName).toBe("Updated Name");
    expect(res.body.data.username).toBe("updatedhandle");
  });

  it("rejects updating to a username that is already taken", async () => {
    await registerAndLogin({
      username: "takenname",
      email: "takenname@example.com",
    });
    const { cookies } = await registerAndLogin({
      username: "freeuser",
      email: "freeuser@example.com",
    });

    const res = await request(app)
      .patch("/api/v1/users/me")
      .set("Cookie", cookies)
      .send({ username: "takenname" });

    expect(res.status).toBe(409);
  });

  it("changes the account password and invalidates existing sessions", async () => {
    const { user, cookies } = await registerAndLogin();

    const changeRes = await request(app)
      .patch("/api/v1/users/me/password")
      .set("Cookie", cookies)
      .send({
        currentPassword: user.password,
        newPassword: "NewPassw0rd!",
        confirmPassword: "NewPassw0rd!",
      });

    expect(changeRes.status).toBe(200);

    const oldLoginRes = await request(app)
      .post("/api/v1/auth/login")
      .send({ identifier: user.email, password: user.password });
    expect(oldLoginRes.status).toBe(401);

    const newLoginRes = await request(app)
      .post("/api/v1/auth/login")
      .send({ identifier: user.email, password: "NewPassw0rd!" });
    expect(newLoginRes.status).toBe(200);
  });

  it("rejects a password change with an incorrect current password", async () => {
    const { cookies } = await registerAndLogin();

    const res = await request(app)
      .patch("/api/v1/users/me/password")
      .set("Cookie", cookies)
      .send({
        currentPassword: "WrongPassword!",
        newPassword: "NewPassw0rd!",
        confirmPassword: "NewPassw0rd!",
      });

    expect(res.status).toBe(400);
  });

  it("rejects a password change when confirmation does not match", async () => {
    const { user, cookies } = await registerAndLogin();

    const res = await request(app)
      .patch("/api/v1/users/me/password")
      .set("Cookie", cookies)
      .send({
        currentPassword: user.password,
        newPassword: "NewPassw0rd!",
        confirmPassword: "Mismatch1!",
      });

    expect(res.status).toBe(400);
  });

  it("looks up a public profile by username", async () => {
    const { user } = await registerAndLogin();

    const res = await request(app).get(`/api/v1/users/${user.username}`);

    expect(res.status).toBe(200);
    expect(res.body.data.user.username).toBe(user.username);
    expect(res.body.data.isSubscribed).toBe(false);
  });

  it("returns 404 for a username that does not exist", async () => {
    const res = await request(app).get("/api/v1/users/no-such-user");
    expect(res.status).toBe(404);
  });

  it("deletes the current account after confirming the password", async () => {
    const { user, cookies } = await registerAndLogin();

    const res = await request(app)
      .delete("/api/v1/users/me")
      .set("Cookie", cookies)
      .send({ password: user.password });

    expect(res.status).toBe(200);

    const stillThere = await User.findOne({ email: user.email });
    expect(stillThere).toBeNull();
  });

  it("rejects account deletion with the wrong password", async () => {
    const { cookies } = await registerAndLogin();

    const res = await request(app)
      .delete("/api/v1/users/me")
      .set("Cookie", cookies)
      .send({ password: "WrongPassword!" });

    expect(res.status).toBe(400);
  });

  it("denies non-admin users access to the user listing endpoint", async () => {
    const { cookies } = await registerAndLogin();

    const res = await request(app).get("/api/v1/users").set("Cookie", cookies);
    expect(res.status).toBe(403);
  });

  it("allows an admin user to list and search users", async () => {
    const { cookies, userId } = await registerAndLogin({
      username: "adminuser",
      email: "adminuser@example.com",
    });
    await User.findByIdAndUpdate(userId, { role: "admin" });
    await registerAndLogin({
      username: "searchable",
      email: "searchable@example.com",
    });

    const res = await request(app)
      .get("/api/v1/users?q=searchable")
      .set("Cookie", cookies);

    expect(res.status).toBe(200);
    expect(res.body.data.results.some((u) => u.username === "searchable")).toBe(
      true,
    );
  });
});
