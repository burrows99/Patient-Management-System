export class EnvironmentUtils {
  static getString(name: string, defaultValue?: string): string {
    const value = (import.meta as any).env?.[name] ?? (process as any).env?.[name] ?? defaultValue;
    if (value === undefined || value === null || value === '') {
      throw new Error(`Missing required environment variable: ${name}`);
    }
    return value as string;
  }
}



