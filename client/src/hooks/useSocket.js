import { useEffect, useRef } from "react";
import { io } from "socket.io-client";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import { selectCurrentUser } from "../features/auth/authSlice";
import {
  fetchUnreadCount,
  receiveRealtimeNotification,
} from "../features/notifications/notificationSlice";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || window.location.origin;

export default function useSocket() {
  const dispatch = useDispatch();
  const userId = useSelector((state) => selectCurrentUser(state)?._id);
  const socketRef = useRef(null);

  useEffect(() => {
    if (!userId) return undefined;

    dispatch(fetchUnreadCount());

    const socket = io(SOCKET_URL, {
      withCredentials: true,
      transports: ["websocket"],
    });
    socketRef.current = socket;

    socket.emit("join", userId);

    socket.on("notification:new", (notification) => {
      dispatch(receiveRealtimeNotification(notification));
      toast(notification.message, { icon: "🔔" });
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [userId, dispatch]);

  return socketRef;
}
