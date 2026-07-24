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

  it('returns undefined when storage is unavailable or throws while being accessed', () => {
    const originalStorage = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
    Reflect.deleteProperty(globalThis, 'localStorage');
    expect(browserStorage()).toBeUndefined();

    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      get: () => {
        throw new Error('storage unavailable');
      },
    });
    expect(browserStorage()).toBeUndefined();

    if (originalStorage) Object.defineProperty(globalThis, 'localStorage', originalStorage);
    else Reflect.deleteProperty(globalThis, 'localStorage');
  });
});
