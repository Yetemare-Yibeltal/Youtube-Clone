// added imports
import userRoutes from "./routes/user.routes.js";
import uploadRoutes from "./routes/upload.routes.js";

// mounted after shorts routes
app.use(`${API_PREFIX}/shorts`, shortsRoutes);
app.use(`${API_PREFIX}/users`, userRoutes);
app.use(`${API_PREFIX}/uploads`, uploadRoutes);
// Additional routers (admin, analytics) are mounted here as each module is
// built. See routes/*.routes.js.
