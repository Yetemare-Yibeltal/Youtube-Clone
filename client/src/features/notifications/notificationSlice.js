import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  getUnreadNotificationCount,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "../../api/notification.api";

export const fetchNotifications = createAsyncThunk(
  "notifications/fetchAll",
  async (params) => listNotifications(params),
);

export const fetchUnreadCount = createAsyncThunk(
  "notifications/fetchUnreadCount",
  async () => getUnreadNotificationCount(),
);

export const markAsRead = createAsyncThunk(
  "notifications/markAsRead",
  async (notificationId) => {
    await markNotificationRead(notificationId);
    return notificationId;
  },
);

export const markAllAsRead = createAsyncThunk(
  "notifications/markAllAsRead",
  async () => {
    await markAllNotificationsRead();
  },
);

const initialState = {
  items: [],
  pagination: null,
  unreadCount: 0,
  status: "idle",
};

const notificationSlice = createSlice({
  name: "notifications",
  initialState,
  reducers: {
    receiveRealtimeNotification(state, action) {
      state.items.unshift(action.payload);
      state.unreadCount += 1;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotifications.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.items = action.payload.results;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchUnreadCount.fulfilled, (state, action) => {
        state.unreadCount = action.payload.count;
      })
      .addCase(markAsRead.fulfilled, (state, action) => {
        const notification = state.items.find(
          (item) => item._id === action.payload,
        );
        if (notification && !notification.isRead) {
          notification.isRead = true;
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
      })
      .addCase(markAllAsRead.fulfilled, (state) => {
        state.items = state.items.map((item) => ({ ...item, isRead: true }));
        state.unreadCount = 0;
      });
  },
});

export const { receiveRealtimeNotification } = notificationSlice.actions;
export const selectNotifications = (state) => state.notifications.items;
export const selectUnreadCount = (state) => state.notifications.unreadCount;
export default notificationSlice.reducer;
