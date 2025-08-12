export class EnvironmentUtils {
  static getString(name: string, defaultValue?: string): string {
    const value = process.env[name] ?? defaultValue;
    if (value === undefined || value === null || value === '') {
      throw new Error(`Missing required environment variable: ${name}`);
    }
    return value;
  }

  static getNumber(name: string, defaultValue?: number): number {
    const raw = process.env[name];
    if (raw === undefined || raw === null || raw === '') {
      if (defaultValue === undefined) {
        throw new Error(`Missing required environment variable: ${name}`);
      }
      return defaultValue;
    }
    const num = Number(raw);
    if (Number.isNaN(num)) {
      throw new Error(`Environment variable ${name} must be a number`);
    }
    return num;
  }

  static getBoolean(name: string, defaultValue?: boolean): boolean {
    const raw = process.env[name];
    if (raw === undefined || raw === null || raw === '') {
      if (defaultValue === undefined) {
        throw new Error(`Missing required environment variable: ${name}`);
      }
      return defaultValue;
    }
    return ['1', 'true', 'yes', 'on'].includes(raw.toLowerCase());
  }
}



