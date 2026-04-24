import { registerPlugin } from '@capacitor/core';

export interface KeyboardPlugin {
  hide(): Promise<void>;
  show(): Promise<void>;
}

const Keyboard = registerPlugin<KeyboardPlugin>('Keyboard', {
  web: () => Promise.resolve({
    hide: async () => {},
    show: async () => {},
  }),
});

export default Keyboard;



