import type { ToolDefinition } from '../../types/CopilotTypes';
interface Options {
    removeOnUnmount?: boolean;
    idOrIndex?: string | number;
}
export declare const useCopilotTool: (toolOrTools: ToolDefinition | ToolDefinition[], options?: Options) => void;
export {};
