import React from 'react';
interface SharedProps {
    children: React.ReactNode;
}
interface SingleInstance {
    token: string;
    config?: Record<string, any>;
    scriptUrl?: string;
    botName?: string;
}
interface MultiInstance {
    instances: SingleInstance[];
}
type CopilotProviderProps = (SingleInstance | MultiInstance) & SharedProps;
export declare const CopilotProvider: (props: CopilotProviderProps) => import("react/jsx-runtime").JSX.Element;
export {};
