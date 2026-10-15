import { Server } from "socket.io";
import env from "../config/environment.js";
import { verifyAccessToken } from "../config/jwt.js";
import logger from "../utils/logger.js";

let io;

export function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: env.CLIENT_URL,
      credentials: true,
    },
  });

  io.use((socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.cookie?.match(/accessToken=([^;]+)/)?.[1];

      if (token) {
        const decoded = verifyAccessToken(token);
        socket.userId = decoded.sub;
      }
      next();
    } catch {
      next();
    }
  });

  io.on("connection", (socket) => {
    logger.debug(
      `Socket connected: ${socket.id} (user: ${socket.userId ?? "anonymous"})`,
    );

    if (socket.userId) {
      socket.join(`user:${socket.userId}`);
    }

    socket.on("disconnect", () => {
      logger.debug(`Socket disconnected: ${socket.id}`);
    });
  });

  return io;
}

export function getIO() {
  if (!io) throw new Error("Socket.io not initialized yet");
  return io;
}

export default { initSocket, getIO };
