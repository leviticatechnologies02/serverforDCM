export const successResponse = (res, { message = 'Success', data = {}, status = 200 } = {}) => {
  return res.status(status).json({ success: true, message, data });
};

export const errorResponse = (res, { message = 'Error', errors = null, status = 500 } = {}) => {
  return res.status(status).json({ success: false, message, errors });
};
