import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  beforeEach,
  vi,
} from "vitest";
import request from "supertest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

process.env.NODE_ENV = "test";
process.env.JWT_ACCESS_SECRET = "test_access_secret_1234567890";
process.env.JWT_REFRESH_SECRET = "test_refresh_secret_1234567890";
process.env.VIDEO_PROCESSING_DELAY_MS = "50";

let uploadCounter = 0;

vi.mock("../config/cloudinary.js", () => ({
  uploadBufferToCloudinary: vi.fn(async (_buffer, options) => {
    uploadCounter += 1;
    const resourceType = options?.resource_type || "image";
    return {
      secure_url: `https://res.cloudinary.com/demo/${resourceType}/upload/fixture-${uploadCounter}.${
        resourceType === "video" ? "mp4" : "jpg"
      }`,
      public_id: `fixture-${resourceType}-${uploadCounter}`,
      duration: resourceType === "video" ? 42 : undefined,
    };
  }),
  destroyCloudinaryAsset: vi.fn(async () => null),
  default: {},
}));

let mongod;
let app;
let Video;
let Channel;
let User;

async function registerAndLogin(overrides = {}) {
  const user = {
    username: "videocreator1",
    email: "videocreator1@example.com",
    fullName: "Video Creator",
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

function uploadVideoRequest(cookies, overrides = {}) {
  const req = request(app)
    .post("/api/v1/videos")
    .field("title", overrides.title || "My first upload")
    .field("description", overrides.description || "A test video description")
    .field("category", overrides.category || "education")
    .field("visibility", overrides.visibility || "public")
    .attach("video", Buffer.from("fake-binary-video-content"), {
      filename: "clip.mp4",
      contentType: "video/mp4",
    })
    .attach("thumbnail", Buffer.from("fake-binary-image-content"), {
      filename: "cover.jpg",
      contentType: "image/jpeg",
    });
  return cookies ? req.set("Cookie", cookies) : req;
}

async function waitUntilPublished(videoId, timeoutMs = 2000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const video = await Video.findById(videoId);
    if (video && video.status !== "processing") return video;
    await new Promise((resolve) => setTimeout(resolve, 25));
  }
  throw new Error(`Video ${videoId} never left the processing state`);
}

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongod.getUri();

  await mongoose.connect(process.env.MONGODB_URI);
  ({ default: app } = await import("../app.js"));
  ({ default: Video } = await import("../models/Video.js"));
  ({ default: Channel } = await import("../models/Channel.js"));
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

describe("Video upload and processing", () => {
  it("rejects an upload when the user has no channel yet", async () => {
    const { cookies } = await registerAndLogin();

    const res = await uploadVideoRequest(cookies);
    expect(res.status).toBe(400);
  });

  it("uploads a video, starts it as processing, then publishes it asynchronously", async () => {
    const { cookies, userId } = await registerAndLogin();
    await Channel.create({
      owner: userId,
      name: "My Channel",
      handle: "mychannel",
    });

    const res = await uploadVideoRequest(cookies);

    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe("processing");
    expect(res.body.data.title).toBe("My first upload");
    expect(res.body.data.videoFile.url).toContain("cloudinary.com");

    const published = await waitUntilPublished(res.body.data._id);
    expect(published.status).toBe("published");
    expect(published.publishedAt).toBeTruthy();

    const channel = await Channel.findOne({ owner: userId });
    expect(channel.videosCount).toBe(1);
  });

  it("rejects an upload missing the video file", async () => {
    const { cookies, userId } = await registerAndLogin();
    await Channel.create({
      owner: userId,
      name: "My Channel",
      handle: "mychannel2",
    });

    const res = await request(app)
      .post("/api/v1/videos")
      .set("Cookie", cookies)
      .field("title", "No video file")
      .field("category", "education")
      .attach("thumbnail", Buffer.from("fake-binary-image-content"), {
        filename: "cover.jpg",
        contentType: "image/jpeg",
      });

    expect(res.status).toBe(400);
  });

  it("rejects an unauthenticated upload attempt", async () => {
    const res = await uploadVideoRequest(undefined);
    expect(res.status).toBe(401);
  });
});

describe("Video visibility and access control", () => {
  it("hides a still-processing video from non-owners", async () => {
    const owner = await registerAndLogin({
      username: "owneruser",
      email: "owneruser@example.com",
    });
    const channel = await Channel.create({
      owner: owner.userId,
      name: "Owner Channel",
      handle: "ownerchan",
    });
    const video = await Video.create({
      owner: owner.userId,
      channel: channel._id,
      title: "Still processing",
      videoFile: {
        url: "https://res.cloudinary.com/demo/video/upload/x.mp4",
        publicId: "x",
      },
      thumbnail: {
        url: "https://res.cloudinary.com/demo/image/upload/x.jpg",
        publicId: "x-thumb",
      },
      status: "processing",
    });

    const strangerRes = await request(app).get(`/api/v1/videos/${video._id}`);
    expect(strangerRes.status).toBe(404);

    const ownerRes = await request(app)
      .get(`/api/v1/videos/${video._id}`)
      .set("Cookie", owner.cookies);
    expect(ownerRes.status).toBe(200);
    expect(ownerRes.body.data.isOwner).toBe(true);
  });

  it("hides a private video from everyone except the owner", async () => {
    const owner = await registerAndLogin({
      username: "privateowner",
      email: "privateowner@example.com",
    });
    const channel = await Channel.create({
      owner: owner.userId,
      name: "Private Channel",
      handle: "privatechan",
    });
    const video = await Video.create({
      owner: owner.userId,
      channel: channel._id,
      title: "Private video",
      videoFile: {
        url: "https://res.cloudinary.com/demo/video/upload/y.mp4",
        publicId: "y",
      },
      thumbnail: {
        url: "https://res.cloudinary.com/demo/image/upload/y.jpg",
        publicId: "y-thumb",
      },
      status: "published",
      visibility: "private",
    });

    const strangerRes = await request(app).get(`/api/v1/videos/${video._id}`);
    expect(strangerRes.status).toBe(403);
  });

  it("excludes non-public and non-published videos from the public listing", async () => {
    const owner = await registerAndLogin({
      username: "listowner",
      email: "listowner@example.com",
    });
    const channel = await Channel.create({
      owner: owner.userId,
      name: "List Channel",
      handle: "listchan",
    });

    await Video.create({
      owner: owner.userId,
      channel: channel._id,
      title: "Public published video",
      videoFile: {
        url: "https://res.cloudinary.com/demo/video/upload/a.mp4",
        publicId: "a",
      },
      thumbnail: {
        url: "https://res.cloudinary.com/demo/image/upload/a.jpg",
        publicId: "a-thumb",
      },
      status: "published",
      visibility: "public",
    });
    await Video.create({
      owner: owner.userId,
      channel: channel._id,
      title: "Still processing video",
      videoFile: {
        url: "https://res.cloudinary.com/demo/video/upload/b.mp4",
        publicId: "b",
      },
      thumbnail: {
        url: "https://res.cloudinary.com/demo/image/upload/b.jpg",
        publicId: "b-thumb",
      },
      status: "processing",
      visibility: "public",
    });

    const res = await request(app).get("/api/v1/videos");
    expect(res.status).toBe(200);
    expect(res.body.data.results).toHaveLength(1);
    expect(res.body.data.results[0].title).toBe("Public published video");
  });
});

describe("Video ownership actions", () => {
  it("lets the owner update the video title and description", async () => {
    const owner = await registerAndLogin({
      username: "editowner",
      email: "editowner@example.com",
    });
    const channel = await Channel.create({
      owner: owner.userId,
      name: "Edit Channel",
      handle: "editchan",
    });
    const video = await Video.create({
      owner: owner.userId,
      channel: channel._id,
      title: "Original title",
      videoFile: {
        url: "https://res.cloudinary.com/demo/video/upload/c.mp4",
        publicId: "c",
      },
      thumbnail: {
        url: "https://res.cloudinary.com/demo/image/upload/c.jpg",
        publicId: "c-thumb",
      },
      status: "published",
    });

    const res = await request(app)
      .patch(`/api/v1/videos/${video._id}`)
      .set("Cookie", owner.cookies)
      .send({ title: "Updated title" });

    expect(res.status).toBe(200);
    expect(res.body.data.title).toBe("Updated title");
  });

  it("forbids a non-owner from updating the video", async () => {
    const owner = await registerAndLogin({
      username: "editowner2",
      email: "editowner2@example.com",
    });
    const channel = await Channel.create({
      owner: owner.userId,
      name: "Edit Channel 2",
      handle: "editchan2",
    });
    const video = await Video.create({
      owner: owner.userId,
      channel: channel._id,
      title: "Original title",
      videoFile: {
        url: "https://res.cloudinary.com/demo/video/upload/d.mp4",
        publicId: "d",
      },
      thumbnail: {
        url: "https://res.cloudinary.com/demo/image/upload/d.jpg",
        publicId: "d-thumb",
      },
      status: "published",
    });

    const stranger = await registerAndLogin({
      username: "strangeredit",
      email: "strangeredit@example.com",
    });

    const res = await request(app)
      .patch(`/api/v1/videos/${video._id}`)
      .set("Cookie", stranger.cookies)
      .send({ title: "Hijacked title" });

    expect(res.status).toBe(403);
  });

  it("lets the owner delete their own video", async () => {
    const owner = await registerAndLogin({
      username: "deleteowner",
      email: "deleteowner@example.com",
    });
    const channel = await Channel.create({
      owner: owner.userId,
      name: "Delete Channel",
      handle: "deletechan",
    });
    const video = await Video.create({
      owner: owner.userId,
      channel: channel._id,
      title: "To be deleted",
      videoFile: {
        url: "https://res.cloudinary.com/demo/video/upload/e.mp4",
        publicId: "e",
      },
      thumbnail: {
        url: "https://res.cloudinary.com/demo/image/upload/e.jpg",
        publicId: "e-thumb",
      },
      status: "published",
    });

    const res = await request(app)
      .delete(`/api/v1/videos/${video._id}`)
      .set("Cookie", owner.cookies);
    expect(res.status).toBe(200);

    const stillThere = await Video.findById(video._id);
    expect(stillThere).toBeNull();
  });

  it("records a view and increments the view counter once per session window", async () => {
    const owner = await registerAndLogin({
      username: "viewowner",
      email: "viewowner@example.com",
    });
    const channel = await Channel.create({
      owner: owner.userId,
      name: "View Channel",
      handle: "viewchan",
    });
    const video = await Video.create({
      owner: owner.userId,
      channel: channel._id,
      title: "Watch me",
      videoFile: {
        url: "https://res.cloudinary.com/demo/video/upload/f.mp4",
        publicId: "f",
      },
      thumbnail: {
        url: "https://res.cloudinary.com/demo/image/upload/f.jpg",
        publicId: "f-thumb",
      },
      status: "published",
    });

    await request(app).post(`/api/v1/videos/${video._id}/view`);
    await request(app).post(`/api/v1/videos/${video._id}/view`);

    const updated = await Video.findById(video._id);
    expect(updated.views).toBe(1);
  });
});
