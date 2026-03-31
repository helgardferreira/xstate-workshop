/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Utility type to represent the types that are native to the browser.
 */
type BrowserNativeObject = Date | File | FileList;

/**
 * Utility type that represents all possible types that can be used as
 * buffer-like data.
 *
 * This is particularly useful when working with
 * {@link https://developer.mozilla.org/en-US/docs/Web/API/WebSocket WebSocket}
 * data transmissions.
 */
type BufferLike =
  | string
  | Buffer
  | DataView
  | number
  | ArrayBufferView
  | Uint8Array
  | ArrayBuffer
  | SharedArrayBuffer
  | Blob
  | readonly number[]
  | { valueOf(): ArrayBuffer }
  | { valueOf(): SharedArrayBuffer }
  | { valueOf(): Uint8Array }
  | { valueOf(): readonly number[] }
  | { valueOf(): string }
  | { [Symbol.toPrimitive](hint: string): string };

/**
 * Utility type to force all descendants of `T` to be required.
 */
type DeepRequired<T> = T extends BrowserNativeObject | Blob
  ? T
  : {
      [K in keyof T]-?: NonNullable<DeepRequired<T[K]>>;
    };

/**
 * Force expand (simplification / normalization) of conditional and mapped types.
 * More info {@link https://github.com/microsoft/TypeScript/issues/47980 TypeScript/issues/47980}
 */
type Expand<T> = T extends unknown ? { [K in keyof T]: T[K] } : never;

/**
 * Utility type that either returns the provided type or, if the type is an array,
 * returns the type of the array's elements.
 */
type GetSingle<T> = T extends Array<infer U> ? U : T;

/**
 * Utility type that extracts a `Record` type from a given, potentially loose,
 * string literal union type `T`.
 *
 * A "loose" string literal union type is one that includes the `string & {}`
 * (`non-nullish string`) type.
 *
 * This type utilizes "Key Remapping" to filter out the `string & {}` type.
 *
 * See {@link GetStrictUnion}.
 *
 * @template T The loose union of string literals.
 * @returns A "strict" record type where each key is a value from the string literal type `T`.
 * @example
 * type Foods = 'apple' | 'banana' | 'cookie' | string & {};
 * type FoodRecord = ExtractStrictUnionRecord<Foods>;
 * // FoodRecord is equivalent to:
 * // {
 * //   apple: 'apple',
 * //   banana: 'banana',
 * //   cookie: 'cookie'
 * // }
 */
type ExtractStrictUnionRecord<T extends string> = {
  [K in T as IsEqual<K, string & {}> extends true ? never : K]: K;
};

/**
 * Represents a type that extracts the strict union of string literals from a given type `T`.
 *
 * This is particularly useful when dealing with unions between string literals and the
 * `string & {}` ("non-nullish string") type.
 *
 * @template T The loose union of string literals.
 * @returns The strict union of string literals from the given type `T`.
 * @example
 * ```
 * type LooseUnion = 'apple' | 'banana' | 'cookie | string & {};
 * type StrictUnion = GetStrictUnion<LooseUnion>; // 'apple' | 'banana' | 'cookie'
 * ```
 */
type GetStrictUnion<T extends string> =
  keyof ExtractStrictUnionRecord<T> extends never
    ? string
    : keyof ExtractStrictUnionRecord<T>;

/**
 * Checks if two types are equal.
 *
 * This makes use of the assignability rule for conditional types. See
 * [here](https://github.com/microsoft/TypeScript/issues/27024#issuecomment-421529650).
 *
 * @template T1 The first type.
 * @template T2 The second type.
 * @returns `true` if the types are equal, `false` otherwise.
 */
type IsEqual<T1, T2> = T1 extends T2
  ? (<G>() => G extends T1 ? 1 : 2) extends <G>() => G extends T2 ? 1 : 2
    ? true
    : false
  : false;

/**
 * Utility type to query whether an array type `T` is a tuple type.
 *
 * @template T The type to query.
 * @returns `true` if the type is a tuple, `false` otherwise.
 * @example
 * ```
 * IsTuple<[number]> = true
 * IsTuple<number[]> = false
 * ```
 */
type IsTuple<T extends ReadonlyArray<any>> = number extends T['length']
  ? false
  : true;

/**
 * Represents all possible valid JSON value data types.
 */
type JSONValue =
  | null
  | string
  | number
  | boolean
  | JSONValue[]
  | { [key: string]: JSONValue };

/**
 * Utility type to easily remap the keys of the provided type with the provided
 * prefix.
 */
type MapPrefixKey<
  TType,
  TPrefix extends string,
  TKey extends keyof TType = keyof TType,
> = {
  [Property in TKey as `${TPrefix}${Capitalize<Exclude<TKey, symbol | number>>}`]: TType[Property];
};

/**
 * Represents a type that is either a key of `T` or a string literal type.
 * This type is used to provide loose autocomplete suggestions for keys of an object.
 *
 * @template T The type to query.
 */
type NullishKey<T> = Extract<keyof T, string> | (string & {});

/**
 * Represents a primitive value in TypeScript.
 */
type Primitive = null | undefined | string | number | boolean | symbol | bigint;

/**
 * Type which given a tuple type returns its own keys, i.e. only its indices.
 *
 * @template T The tuple type to query.
 * @example
 * ```
 * TupleKeys<[number, string]> = '0' | '1'
 * ```
 */
type TupleKeys<T extends ReadonlyArray<any>> = Exclude<keyof T, keyof any[]>;

type UnionToIntersection<T> = (T extends any ? (x: T) => void : never) extends (
  x: infer U
) => void
  ? U
  : never;

/**
 * Get the difference of `T` from `U` (`T` \ `U`), or in other words,
 * subtract `U` from `T`.
 */
type Difference<T extends object, U extends object> = {
  [K in Exclude<keyof T, keyof U>]: T[K];
};

/**
 * Negate the keys of `T`.
 */
type Negate<T> = {
  [P in keyof T]?: never;
};

type WidenPrimitive<T> = T extends string
  ? string
  : T extends number
    ? number
    : T extends boolean
      ? boolean
      : T extends bigint
        ? bigint
        : T extends symbol
          ? symbol
          : T;

/**
 * Get the "exclusive or" of `T` and `U`.
 */
type XOR<T, U> = T extends object
  ? U extends object
    ? (Negate<Difference<T, U>> & U) | (Negate<Difference<U, T>> & T)
    : never
  : U extends object
    ? never
    : T | U;

export type {
  BrowserNativeObject,
  BufferLike,
  DeepRequired,
  Expand,
  GetSingle,
  GetStrictUnion,
  IsEqual,
  IsTuple,
  JSONValue,
  MapPrefixKey,
  NullishKey,
  Primitive,
  TupleKeys,
  UnionToIntersection,
  WidenPrimitive,
  XOR,
};
