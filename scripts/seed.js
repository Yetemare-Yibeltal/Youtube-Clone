import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import mongoose from "mongoose";
import env from "../src/config/environment.js";
import { connectDB } from "../src/config/database.js";
import { uploadBufferToCloudinary } from "../src/config/cloudinary.js";
import logger from "../src/utils/logger.js";
import User from "../src/models/User.js";
import Channel from "../src/models/Channel.js";
import Video from "../src/models/Video.js";
import Subscription from "../src/models/Subscription.js";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const IMAGES_DIR = path.resolve(currentDir, "../../client/src/assets/images");
const DEMO_VIDEO = path.resolve(
  currentDir,
  "../../client/public/demo/video.mp4",
);

const SEED_PASSWORD = "Passw0rd!";
const SEED_EMAIL_DOMAIN = "vidtube.dev";

const CREATORS = [
  {
    username: "jack",
    fullName: "Jack Miller",
    channelName: "Jack Explores",
    description:
      "Mountains, lakes and long weekends. Travel stories from places worth the hike.",
    avatar: "jack.png",
  },
  {
    username: "simon",
    fullName: "Simon Carter",
    channelName: "Simon Drives",
    description: "Supercars, road tests and the occasional track day.",
    avatar: "simon.png",
  },
  {
    username: "tom",
    fullName: "Tom Hughes",
    channelName: "Tom on Campus",
    description: "Campus tours, student life and study tips.",
    avatar: "tom.png",
  },
  {
    username: "megan",
    fullName: "Megan Doyle",
    channelName: "Megan by the Lake",
    description: "Slow mornings, quiet water and calm landscapes.",
    avatar: "megan.png",
  },
  {
    username: "cameron",
    fullName: "Cameron Reed",
    channelName: "Cameron Vlogs",
    description: "City life, shopping trips and everyday vlogs.",
    avatar: "cameron.png",
  },
  {
    username: "gerard",
    fullName: "Gerard Lane",
    channelName: "Gerard and Friends",
    description: "Out and about with friends, summer rides and street walks.",
    avatar: "gerard.png",
  },
];

const VIDEOS = [
  {
    creator: "jack",
    thumbnail: "thumbnail1.png",
    title: "Rowing across a turquoise alpine lake",
    description: "A quiet morning on the water, surrounded by the Dolomites.",
    category: "travel",
    tags: ["travel", "mountains", "lake"],
    views: 15200,
    daysAgo: 2,
  },
  {
    creator: "gerard",
    thumbnail: "thumbnail2.png",
    title: "Summer bike ride along the coast",
    description: "Flags, sunshine and an easy ride by the sea.",
    category: "entertainment",
    tags: ["summer", "cycling", "beach"],
    views: 8400,
    daysAgo: 5,
  },
  {
    creator: "cameron",
    thumbnail: "thumbnail3.png",
    title: "A day at the mall: shopping vlog",
    description: "Escalators, new arrivals and a few impulse buys.",
    category: "blogs",
    tags: ["vlog", "shopping", "lifestyle"],
    views: 5300,
    daysAgo: 7,
  },
  {
    creator: "megan",
    thumbnail: "thumbnail4.png",
    title: "Mountain lake sunrise in 4K",
    description: "Still water, soft light and a lone boat.",
    category: "travel",
    tags: ["sunrise", "nature", "relaxing"],
    views: 22100,
    daysAgo: 9,
  },
  {
    creator: "gerard",
    thumbnail: "thumbnail5.png",
    title: "Friends city walk and street food",
    description:
      "Wandering downtown with the crew and finding the best lunch spot.",
    category: "blogs",
    tags: ["friends", "city", "food"],
    views: 6700,
    daysAgo: 12,
  },
  {
    creator: "simon",
    thumbnail: "thumbnail6.png",
    title: "Orange Lamborghini Aventador up close",
    description:
      "Walkaround and a look at the details of this orange roadster.",
    category: "automobiles",
    tags: ["lamborghini", "supercar", "cars"],
    views: 48900,
    daysAgo: 15,
  },
  {
    creator: "tom",
    thumbnail: "thumbnail7.png",
    title: "Campus tour: a first-year student guide",
    description:
      "Where to find lecture halls, coffee and the quiet study spots.",
    category: "education",
    tags: ["campus", "university", "student"],
    views: 9800,
    daysAgo: 20,
  },
  {
    creator: "simon",
    thumbnail: "thumbnail8.png",
    title: "Yellow Lamborghini Huracan street drive",
    description: "A short city drive in a yellow Huracan.",
    category: "automobiles",
    tags: ["lamborghini", "drive", "cars"],
    views: 31500,
    daysAgo: 24,
  },
];

const SUBSCRIPTIONS = [
  ["jack", "simon"],
  ["jack", "megan"],
  ["tom", "jack"],
  ["tom", "simon"],
  ["megan", "jack"],
  ["cameron", "gerard"],
  ["cameron", "simon"],
  ["gerard", "cameron"],
  ["simon", "tom"],
];

async function uploadImage(fileName, folder) {
  const buffer = await fs.readFile(path.join(IMAGES_DIR, fileName));
  const result = await uploadBufferToCloudinary(buffer, {
    resource_type: "image",
    folder: `vidtube/${folder}`,
  });
  return { url: result.secure_url, publicId: result.public_id };
}

