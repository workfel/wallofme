/**
 * Type stubs for backend-only dependencies.
 * These modules are pulled in transitively by the @backend/* path alias
 * but are not needed at runtime in the frontend.
 */
declare module '@ai-sdk/openai' {
  export function createOpenAI(config: unknown): (...args: unknown[]) => unknown;
}

declare module 'ai' {
  export type LanguageModel = unknown;
   
  export type Output = (config: unknown) => unknown;
  export namespace Output {
    export function object(config: unknown): Output;
  }
  export function generateObject(config: unknown): Promise<{ object: unknown }>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export function generateText(config: any): Promise<any>;
  export function tool(config: unknown): unknown;
  export const jsonSchema: unknown;
}

declare module '@imgly/background-removal-node' {
  export function removeBackground(blob: Blob): Promise<Blob>;
}
