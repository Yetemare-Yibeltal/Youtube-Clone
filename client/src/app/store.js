import { configureStore } from "@reduxjs/toolkit";
import authReducer from "../features/auth/authSlice";
import uiReducer from "../features/ui/uiSlice";
import themeReducer from "../features/theme/themeSlice";
import notificationReducer from "../features/notifications/notificationSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    ui: uiReducer,
    theme: themeReducer,
    notifications: notificationReducer,
  },
});

export default store;
