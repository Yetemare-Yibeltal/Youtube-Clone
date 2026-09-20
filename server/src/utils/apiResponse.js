export const sendSuccess = (res, data = null, { status = 200, meta } = {}) => {
  const body = { success: true, data };
  if (meta) body.meta = meta;
  return res.status(status).json(body);
};

export const sendCreated = (res, data = null) =>
  sendSuccess(res, data, { status: 201 });

export const sendNoContent = (res) => res.status(204).end();
