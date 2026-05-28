export const getGcsEmulatorUrl = (): string => {
  return import.meta.env.VITE_GCS_EMULATOR_URL || '';
};
