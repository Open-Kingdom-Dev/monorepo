import { PromiseExecutor, logger } from '@nx/devkit';
import { generateAllBackends } from './generate-backends';
import { SwaggerGenerateAllExecutorSchema } from './schema';

const runExecutor: PromiseExecutor<SwaggerGenerateAllExecutorSchema> = async (
  _options,
  context
) => {
  try {
    await generateAllBackends(context.root);
    return { success: true };
  } catch (error) {
    logger.error('Failed to generate OpenAPI documentation');
    if (error instanceof Error) {
      logger.error(error.message);
    }
    return { success: false };
  }
};

export default runExecutor;
