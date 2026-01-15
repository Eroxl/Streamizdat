import { User } from "better-auth";
import WebSocket from "ws";

type ChatUser = User | {
  name: string;
};

export type ChatClient = {
  user: ChatUser;
  ws: WebSocket;
  state: Record<string, unknown>;
}

type JSONMessage = {
  type: string;
  data: any;
};

export const isJSONMessage = (msg: Message): msg is JSONMessage => {
  return (msg as JSONMessage).type !== undefined
    && (msg as JSONMessage).data !== undefined;
}

type Message = string | JSONMessage;

export type ConnectMiddlewareFn = (
  chatApp: ChatApp,
  client: ChatClient,
  next: () => void
) => void;

export type ChatMiddlewareFn = (
  message: Message,
  chatApp: ChatApp,
  client: ChatClient,
  next: () => void
) => void;

export type ChatServiceFn = (
  chatApp: ChatApp 
) => void;

export type ChatPlugin = {
  services?: ChatServiceFn[];
  middleware?: {
    [T in keyof ChatApp["middleware"]]?: ChatApp["middleware"][T][number][];
  }
}

export type ChatApp = {
  sendToUser: (message: Message, ws: WebSocket) => void;
  broadcast: (message: Message, excludeWs?: WebSocket[]) => void;

  addMiddleware<T extends keyof ChatApp["middleware"]>(
    fn: ChatApp["middleware"][T][number],
    position: T
  ): void;
  addService: (fn: ChatServiceFn) => void;
  use: (plugin: ChatPlugin) => void;

  clients: Set<ChatClient>;

  /**
   * Services are functions that run for the lifetime of the chat app to provide
   * additional functionality.
   */
  services: ChatServiceFn[];
  /**
   * Middleware are functions that run before or after messages are processed.
   */
  middleware: {
    connect: ConnectMiddlewareFn[];
    message: ChatMiddlewareFn[];
    close: ConnectMiddlewareFn[];
  };
}

const initializeChatApp = () => {
  const chatApp: ChatApp = {
    clients: new Set(),
    services: [],
    middleware: {
      connect: [],
      message: [],
      close: [],
    } as ChatApp["middleware"],
    sendToUser(message: Message, ws: WebSocket) {
      if (typeof message === "string") {
        ws.send(message);
        return;
      }

      ws.send(JSON.stringify(message));
    },
    broadcast(message: Message, excludeWs: WebSocket[] = []) {
      this.clients.forEach((client) => {
        if (excludeWs.includes(client.ws)) return;
        
        this.sendToUser(message, client.ws);
      });
    },
    addMiddleware<T extends keyof ChatApp["middleware"]>(
      fn: ChatApp["middleware"][T][number],
      position: T
    ) {
      this.middleware[position].push(fn as any);
    },
    addService(fn: ChatServiceFn) {
      this.services.push(fn);

      fn(this);
    },
    use(plugin: ChatPlugin) {
      if (plugin.services) {
        for (const service of plugin.services) {
          this.addService(service);
        }
      }

      if (plugin.middleware) {
        for (const position in plugin.middleware) {
          const fns = plugin.middleware[position as keyof ChatApp["middleware"]];
          if (!fns) continue;

          for (const fn of fns) {
            this.addMiddleware(
              fn as any,
              position as keyof ChatApp["middleware"]
            );
          }
        }
      }
    },
  }
  
  return chatApp;
}

export { initializeChatApp };
