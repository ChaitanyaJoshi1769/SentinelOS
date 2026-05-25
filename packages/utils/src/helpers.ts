/**
 * Helper Utilities
 * Common utility functions for data manipulation
 */

/**
 * Group array items by a key
 */
export function groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
  return array.reduce(
    (result, item) => {
      const groupKey = String(item[key]);
      if (!result[groupKey]) {
        result[groupKey] = [];
      }
      result[groupKey].push(item);
      return result;
    },
    {} as Record<string, T[]>
  );
}

/**
 * Count occurrences of each item in an array
 */
export function countBy<T>(array: T[], key: keyof T): Record<string, number> {
  return array.reduce(
    (result, item) => {
      const countKey = String(item[key]);
      result[countKey] = (result[countKey] || 0) + 1;
      return result;
    },
    {} as Record<string, number>
  );
}

/**
 * Get unique values from array
 */
export function unique<T>(array: T[], key?: keyof T): T[] {
  if (!key) {
    return Array.from(new Set(array));
  }

  const seen = new Set<any>();
  return array.filter((item) => {
    const value = item[key];
    if (seen.has(value)) {
      return false;
    }
    seen.add(value);
    return true;
  });
}

/**
 * Find differences between two arrays
 */
export function difference<T>(array1: T[], array2: T[]): T[] {
  return array1.filter((item) => !array2.includes(item));
}

/**
 * Find intersection of two arrays
 */
export function intersection<T>(array1: T[], array2: T[]): T[] {
  return array1.filter((item) => array2.includes(item));
}

/**
 * Flatten nested array
 */
export function flatten<T>(array: (T | T[])[]): T[] {
  return array.reduce<T[]>((acc, item) => {
    if (Array.isArray(item)) {
      return acc.concat(flatten(item));
    }
    return acc.concat(item);
  }, []);
}

/**
 * Chunk array into smaller arrays
 */
export function chunk<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

/**
 * Deep merge objects
 */
export function deepMerge<T extends object>(target: T, source: Partial<T>): T {
  const result = { ...target };

  for (const key in source) {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      const sourceValue = source[key];
      const targetValue = result[key];

      if (
        sourceValue &&
        typeof sourceValue === 'object' &&
        !Array.isArray(sourceValue) &&
        targetValue &&
        typeof targetValue === 'object' &&
        !Array.isArray(targetValue)
      ) {
        result[key] = deepMerge(
          targetValue as object,
          sourceValue as object
        ) as any;
      } else {
        result[key] = sourceValue as any;
      }
    }
  }

  return result;
}

/**
 * Omit keys from object
 */
export function omit<T extends object, K extends keyof T>(
  object: T,
  keys: K[]
): Omit<T, K> {
  const result = { ...object };
  keys.forEach((key) => {
    delete result[key];
  });
  return result as Omit<T, K>;
}

/**
 * Pick keys from object
 */
export function pick<T extends object, K extends keyof T>(
  object: T,
  keys: K[]
): Pick<T, K> {
  const result = {} as Pick<T, K>;
  keys.forEach((key) => {
    result[key] = object[key];
  });
  return result;
}

/**
 * Wait for specified milliseconds
 */
export async function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retry function with exponential backoff
 */
export async function retry<T>(
  fn: () => Promise<T>,
  maxAttempts = 3,
  baseDelay = 1000
): Promise<T> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxAttempts - 1) {
        throw error;
      }
      const delay_ms = baseDelay * Math.pow(2, attempt);
      await delay(delay_ms);
    }
  }
  throw new Error('Retry failed');
}
