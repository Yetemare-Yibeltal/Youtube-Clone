import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  bootstrapSession,
  selectAuthInitialized,
  selectAuthStatus,
  selectCurrentUser,
  selectIsAuthenticated,
} from "../features/auth/authSlice";

export default function useAuth() {
  const dispatch = useDispatch();
  const user = useSelector(selectCurrentUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const status = useSelector(selectAuthStatus);
  const initialized = useSelector(selectAuthInitialized);

  useEffect(() => {
    if (!initialized) {
      dispatch(bootstrapSession());
    }
  }, [initialized, dispatch]);

  return { user, isAuthenticated, status, initialized };
}
