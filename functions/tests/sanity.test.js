describe('functions sanity', () => {
  test('env ok', () => {
    expect(typeof process.env).toBe('object');
  });
});
