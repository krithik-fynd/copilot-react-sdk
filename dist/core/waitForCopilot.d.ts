import type { CopilotAPI } from '../types/CopilotTypes';
export declare const waitForCopilot: (botName: string, timeout?: number, interval?: number) => Promise<CopilotAPI | null>;
