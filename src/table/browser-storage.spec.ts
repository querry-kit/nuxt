import { browserStorage } from './browser-storage';

describe('browserStorage', () => {
  it('returns browser storage when it is available', () => {
    const originalStorage = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
    const storage = { getItem: jest.fn(), setItem: jest.fn() };
    Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: storage });

    expect(browserStorage()).toBe(storage);

    if (originalStorage) Object.defineProperty(globalThis, 'localStorage', originalStorage);
    else Reflect.deleteProperty(globalThis, 'localStorage');
  });

  it('returns undefined when storage is unavailable', () => {
    const originalStorage = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
    Reflect.deleteProperty(globalThis, 'localStorage');
    expect(browserStorage()).toBeUndefined();

    if (originalStorage) Object.defineProperty(globalThis, 'localStorage', originalStorage);
    else Reflect.deleteProperty(globalThis, 'localStorage');
  });

  it('returns undefined when accessing browser storage throws', () => {
    const originalGlobal = globalThis;
    const originalDescriptor = Object.getOwnPropertyDescriptor(originalGlobal, 'globalThis');
    const browserGlobal = Object.defineProperty({}, 'localStorage', {
      get: () => {
        throw new Error('storage unavailable');
      },
    });

    // Node's contextified global can swallow accessor errors; use an ordinary browser global.
    Object.defineProperty(originalGlobal, 'globalThis', { configurable: true, value: browserGlobal });
    let result: ReturnType<typeof browserStorage>;
    try {
      result = browserStorage();
    } finally {
      if (originalDescriptor) Object.defineProperty(originalGlobal, 'globalThis', originalDescriptor);
      else Reflect.deleteProperty(originalGlobal, 'globalThis');
    }
    expect(result).toBeUndefined();
  });
});
