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
 * Joins a tuple of strings into a single string literal type, with an
 * optional separator between each element. Analogous to
 * `Array.prototype.join` at the type level.
 *
 * @template T - The tuple of strings to join.
 * @template Separator - The string to insert between each element.
 *   Defaults to `''` (no separator).
 *
 * @example
 * type R1 = JoinStr<["foo", "bar", "baz"], "-">;
 * //   ^? "foo-bar-baz"
 *
 * type R2 = JoinStr<["a", "b", "c"]>;
 * //   ^? "abc"
 *
 * type R3 = JoinStr<["only"]>;
 * //   ^? "only"
 *
 * type R4 = JoinStr<[]>;
 * //   ^? ""
 */
type JoinStr<
  T extends readonly string[],
  Separator extends string = '',
> = T extends readonly [
  infer Head extends string,
  ...infer Tail extends string[],
]
  ? Tail['length'] extends 0
    ? Head
    : `${Head}${Separator}${JoinStr<Tail, Separator>}`
  : '';

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
 * Normalizes a string by replacing all occurrences of the specified delimiter
 * characters with single spaces. Leading and trailing delimiters are stripped,
 * and consecutive delimiters are collapsed.
 *
 * @template T - The input string to process.
 * @template Delimiter - A union of single-character strings to treat as delimiters.
 *
 * @example
 * type R1 = SeparateDelimiter<"foo--bar", "-">;
 * //   ^? "foo bar"
 *
 * type R2 = SeparateDelimiter<"--foo---bar--", "-" | "_">;
 * //   ^? "foo bar"
 */
type SeparateDelimiter<
  T extends string,
  Delimiter extends string,
> = T extends `${infer A}${infer B}${infer C}`
  ? A extends Delimiter
    ? SeparateDelimiter<`${B}${C}`, Delimiter>
    : B extends Delimiter
      ? C extends `${infer _C extends Delimiter}${infer _}` | ''
        ? SeparateDelimiter<`${A}${C}`, Delimiter>
        : `${A} ${SeparateDelimiter<`${C}`, Delimiter>}`
      : `${A}${SeparateDelimiter<`${B}${C}`, Delimiter>}`
  : T extends Delimiter
    ? ''
    : T;

/**
 * Inserts spaces at camelCase and PascalCase word boundaries within a string.
 * Handles acronym runs (consecutive uppercase letters) by keeping them grouped
 * as a single word, splitting only at the transition between an acronym and a
 * lowercase-led word.
 *
 * Uses a two-character lookahead to distinguish between mid-acronym positions
 * and actual word boundaries.
 *
 * @template T - The input string to process.
 *
 * @example
 * type R1 = SeparateWordLike<"fooBar">;
 * //   ^? "foo Bar"
 *
 * type R2 = SeparateWordLike<"parseXMLDoc">;
 * //   ^? "parse XML Doc"
 *
 * type R3 = SeparateWordLike<"HTMLInputElement">;
 * //   ^? "HTML Input Element"
 */
type SeparateWordLike<T extends string> =
  T extends `${infer A}${infer B}${infer C}${infer D}`
    ? [B, C] extends [Uppercase<B>, Uppercase<C>]
      ? A extends Uppercase<A>
        ? `${A}${SeparateWordLike<`${B}${C}${D}`>}`
        : `${A} ${SeparateWordLike<`${B}${C}${D}`>}`
      : B extends Uppercase<B>
        ? `${A} ${SeparateWordLike<`${B}${C}${D}`>}`
        : C extends Uppercase<C>
          ? `${A}${B} ${SeparateWordLike<`${C}${D}`>}`
          : `${A}${SeparateWordLike<`${B}${C}${D}`>}`
    : T extends `${infer A}${infer B}`
      ? B extends ''
        ? T
        : B extends Uppercase<B>
          ? A extends Uppercase<A>
            ? T
            : `${A} ${B}`
          : T
      : T;

/**
 * Splits a string into a tuple of substrings at each occurrence of the
 * given separator. Analogous to `String.prototype.split` at the type level.
 *
 * Note: consecutive separators produce empty string elements in the resulting
 * tuple. If the separator is a union type, the inference will distribute and
 * produce a union of tuples.
 *
 * @template T - The input string to split.
 * @template Separator - The substring to split on.
 *   Defaults to ''.
 *
 * @example
 * type R1 = SplitStr<"foo bar baz", " ">;
 * //   ^? ["foo", "bar", "baz"]
 *
 * type R2 = SplitStr<"a::b::c", "::">;
 * //   ^? ["a", "b", "c"]
 */
type SplitStr<
  T extends string,
  Separator extends string = '',
> = T extends `${infer A}${Separator}${infer C}`
  ? [A, ...SplitStr<C, Separator>]
  : [T];

/**
 * Removes all trailing occurrences of the search string from the end
 * of a string literal type.
 *
 * @template T - The input string to trim.
 * @template Search - The string to remove from the end. Defaults to `' '`.
 *   Can be a union to trim multiple characters, or a multi-character string
 *   to trim a specific suffix.
 *
 * @example
 * type R1 = TrimEnd<"foo   ">;
 * //   ^? "foo"
 *
 * type R2 = TrimEnd<"foo...", ".">;
 * //   ^? "foo"
 *
 * type R3 = TrimEnd<"foo \t\n", " " | "\t" | "\n">;
 * //   ^? "foo"
 */
