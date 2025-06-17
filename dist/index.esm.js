import { jsx, Fragment } from 'react/jsx-runtime';
import { useEffect, useState } from 'react';

const waitForCopilot = (botName, timeout = 5000, interval = 100) => {
    return new Promise((resolve) => {
        if (typeof window === 'undefined')
            return resolve(null);
        let tries = 0;
        const maxTries = Math.ceil(timeout / interval);
        const check = () => {
            const copilotFn = window[botName];
            const isReady = window[`_${botName}_ready`];
            const hasRealAPI = typeof copilotFn === 'function' &&
                typeof copilotFn.tools?.add === 'function' &&
                typeof copilotFn.users?.set === 'function';
            if (isReady && hasRealAPI) {
                const copilotAPI = {
                    show: () => copilotFn('event', 'open'),
                    hide: () => copilotFn('event', 'close'),
                    tools: {
                        add: (tools) => copilotFn.tools.add(tools),
                        remove: (name) => copilotFn.tools.remove?.(name),
                        removeAll: () => copilotFn.tools.removeAll?.(),
                    },
                    users: {
                        set: (user) => copilotFn.users.set(user),
                        unset: () => copilotFn.users.unset(),
                    },
                };
                return resolve(copilotAPI);
            }
            if (++tries >= maxTries) {
                console.warn(`[${botName}] Copilot not ready after timeout.`);
                return resolve(null);
            }
            setTimeout(check, interval);
        };
        check();
    });
};

const copilotInstances = new Map();

const validateBotName = (botName) => {
    const isValid = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(botName);
    if (!isValid) {
        throw new Error(`[CopilotProvider] Invalid botName "${botName}". It must start with a letter, $, or _, and contain only letters, numbers, $, or _.`);
    }
    return botName;
};

const defaultBotName = 'copilot';

const injectCopilotScript = (key, token, config = {}, scriptUrl) => {
    const safeBotName = validateBotName(key);
    const scriptId = `copilot-loader-script${safeBotName === 'copilot' ? '' : `-${safeBotName}`}`;
    const existingScript = document.getElementById(scriptId);
    if (existingScript) {
        const copilotFn = window[safeBotName];
        if (typeof copilotFn === 'function') {
            copilotFn('init', config, function () {
                window[`_${safeBotName}_ready`] = true;
            });
        }
    }
    else {
        const inlineScript = document.createElement('script');
        inlineScript.id = scriptId;
        inlineScript.type = 'application/javascript';
        inlineScript.innerHTML = `
    (function(w,d,s,o,f,js,fjs){
      w[o]=w[o]||function(){
        (w[o].q=w[o].q||[]).push(arguments);
      };
      js=d.createElement(s), fjs=d.getElementsByTagName(s)[0];
      js.id=o;
      js.src="${scriptUrl ?? 'https://script.copilot.live/v1/copilot.min.js'}?tkn=${token}";
      js.async=1;
      js.referrerPolicy="origin";
      fjs.parentNode.insertBefore(js,fjs);
    })(window,document,"script","${safeBotName}");

    ${safeBotName}("init", ${JSON.stringify(config)}, function () {
      window["_${safeBotName}_ready"] = true;
    });
  `;
        document.body.appendChild(inlineScript);
    }
    waitForCopilot(safeBotName).then((copilot) => {
        if (copilot) {
            copilotInstances.set(key, copilot);
        }
    });
};
const CopilotProvider = (props) => {
    useEffect(() => {
        // MULTI mode
        if ('instances' in props && Array.isArray(props.instances)) {
            props.instances.forEach(({ token, config = {}, scriptUrl, botName }, index) => {
                const instanceKey = botName || `${defaultBotName}${index}`;
                injectCopilotScript(instanceKey, token, config, scriptUrl);
            });
        }
        // SINGLE mode
        else if ('token' in props) {
            const { token, config = {}, scriptUrl, botName } = props;
            injectCopilotScript(botName || defaultBotName, token, config, scriptUrl);
        }
    }, [props]);
    return jsx(Fragment, { children: props.children });
};

const MAX_WAIT_TIME = 5000; // in ms
const useCopilot = (idOrIndex) => {
    const [copilot, setCopilot] = useState();
    const [hasErrored, setHasErrored] = useState(false);
    useEffect(() => {
        const interval = 100;
        const maxTries = MAX_WAIT_TIME / interval;
        let tries = 0;
        const id = setInterval(() => {
            const keys = Array.from(copilotInstances.keys());
            const key = idOrIndex === undefined
                ? keys[0]
                : typeof idOrIndex === 'number'
                    ? keys[idOrIndex]
                    : idOrIndex;
            if (key && copilotInstances.has(key)) {
                setCopilot(copilotInstances.get(key));
                clearInterval(id);
            }
            else if (++tries >= maxTries) {
                setHasErrored(true);
                clearInterval(id);
            }
        }, interval);
        return () => clearInterval(id);
    }, [idOrIndex]);
    useEffect(() => {
        if (hasErrored) {
            console.error(`[useCopilot] Copilot "${String(idOrIndex ?? '0')}" not found`);
        }
    }, [hasErrored, idOrIndex]);
    const addTool = (toolOrTools) => {
        if (!copilot?.tools?.add)
            return;
        const tools = Array.isArray(toolOrTools) ? toolOrTools : [toolOrTools];
        tools.forEach(tool => copilot.tools.add(tool));
    };
    return {
        show: () => copilot?.show(),
        hide: () => copilot?.hide(),
        addTool,
        removeTool: (name) => copilot?.tools?.remove(name),
        removeAllTools: () => copilot?.tools?.removeAll?.(),
        setUser: (user) => copilot?.users?.set(user),
        unsetUser: () => copilot?.users?.unset(),
        raw: copilot,
    };
};

const Copilot = ({ tools, botName }) => {
    const { addTool, removeAllTools } = useCopilot(botName);
    useEffect(() => {
        if (!tools || !addTool) {
            if (!tools) {
                console.warn('[Copilot] No tools provided.');
            }
            if (!addTool) {
                console.warn(`[Copilot] Copilot instance for "${botName ?? 0}" not ready or missing.`);
            }
            return;
        }
        addTool(tools);
        return () => {
            if (typeof removeAllTools === 'function') {
                removeAllTools();
            }
        };
    }, [tools, addTool]);
    return null;
};

const useCopilotTool = (toolOrTools, options) => {
    const { addTool, removeTool } = useCopilot(options?.idOrIndex);
    useEffect(() => {
        const tools = Array.isArray(toolOrTools) ? toolOrTools : [toolOrTools];
        addTool?.(tools);
        return () => {
            if (options?.removeOnUnmount) {
                tools.forEach(tool => {
                    if (tool?.name)
                        removeTool?.(tool.name);
                });
            }
        };
    }, [addTool, removeTool, toolOrTools, options?.removeOnUnmount]);
};

const useCopilotUser = (user, options) => {
    const { setUser, unsetUser } = useCopilot(options?.idOrIndex);
    useEffect(() => {
        setUser?.(user);
        return () => {
            if (options?.unsetOnUnmount) {
                unsetUser?.();
            }
        };
    }, [setUser, unsetUser, user, options?.unsetOnUnmount]);
};

export { Copilot, CopilotProvider, useCopilot, useCopilotTool, useCopilotUser };
//# sourceMappingURL=index.esm.js.map
