export const generateUpdatePayload = (existing, incoming, fields) => {
  const payload = {};
  const changes = {};

  fields.forEach(field => {
    if (
      incoming[field] !== undefined &&
      incoming[field] !== existing[field] 
    ) {
      payload[field] = incoming[field];
      changes[field] = { from: existing[field], to: incoming[field] };
    }
  });

  return { payload, changes };
};