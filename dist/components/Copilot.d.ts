import { type ToolDefinition } from '../types/CopilotTypes';
type Props = {
    tools?: ToolDefinition | ToolDefinition[];
    botName?: string | number;
};
export declare const Copilot: ({ tools, botName }: Props) => null;
export {};
