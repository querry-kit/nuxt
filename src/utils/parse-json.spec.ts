import { parseJson } from './parse-json';

describe('parseJson', () => {
  it('uses its fallback for absent and invalid JSON', () => {
    expect(parseJson(null, ['fallback'])).toEqual(['fallback']);
    expect(parseJson('{not json', ['fallback'])).toEqual(['fallback']);
  });

  it('returns valid JSON with the requested type', () => {
    expect(parseJson<string[]>('["saved"]', [])).toEqual(['saved']);
  });
});
