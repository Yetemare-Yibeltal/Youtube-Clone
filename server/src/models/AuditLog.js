import { pool } from "../config/database.js";
import { logger } from "../utils/logger.js";

// Never throws: a failed audit write must not break the user's request.
export const record = async (
  {
    actorId = null,
    action,
    entityType = null,
    entityId = null,
    metadata = {},
    ip = null,
    userAgent = null,
  },
  client,
) => {
  try {
    await (client ?? pool).query(
      `INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, metadata, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        actorId,
        action,
        entityType,
        entityId ? String(entityId) : null,
        JSON.stringify(metadata),
        ip,
        userAgent,
      ],
    );
  } catch (error) {
    logger.error(`Failed to write audit log "${action}"`, error);
  }
};
