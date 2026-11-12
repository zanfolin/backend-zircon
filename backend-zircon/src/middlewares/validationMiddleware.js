import { z, ZodError } from 'zod';

export const validate = (schema) => {
  return (req, res, next) => {
    try {
      const validatedData = schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });

      // Replace req.body, req.query, req.params with validated data
      if (validatedData.body) req.body = validatedData.body;
      if (validatedData.query) req.query = validatedData.query;
      if (validatedData.params) req.params = validatedData.params;

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const formattedErrors = error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));

        return res.status(400).json({
          success: false,
          message: 'Dados de entrada inválidos',
          errors: formattedErrors,
        });
      }

      next(error);
    }
  };
};

export const validateBody = (schema) => validate(z.object({ body: schema }));
export const validateQuery = (schema) => validate(z.object({ query: schema }));
export const validateParams = (schema) => validate(z.object({ params: schema }));