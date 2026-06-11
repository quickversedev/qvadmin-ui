import {useCallback} from 'react';
import {subscribeTopic, sendMessage} from '../socket/socketClient';

export const useSocket = () => {
  const subscribe = useCallback(
    (topic: string, callback: (message: string) => void) => {
      return subscribeTopic(topic, callback);
    },
    [],
  );

  const send = useCallback((destination: string, body: unknown) => {
    return sendMessage(destination, body);
  }, []);

  return {
    subscribe,
    send,
  };
};
