import { getDefaultExport } from '../module-interop';

describe('getDefaultExport', () => {
  it('unwraps nested default exports produced by bundled CommonJS modules', () => {
    function Artplayer() {}
    const module = { default: { default: Artplayer } };

    expect(getDefaultExport(module)).toBe(Artplayer);
  });
});
