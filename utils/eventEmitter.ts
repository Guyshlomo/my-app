type Listener = (coins: number) => void;
type EventDeletedListener = () => void;
type TasksCompletedListener = (userId: string, tasksCompleted: number) => void;

class EventEmitter {
  private listeners: { [key: string]: Listener[] } = {};
  private eventDeletedListeners: EventDeletedListener[] = [];
  private tasksCompletedListeners: TasksCompletedListener[] = [];

  emit(event: string, data: number) {
    if (!this.listeners[event]) return;
    this.listeners[event].forEach(listener => listener(data));
  }

  emitEventDeleted() {
    this.eventDeletedListeners.forEach(listener => listener());
  }

  emitTasksCompletedUpdate(userId: string, tasksCompleted: number) {
    console.log('📡 EventEmitter: emitTasksCompletedUpdate called with:', { userId, tasksCompleted });
    console.log('📡 EventEmitter: Number of listeners:', this.tasksCompletedListeners.length);
    this.tasksCompletedListeners.forEach((listener, index) => {
      console.log(`📡 EventEmitter: Calling listener ${index + 1}`);
      listener(userId, tasksCompleted);
    });
  }

  addListener(event: string, callback: Listener) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }

  addEventDeletedListener(callback: EventDeletedListener) {
    this.eventDeletedListeners.push(callback);
  }

  addTasksCompletedListener(callback: TasksCompletedListener) {
    this.tasksCompletedListeners.push(callback);
  }

  removeListener(event: string, callback: Listener) {
    if (!this.listeners[event]) return;
    this.listeners[event] = this.listeners[event].filter(
      listener => listener !== callback
    );
  }

  removeEventDeletedListener(callback: EventDeletedListener) {
    this.eventDeletedListeners = this.eventDeletedListeners.filter(
      listener => listener !== callback
    );
  }

  removeTasksCompletedListener(callback: TasksCompletedListener) {
    this.tasksCompletedListeners = this.tasksCompletedListeners.filter(
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

// Event deletion notifications
export const emitEventDeleted = () => {
  eventEmitter.emitEventDeleted();
};

export const addEventDeletedListener = (callback: () => void) => {
  eventEmitter.addEventDeletedListener(callback);
};

export const removeEventDeletedListener = (callback: () => void) => {
  eventEmitter.removeEventDeletedListener(callback);
};

// Tasks completed update notifications
export const emitTasksCompletedUpdate = (userId: string, tasksCompleted: number) => {
  console.log('🚀 emitTasksCompletedUpdate called with:', { userId, tasksCompleted });
  eventEmitter.emitTasksCompletedUpdate(userId, tasksCompleted);
};

export const addTasksCompletedListener = (callback: (userId: string, tasksCompleted: number) => void) => {
  eventEmitter.addTasksCompletedListener(callback);
};

export const removeTasksCompletedListener = (callback: (userId: string, tasksCompleted: number) => void) => {
  eventEmitter.removeTasksCompletedListener(callback);
};

export default eventEmitter; 