import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  isSidebarOpen: true,
  isMobileSearchOpen: false,
  activeModal: null,
};

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    toggleSidebar(state) {
      state.isSidebarOpen = !state.isSidebarOpen;
    },
    setSidebarOpen(state, action) {
      state.isSidebarOpen = action.payload;
    },
    toggleMobileSearch(state) {
      state.isMobileSearchOpen = !state.isMobileSearchOpen;
    },
    openModal(state, action) {
      state.activeModal = action.payload;
    },
    closeModal(state) {
      state.activeModal = null;
    },
  },
});

export const {
  toggleSidebar,
  setSidebarOpen,
  toggleMobileSearch,
  openModal,
  closeModal,
} = uiSlice.actions;
export const selectIsSidebarOpen = (state) => state.ui.isSidebarOpen;
export const selectIsMobileSearchOpen = (state) => state.ui.isMobileSearchOpen;
export const selectActiveModal = (state) => state.ui.activeModal;
export default uiSlice.reducer;
