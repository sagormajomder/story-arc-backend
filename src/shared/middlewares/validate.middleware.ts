import logger from '@src/shared/utils/logger.js';
import type { NextFunction, Request, Response } from 'express';
import type { ZodObject } from 'zod';

function validate(schema: ZodObject) {
  return async function (req: Request, _res: Response, next: NextFunction) {
    const result = await schema.safeParseAsync({
      body: req.body,
      query: req.query,
      params: req.params,
    });

    if (!result.success) {
      const errors = result.error.issues
        .map(iss => `  •  ${iss.path.join('.')}: ${iss.message}`)
        .join('\n');

      logger.error(`❌ Data validation failed: \n${errors}\n`);
      return next(result.error);
    }

    const parsedData = result.data;

    ['body', 'query', 'params'].forEach(key => {
      if (key in parsedData) {
        Object.defineProperty(req, key, {
          value: parsedData[key],
          writable: true,
          configurable: true,
          enumerable: true,
        });
      }
    });

    return next();
  };
}
export default validate;
