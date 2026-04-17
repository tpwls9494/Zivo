// chrome runtime mock
const storage: Record<string, unknown> = {};

const chromeMock = {
  storage: {
    sync: {
      get: vi.fn(async (key: string) => ({ [key]: storage[key] })),
      set: vi.fn(async (obj: Record<string, unknown>) => {
        Object.assign(storage, obj);
      }),
    },
  },
};

Object.defineProperty(globalThis, "chrome", { value: chromeMock, writable: true });

// crypto.randomUUID
if (!globalThis.crypto?.randomUUID) {
  Object.defineProperty(globalThis.crypto, "randomUUID", {
    value: () => "00000000-0000-0000-0000-000000000000",
    writable: true,
  });
}

beforeEach(() => {
  // reset storage between tests
  for (const k of Object.keys(storage)) delete storage[k];
  vi.clearAllMocks();
  // restore get/set behaviour after clearAllMocks
  chromeMock.storage.sync.get.mockImplementation(async (key: string) => ({
    [key]: storage[key],
  }));
  chromeMock.storage.sync.set.mockImplementation(async (obj: Record<string, unknown>) => {
    Object.assign(storage, obj);
  });
});
