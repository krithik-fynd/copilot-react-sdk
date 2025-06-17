export declare const defaultBotName = "copilot";
export type ToolParameter = {
    type: string;
    description?: string;
};
export type ToolDefinition = {
    name: string;
    description: string;
    parameters?: {
        type: 'object';
        properties: Record<string, ToolParameter>;
        required?: string[];
    };
    timeout?: number;
    handler: (args: Record<string, any>) => Promise<any> | any;
};
export type CopilotAPI = {
    show: () => void;
    hide: () => void;
    tools: {
        add: (tool: ToolDefinition | ToolDefinition[]) => void;
        remove: (name: string) => void;
        removeAll?: () => void;
    };
    users: {
        set: (user: Record<string, any>) => void;
        unset: () => void;
    };
};
