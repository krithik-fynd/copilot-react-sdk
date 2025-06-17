// Updated CopilotProvider with automatic mode detection
import React, { useEffect } from 'react';
import { waitForCopilot } from '../core/waitForCopilot';
import { copilotInstances } from '../core/CopilotInstanceManager';
import { validateBotName } from '../utills/validateBotName';
import { defaultBotName, type CopilotAPI } from '../types/CopilotTypes';

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

const injectCopilotScript = (
  key: string,
  token: string,
  config: Record<string, any> = {},
  scriptUrl?: string,
) => {
  const safeBotName = validateBotName(key);
  const scriptId = `copilot-loader-script${safeBotName === 'copilot' ? '' : `-${safeBotName}`}`;
  const existingScript = document.getElementById(scriptId);

  if (existingScript) {
    const copilotFn = (window as any)[safeBotName];
    if (typeof copilotFn === 'function') {
      copilotFn('init', config, function () {
        (window as any)[`_${safeBotName}_ready`] = true;
      });
    }
  } else {
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

  waitForCopilot(safeBotName).then((copilot: CopilotAPI | null) => {
    if (copilot) {
      copilotInstances.set(key, copilot);
    }
  });
};

export const CopilotProvider = (props: CopilotProviderProps) => {
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

  return <>{props.children}</>;
};
