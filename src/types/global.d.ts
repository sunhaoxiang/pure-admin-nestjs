declare type RecordAny = Record<string, any>;
declare type RecordNever = Record<never, never>;
declare type RecordAnyOrNever = RecordAny | RecordNever;

/**
 * Base type
 */
declare type BaseType = boolean | number | string | undefined | null;

/**
 * Environment variable type conversion function interface
 */
declare type ParseType<T extends BaseType = string> = (value: string) => T;

/**
 * Type of class after it is converted to a plain object
 */
declare type ClassToPlain<T> = { [key in keyof T]: T[key] };

/**
 * Type of class
 */
declare type ClassType<T> = { new (...args: any[]): T };

/**
 * Nested objects are all optional
 */
declare type RePartial<T> = {
  [P in keyof T]?: T[P] extends (infer U)[] | undefined
    ? RePartial<U>[]
    : T[P] extends object | undefined
    ? T[P] extends ((...args: any[]) => any) | ClassType<T[P]> | undefined
      ? T[P]
      : RePartial<T[P]>
    : T[P];
};

/**
 * Nest object are all required
 */
declare type ReRequired<T> = {
  [P in keyof T]-?: T[P] extends (infer U)[] | undefined
    ? ReRequired<U>[]
    : T[P] extends object | undefined
    ? T[P] extends ((...args: any[]) => any) | ClassType<T[P]> | undefined
      ? T[P]
      : ReRequired<T[P]>
    : T[P];
};

/**
 * Prevent circular dependency errors under SWC
 */
declare type WrapperType<T> = T; // WrapperType === Relation
