import { PromiseExecutor, logger } from '@nx/devkit';
import { execSync } from 'child_process';
import { join } from 'path';
import { SwaggerGenerateAllExecutorSchema } from './schema';

const runExecutor: PromiseExecutor<SwaggerGenerateAllExecutorSchema> = async (
  _options,
  context
) => {
  const scriptPath = join(__dirname, 'generate-backends.ts');
  const tsconfigPath = join(__dirname, 'tsconfig.json');

  try {
    execSync(
      `npx ts-node  --project "${tsconfigPath}" "${scriptPath}" "${context.root}"`,
      {
        cwd: context.root,
        stdio: 'inherit',
      }
    );
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
