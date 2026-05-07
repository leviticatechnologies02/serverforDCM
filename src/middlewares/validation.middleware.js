import ApiError from '../utils/ApiError.js';

export const validateSchema = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, { abortEarly: false, stripUnknown: true });
  if (error) {
    return next(new ApiError(400, 'Validation error', true, error.details.map(d => d.message)));
  }
  req.body = value;
  next();
};

export default validateSchema;
