beforeEach(() => {
  Object.defineProperty(global, 'fetch', {
    writable: true,
    value: jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ results: [] }),
    }),
  });
});

afterEach(() => {
  jest.clearAllMocks();
});
