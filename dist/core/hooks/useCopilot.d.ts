import type { CopilotAPI, ToolDefinition } from '../../types/CopilotTypes';
export declare const useCopilot: (idOrIndex?: string | number) => {
    show: () => void | undefined;
    hide: () => void | undefined;
    addTool: (toolOrTools: ToolDefinition | ToolDefinition[]) => void;
    removeTool: (name: string) => void | undefined;
    removeAllTools: () => void | undefined;
    setUser: (user: Record<string, any>) => void | undefined;
    unsetUser: () => void | undefined;
    raw: CopilotAPI | undefined;
};
