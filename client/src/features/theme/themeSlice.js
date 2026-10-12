import { createSlice } from "@reduxjs/toolkit";

function readStoredTheme() {
  try {
    const stored = window.localStorage.getItem("theme");
    if (stored === "light" || stored === "dark") return stored;
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  } catch {
    return "light";
  }
}

const initialState = {
  mode: readStoredTheme(),
};

const themeSlice = createSlice({
  name: "theme",
  initialState,
  reducers: {
    toggleTheme(state) {
      state.mode = state.mode === "dark" ? "light" : "dark";
      try {
        window.localStorage.setItem("theme", state.mode);
      } catch {}
    },
    setTheme(state, action) {
      state.mode = action.payload;
      try {
        window.localStorage.setItem("theme", action.payload);
      } catch {}
    },
  },
});

export const { toggleTheme, setTheme } = themeSlice.actions;
export const selectThemeMode = (state) => state.theme.mode;
export default themeSlice.reducer;
