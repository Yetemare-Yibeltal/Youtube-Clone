import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import request from "supertest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

process.env.NODE_ENV = "test";
process.env.JWT_ACCESS_SECRET = "test_access_secret_1234567890";
process.env.JWT_REFRESH_SECRET = "test_refresh_secret_1234567890";

let mongod;
let app;
let Video;
let Channel;

async function registerAndLogin(overrides = {}) {
  const user = {
    username: "commenter1",
    email: "commenter1@example.com",
    fullName: "Commenter One",
    password: "Passw0rd!",
    ...overrides,
  };

  await request(app).post("/api/v1/auth/register").send(user);
  const loginRes = await request(app)
    .post("/api/v1/auth/login")
    .send({ identifier: user.email, password: user.password });

  return { user, cookies: loginRes.headers["set-cookie"] };
}

async function createVideoFixture(ownerId, channelId) {
  const video = await Video.create({
    owner: ownerId,
    channel: channelId,
    title: "Sample video for comments",
    description: "A video used to exercise the comment endpoints",
    videoFile: {
      url: "https://res.cloudinary.com/demo/video/upload/sample.mp4",
      publicId: "sample-video",
    },
    thumbnail: {
      url: "https://res.cloudinary.com/demo/image/upload/sample.jpg",
      publicId: "sample-thumb",
    },
    status: "published",
    visibility: "public",
  });
  return video;
}

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongod.getUri();

  await mongoose.connect(process.env.MONGODB_URI);
  ({ default: app } = await import("../app.js"));
  ({ default: Video } = await import("../models/Video.js"));
  ({ default: Channel } = await import("../models/Channel.js"));
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