async function resetSeedData() {
  const seededUsers = await User.find({
    email: new RegExp(`@${SEED_EMAIL_DOMAIN}$`),
  }).select("_id");
  const userIds = seededUsers.map((user) => user._id);
  const channelIds = await Channel.find({ owner: { $in: userIds } }).distinct(
    "_id",
  );

  await Video.deleteMany({ owner: { $in: userIds } });
  await Subscription.deleteMany({
    $or: [{ subscriber: { $in: userIds } }, { channel: { $in: channelIds } }],
  });
  await Channel.deleteMany({ _id: { $in: channelIds } });
  await User.deleteMany({ _id: { $in: userIds } });

  logger.info(
    `Removed ${userIds.length} seeded users with their channels, videos and subscriptions`,
  );
  logger.info("Assets already uploaded to Cloudinary were not deleted");
}

async function ensureCreator(creator) {
  let user = await User.findOne({ username: creator.username });

  if (!user) {
    const avatar = await uploadImage(creator.avatar, "avatars");
    user = await User.create({
      username: creator.username,
      email: `${creator.username}@${SEED_EMAIL_DOMAIN}`,
      fullName: creator.fullName,
      password: SEED_PASSWORD,
      isEmailVerified: true,
      avatar,
    });
    logger.info(`Created user @${user.username}`);
  }

  let channel = await Channel.findOne({ owner: user._id });

  if (!channel) {
    channel = await Channel.create({
      owner: user._id,
      name: creator.channelName,
      handle: creator.username,
      description: creator.description,
      avatar: user.avatar,
    });
    logger.info(`Created channel ${channel.name}`);
  }

  return { user, channel };
}

async function ensureVideo(item, channel, videoBuffer) {
  const existing = await Video.findOne({
    channel: channel._id,
    title: item.title,
  });
  if (existing) return false;

  const [thumbnail, videoUpload] = await Promise.all([
    uploadImage(item.thumbnail, "thumbnails"),
    uploadBufferToCloudinary(videoBuffer, {
      resource_type: "video",
      folder: "vidtube/videos",
    }),
  ]);

  const publishedAt = new Date(Date.now() - item.daysAgo * 24 * 60 * 60 * 1000);

  await Video.create({
    owner: channel.owner,
    channel: channel._id,
    title: item.title,
    description: item.description,
    tags: item.tags,
    category: item.category,
    visibility: "public",
    status: "published",
    views: item.views,
    duration: Math.round(videoUpload.duration || 0),
    publishedAt,
    videoFile: { url: videoUpload.secure_url, publicId: videoUpload.public_id },
    thumbnail,
  });
  logger.info(`Created video "${item.title}"`);
  return true;
}

async function ensureSubscriptions(creators) {
  for (const [subscriberName, channelOwnerName] of SUBSCRIPTIONS) {
    const subscriber = creators.get(subscriberName);
    const target = creators.get(channelOwnerName);
    if (!subscriber || !target) continue;

    await Subscription.updateOne(
      { subscriber: subscriber.user._id, channel: target.channel._id },
      {
        $setOnInsert: {
          subscriber: subscriber.user._id,
          channel: target.channel._id,
        },
      },
      { upsert: true },
    );
  }
}

async function refreshChannelCounters(creators) {
  for (const { channel } of creators.values()) {
    const [videosCount, subscribersCount, viewTotals] = await Promise.all([
      Video.countDocuments({ channel: channel._id, status: "published" }),
      Subscription.countDocuments({ channel: channel._id }),
      Video.aggregate([
        { $match: { channel: channel._id } },
        { $group: { _id: null, totalViews: { $sum: "$views" } } },
      ]),
    ]);

    await Channel.updateOne(
      { _id: channel._id },
      {
        videosCount,
        subscribersCount,
        totalViews: viewTotals[0]?.totalViews || 0,
      },
    );
  }
}

async function main() {
  if (
    !env.CLOUDINARY_CLOUD_NAME ||
    !env.CLOUDINARY_API_KEY ||
    !env.CLOUDINARY_API_SECRET
  ) {
    throw new Error(
      "Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET in server/.env first",
    );
  }

  await connectDB();

  if (process.argv.includes("--reset")) {
    await resetSeedData();
  }

  const videoBuffer = await fs.readFile(DEMO_VIDEO);
  const creators = new Map();

  for (const creator of CREATORS) {
    creators.set(creator.username, await ensureCreator(creator));
  }

  let createdVideos = 0;
  for (const item of VIDEOS) {
    const created = await ensureVideo(
      item,
      creators.get(item.creator).channel,
      videoBuffer,
    );
    if (created) createdVideos += 1;
  }

  await ensureSubscriptions(creators);
  await refreshChannelCounters(creators);

  logger.info(
    `Seed finished: ${creators.size} creators, ${createdVideos} new videos`,
  );
  logger.info(
    `Sign in with any of the seeded emails, for example jack@${SEED_EMAIL_DOMAIN} / ${SEED_PASSWORD}`,
  );
}

main()
  .then(async () => {
    await mongoose.disconnect();
    process.exit(0);
  })
  .catch(async (error) => {
    logger.error(`Seed failed: ${error.message}`);
    await mongoose.disconnect();
    process.exit(1);
  });
