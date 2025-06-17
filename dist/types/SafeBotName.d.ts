/**
 * Type-safe botName constraint — must match /^[a-zA-Z_$][a-zA-Z0-9_$]*$/
 */
export type SafeBotName<T extends string> = T extends `${infer First}${infer Rest}` ? First extends Lowercase<First> | Uppercase<First> | '_' | '$' ? Rest extends `${string}` ? T extends `${string}-${string}` | `${string}.${string}` | `${string} ${string}` ? never : T : never : never : never;