describe("Comment flow", () => {
  it("adds a top-level comment to a video", async () => {
    const { user, cookies } = await registerAndLogin();
    const meRes = await request(app)
      .get("/api/v1/auth/me")
      .set("Cookie", cookies);
    const channel = await Channel.create({
      owner: meRes.body.data._id,
      name: "Commenter Channel",
      handle: "commenterchannel",
    });
    const video = await createVideoFixture(meRes.body.data._id, channel._id);

    const res = await request(app)
      .post(`/api/v1/comments/video/${video._id}`)
      .set("Cookie", cookies)
      .send({ content: "Great video!" });

    expect(res.status).toBe(201);
    expect(res.body.data.content).toBe("Great video!");
    expect(res.body.data.video).toBe(video._id.toString());
    expect(user.email).toBeTruthy();
  });

  it("rejects an empty comment body", async () => {
    const { cookies } = await registerAndLogin();
    const meRes = await request(app)
      .get("/api/v1/auth/me")
      .set("Cookie", cookies);
    const channel = await Channel.create({
      owner: meRes.body.data._id,
      name: "Commenter Channel",
      handle: "commenterchannel2",
    });
    const video = await createVideoFixture(meRes.body.data._id, channel._id);

    const res = await request(app)
      .post(`/api/v1/comments/video/${video._id}`)
      .set("Cookie", cookies)
      .send({ content: "" });

    expect(res.status).toBe(400);
  });

  it("lists comments for a video with pagination metadata", async () => {
    const { cookies } = await registerAndLogin();
    const meRes = await request(app)
      .get("/api/v1/auth/me")
      .set("Cookie", cookies);
    const channel = await Channel.create({
      owner: meRes.body.data._id,
      name: "Commenter Channel",
      handle: "commenterchannel3",
    });
    const video = await createVideoFixture(meRes.body.data._id, channel._id);

    await request(app)
      .post(`/api/v1/comments/video/${video._id}`)
      .set("Cookie", cookies)
      .send({ content: "First" });
    await request(app)
      .post(`/api/v1/comments/video/${video._id}`)
      .set("Cookie", cookies)
      .send({ content: "Second" });

    const res = await request(app).get(`/api/v1/comments/video/${video._id}`);

    expect(res.status).toBe(200);
    expect(res.body.data.results).toHaveLength(2);
    expect(res.body.data.pagination.total).toBe(2);
  });

  it("replies to an existing comment and increments its reply count", async () => {
    const { cookies } = await registerAndLogin();
    const meRes = await request(app)
      .get("/api/v1/auth/me")
      .set("Cookie", cookies);
    const channel = await Channel.create({
      owner: meRes.body.data._id,
      name: "Commenter Channel",
      handle: "commenterchannel4",
    });
    const video = await createVideoFixture(meRes.body.data._id, channel._id);

    const parentRes = await request(app)
      .post(`/api/v1/comments/video/${video._id}`)
      .set("Cookie", cookies)
      .send({ content: "Parent comment" });

    const replyRes = await request(app)
      .post(`/api/v1/comments/video/${video._id}`)
      .set("Cookie", cookies)
      .send({
        content: "Reply comment",
        parentComment: parentRes.body.data._id,
      });

    expect(replyRes.status).toBe(201);
    expect(replyRes.body.data.parentComment).toBe(parentRes.body.data._id);

    const repliesRes = await request(app).get(
      `/api/v1/comments/${parentRes.body.data._id}/replies`,
    );
    expect(repliesRes.status).toBe(200);
    expect(repliesRes.body.data.results).toHaveLength(1);
  });

  it("lets the comment owner edit their comment", async () => {
    const { cookies } = await registerAndLogin();
    const meRes = await request(app)
      .get("/api/v1/auth/me")
      .set("Cookie", cookies);
    const channel = await Channel.create({
      owner: meRes.body.data._id,
      name: "Commenter Channel",
      handle: "commenterchannel5",
    });
    const video = await createVideoFixture(meRes.body.data._id, channel._id);

    const createRes = await request(app)
      .post(`/api/v1/comments/video/${video._id}`)
      .set("Cookie", cookies)
      .send({ content: "Original text" });

    const updateRes = await request(app)
      .patch(`/api/v1/comments/${createRes.body.data._id}`)
      .set("Cookie", cookies)
      .send({ content: "Edited text" });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.data.content).toBe("Edited text");
    expect(updateRes.body.data.isEdited).toBe(true);
  });

  it("prevents a non-owner from deleting someone else's comment", async () => {
    const owner = await registerAndLogin({
      username: "owner1",
      email: "owner1@example.com",
    });
    const meRes = await request(app)
      .get("/api/v1/auth/me")
      .set("Cookie", owner.cookies);
    const channel = await Channel.create({
      owner: meRes.body.data._id,
      name: "Owner Channel",
      handle: "ownerchannel",
    });
    const video = await createVideoFixture(meRes.body.data._id, channel._id);

    const createRes = await request(app)
      .post(`/api/v1/comments/video/${video._id}`)
      .set("Cookie", owner.cookies)
      .send({ content: "Owner comment" });

    const stranger = await registerAndLogin({
      username: "stranger1",
      email: "stranger1@example.com",
    });

    const deleteRes = await request(app)
      .delete(`/api/v1/comments/${createRes.body.data._id}`)
      .set("Cookie", stranger.cookies);

    expect(deleteRes.status).toBe(403);
  });

  it("allows the comment owner to delete their own comment", async () => {
    const { cookies } = await registerAndLogin();
    const meRes = await request(app)
      .get("/api/v1/auth/me")
      .set("Cookie", cookies);
    const channel = await Channel.create({
      owner: meRes.body.data._id,
      name: "Commenter Channel",
      handle: "commenterchannel6",
    });
    const video = await createVideoFixture(meRes.body.data._id, channel._id);

    const createRes = await request(app)
      .post(`/api/v1/comments/video/${video._id}`)
      .set("Cookie", cookies)
      .send({ content: "To be deleted" });

    const deleteRes = await request(app)
      .delete(`/api/v1/comments/${createRes.body.data._id}`)
      .set("Cookie", cookies);

    expect(deleteRes.status).toBe(200);

    const listRes = await request(app).get(
      `/api/v1/comments/video/${video._id}`,
    );
    expect(listRes.body.data.results).toHaveLength(0);
  });

  it("rejects unauthenticated comment creation", async () => {
    const owner = await registerAndLogin({
      username: "owner2",
      email: "owner2@example.com",
    });
    const meRes = await request(app)
      .get("/api/v1/auth/me")
      .set("Cookie", owner.cookies);
    const channel = await Channel.create({
      owner: meRes.body.data._id,
      name: "Owner Channel 2",
      handle: "ownerchannel2",
    });
    const video = await createVideoFixture(meRes.body.data._id, channel._id);

    const res = await request(app)
      .post(`/api/v1/comments/video/${video._id}`)
      .send({ content: "Anon comment" });
    expect(res.status).toBe(401);
  });
});