type TrimEnd<
  T extends string,
  Search extends string = ' ',
> = T extends `${infer Head}${Search}` ? TrimEnd<Head, Search> : T;

/**
 * Removes all leading occurrences of the search string from the start
 * of a string literal type.
 *
 * @template T - The input string to trim.
 * @template Search - The string to remove from the start. Defaults to `' '`.
 *   Can be a union to trim multiple characters, or a multi-character string
 *   to trim a specific prefix.
 *
 * @example
 * type R1 = TrimStart<"   foo">;
 * //   ^? "foo"
 *
 * type R2 = TrimStart<"...foo", ".">;
 * //   ^? "foo"
 *
 * type R3 = TrimStart<"\n\t foo", " " | "\t" | "\n">;
 * //   ^? "foo"
 */
type TrimStart<
  T extends string,
  Search extends string = ' ',
> = T extends `${Search}${infer Tail}` ? TrimStart<Tail, Search> : T;

/**
 * Removes all leading and trailing occurrences of the search string
 * from both ends of a string literal type. Composes {@link TrimEnd}
 * and {@link TrimStart}.
 *
 * @template T - The input string to trim.
 * @template Search - The string to remove from both ends. Defaults to `' '`.
 *   Can be a union to trim multiple characters, or a multi-character string
 *   to trim a specific affix.
 *
 * @example
 * type R1 = Trim<"   foo   ">;
 * //   ^? "foo"
 *
 * type R2 = Trim<"--foo--", "-">;
 * //   ^? "foo"
 *
 * type R3 = Trim<" \t foo \n ", " " | "\t" | "\n">;
 * //   ^? "foo"
 */
type Trim<T extends string, Search extends string = ' '> = TrimStart<
  TrimEnd<T, Search>,
  Search
>;

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
 * Default set of single-character word delimiters used by {@link Words}.
 */
type CommonWordDelimiters = '-' | ' ' | '_' | '.' | '/';

/**
 * Splits a string into a tuple of words, handling camelCase, PascalCase,
 * acronyms, and common delimiters.
 *
 * Internally pipelines three transformations:
 * 1. {@link SeparateWordLike} — inserts spaces at camelCase/acronym boundaries.
 * 2. {@link SeparateDelimiter} — normalizes delimiters to single spaces.
 * 3. {@link SplitStr} — splits the resulting space-separated string into a tuple.
 *
 * @template T - The input string to split into words.
 * @template Delimiters - A union of single-character delimiters to recognize.
 *   Defaults to {@link CommonWordDelimiters} (`'-' | ' ' | '_' | '.' | '/'`).
 *
 * @example
 * type R1 = Words<"fooBar">;
 * //   ^? ["foo", "Bar"]
 *
 * type R2 = Words<"parseXMLDoc">;
 * //   ^? ["parse", "XML", "Doc"]
 *
 * type R3 = Words<"--foo_bar..HTMLInputElement--">;
 * //   ^? ["foo", "bar", "HTML", "Input", "Element"]
 */
type Words<
  T extends string,
  Delimiters extends string = CommonWordDelimiters,
> = SplitStr<SeparateDelimiter<SeparateWordLike<T>, Delimiters>, ' '>;

/**
 * Applies a case transformation to each word in a tuple of strings.
 *
 * @template T - A tuple of strings to transform.
 * @template Mode - The transformation to apply to each element:
 *   - `'capitalize'` — lowercases the word then capitalizes the first letter.
 *   - `'lowercase'` — lowercases the entire word.
 *   - `'uppercase'` — uppercases the entire word.
 *
 * @example
 * type R1 = WordsCaseMap<["foo", "BAR", "baz"], "capitalize">;
 * //   ^? ["Foo", "Bar", "Baz"]
 *
 * type R2 = WordsCaseMap<["Foo", "BAR"], "lowercase">;
 * //   ^? ["foo", "bar"]
 *
 * type R3 = WordsCaseMap<["foo", "bar"], "uppercase">;
 * //   ^? ["FOO", "BAR"]
 */
type WordsCaseMap<
  T extends readonly string[],
  Mode extends 'capitalize' | 'lowercase' | 'uppercase',
> = T extends readonly [
  infer Head extends string,
  ...infer Tail extends readonly string[],
]
  ? [
      Mode extends 'capitalize'
        ? Capitalize<Lowercase<Head>>
        : Mode extends 'lowercase'
          ? Lowercase<Head>
          : Uppercase<Head>,
      ...WordsCaseMap<Tail, Mode>,
    ]
  : [];

/**
 * Converts a string literal to camelCase. The first word is fully lowercased
 * and each subsequent word is capitalized with its remaining characters
 * lowercased. Handles camelCase, PascalCase, acronyms, and delimiter-separated
 * inputs.
 *
 * @template T - The input string to convert.
 *
 * @example
 * type R1 = CamelCase<"HTMLInputElement">;
 * //   ^? "htmlInputElement"
 *
 * type R2 = CamelCase<"__FOO_BAR__">;
 * //   ^? "fooBar"
 */
