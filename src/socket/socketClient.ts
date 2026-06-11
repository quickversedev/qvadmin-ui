import {Client, StompSubscription} from '@stomp/stompjs';
import SockJS from 'sockjs-client';

let client: Client | null = null;

export const connectSocket = (url: string) => {
  if (client?.active) {
    return client;
  }

  client = new Client({
    webSocketFactory: () => new SockJS(url),

    reconnectDelay: 5000,

    debug: msg => {
      console.log('[STOMP]', msg);
    },

    onConnect: frame => {
      console.log('✅ Connected');
      console.log(frame);
    },

    onDisconnect: () => {
      console.log('❌ Disconnected');
    },

    onStompError: frame => {
      console.log('❌ STOMP ERROR');
      console.log(frame.headers);
      console.log(frame.body);
    },

    onWebSocketClose: event => {
      console.log('❌ WS CLOSED', event);
    },

    onWebSocketError: event => {
      console.log('❌ WS ERROR', event);
    },
  });

  client.activate();

  return client;
};

export const subscribeTopic = (
  topic: string,
  callback: (body: string) => void,
): StompSubscription | undefined => {
  if (!client?.connected) {
    console.log('Not connected');
    return;
  }

  return client.subscribe(topic, message => {
    callback(message.body);
  });
};

export const sendMessage = (destination: string, body: unknown) => {
  if (!client?.connected) {
    return;
  }

  client.publish({
    destination,
    body: JSON.stringify(body),
  });
};

export const disconnectSocket = () => {
  client?.deactivate();
  client = null;
};
