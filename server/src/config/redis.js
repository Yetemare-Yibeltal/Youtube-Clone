import Redis from "ioredis";
import env from "./environment.js";
import logger from "../utils/logger.js";

let redisClient;

function createRedisClient() {
  const client = new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: 2,
    lazyConnect: false,
    retryStrategy(times) {
      if (times > 10) return null;
      return Math.min(times * 200, 3000);
    },
  });

  client.on("connect", () => logger.info("Redis connected"));
  client.on("error", (err) => logger.error(`Redis error: ${err.message}`));

  return client;
}

export function getRedisClient() {
  if (!redisClient) {
    redisClient = createRedisClient();
  }
  return redisClient;
}

export default getRedisClient();
