type Listener = (coins: number) => void;

class EventEmitter {
  private listeners: { [key: string]: Listener[] } = {};

  emit(event: string, data: number) {
    if (!this.listeners[event]) return;
    this.listeners[event].forEach(listener => listener(data));
  }

  addListener(event: string, callback: Listener) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }

  removeListener(event: string, callback: Listener) {
    if (!this.listeners[event]) return;
    this.listeners[event] = this.listeners[event].filter(
      listener => listener !== callback
    );
  }
}

const eventEmitter = new EventEmitter();

export const COINS_UPDATE_EVENT = 'coinsUpdate';

export const emitCoinsUpdate = (coins: number) => {
  eventEmitter.emit(COINS_UPDATE_EVENT, coins);
};

export const addCoinsUpdateListener = (callback: (coins: number) => void) => {
  eventEmitter.addListener(COINS_UPDATE_EVENT, callback);
};

export const removeCoinsUpdateListener = (callback: (coins: number) => void) => {
  eventEmitter.removeListener(COINS_UPDATE_EVENT, callback);
};

export default eventEmitter; 