type CamelCase<T extends string> =
  Words<T> extends [
    infer Head extends string,
    ...infer Tail extends readonly string[],
  ]
    ? `${Lowercase<Head>}${JoinStr<WordsCaseMap<Tail, 'capitalize'>>}`
    : never;

/**
 * Converts a string literal to CONSTANT_CASE (also known as SCREAMING_SNAKE_CASE).
 * Each word is fully uppercased and joined with underscores.
 *
 * @template T - The input string to convert.
 *
 * @example
 * type R1 = ConstantCase<"HTMLInputElement">;
 * //   ^? "HTML_INPUT_ELEMENT"
 *
 * type R2 = ConstantCase<"--foo-bar--">;
 * //   ^? "FOO_BAR"
 */
type ConstantCase<T extends string> = JoinStr<
  WordsCaseMap<Words<T>, 'uppercase'>,
  '_'
>;

/**
 * Converts a string literal to kebab-case. Each word is fully lowercased
 * and joined with hyphens.
 *
 * @template T - The input string to convert.
 *
 * @example
 * type R1 = KebabCase<"HTMLInputElement">;
 * //   ^? "html-input-element"
 *
 * type R2 = KebabCase<"__FOO_BAR__">;
 * //   ^? "foo-bar"
 */
type KebabCase<T extends string> = JoinStr<
  WordsCaseMap<Words<T>, 'lowercase'>,
  '-'
>;

/**
 * Converts a string literal to lower case words separated by spaces.
 * Each word is fully lowercased.
 *
 * @template T - The input string to convert.
 *
 * @example
 * type R1 = LowerCaseWords<"HTMLInputElement">;
 * //   ^? "html input element"
 *
 * type R2 = LowerCaseWords<"__FOO_BAR__">;
 * //   ^? "foo bar"
 */
type LowerCaseWords<T extends string> = JoinStr<
  WordsCaseMap<Words<T>, 'lowercase'>,
  ' '
>;

/**
 * Converts a string literal to PascalCase (also known as UpperCamelCase).
 * Each word is capitalized with its remaining characters lowercased,
 * and all words are joined without a separator.
 *
 * @template T - The input string to convert.
 *
 * @example
 * type R1 = PascalCase<"HTMLInputElement">;
 * //   ^? "HtmlInputElement"
 *
 * type R2 = PascalCase<"--foo-bar--">;
 * //   ^? "FooBar"
 */
type PascalCase<T extends string> = JoinStr<
  WordsCaseMap<Words<T>, 'capitalize'>
>;

/**
 * Converts a string literal to snake_case. Each word is fully lowercased
 * and joined with underscores.
 *
 * @template T - The input string to convert.
 *
 * @example
 * type R1 = SnakeCase<"HTMLInputElement">;
 * //   ^? "html_input_element"
 *
 * type R2 = SnakeCase<"Foo Bar">;
 * //   ^? "foo_bar"
 */
type SnakeCase<T extends string> = JoinStr<
  WordsCaseMap<Words<T>, 'lowercase'>,
  '_'
>;

/**
 * Converts a string literal to Start Case. Each word is capitalized with
 * its remaining characters lowercased, and words are joined with spaces.
 *
 * @template T - The input string to convert.
 *
 * @example
 * type R1 = StartCaseWords<"HTMLInputElement">;
 * //   ^? "Html Input Element"
 *
 * type R2 = StartCaseWords<"--foo-bar--">;
 * //   ^? "Foo Bar"
 */
type StartCaseWords<T extends string> = JoinStr<
  WordsCaseMap<Words<T>, 'capitalize'>,
  ' '
>;

/**
 * Converts a string literal to UPPER CASE WORDS separated by spaces.
 * Each word is fully uppercased.
 *
 * @template T - The input string to convert.
 *
 * @example
 * type R1 = UpperCaseWords<"HTMLInputElement">;
 * //   ^? "HTML INPUT ELEMENT"
 *
 * type R2 = UpperCaseWords<"--foo-bar--">;
 * //   ^? "FOO BAR"
 */
type UpperCaseWords<T extends string> = JoinStr<
  WordsCaseMap<Words<T>, 'uppercase'>,
  ' '
>;

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
  CamelCase,
  ConstantCase,
  DeepRequired,
  Expand,
  GetSingle,
  GetStrictUnion,
  IsEqual,
  IsTuple,
  JSONValue,
  JoinStr,
  KebabCase,
  LowerCaseWords,
  MapPrefixKey,
  NullishKey,
  PascalCase,
  Primitive,
  SeparateDelimiter,
  SeparateWordLike,
  SnakeCase,
  SplitStr,
  StartCaseWords,
  Trim,
  TrimEnd,
  TrimStart,
  TupleKeys,
  UnionToIntersection,
  UpperCaseWords,
  WidenPrimitive,
  Words,
  WordsCaseMap,
  XOR,
};
