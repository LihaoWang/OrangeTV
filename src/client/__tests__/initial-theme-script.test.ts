import fs from 'fs';
import path from 'path';

const indexHtml = fs.readFileSync(path.join(process.cwd(), 'index.html'), 'utf8');

function getInitialThemeScript() {
  const scripts = Array.from(
    indexHtml.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)
  ).map((match) => match[1]);
  const script = scripts.find((content) =>
    content.includes("localStorage.getItem('theme')")
  );

  if (!script) {
    throw new Error('Initial theme script not found');
  }

  return script;
}

function runInitialThemeScript(theme: string | null, prefersDark = false) {
  document.documentElement.className = '';
  document.documentElement.removeAttribute('style');
  document.head.innerHTML = '';
  localStorage.clear();

  if (theme) {
    localStorage.setItem('theme', theme);
  }

  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: jest.fn().mockImplementation(() => ({
      addEventListener: jest.fn(),
      matches: prefersDark,
      media: '(prefers-color-scheme: dark)',
      removeEventListener: jest.fn(),
    })),
  });

  Function(getInitialThemeScript())();

  return {
    className: document.documentElement.className,
    colorScheme: document.documentElement.style.colorScheme,
    themeColor: document
      .querySelector('meta[name="theme-color"]')
      ?.getAttribute('content'),
  };
}

describe('initial theme script', () => {
  it('runs before runtime config and the React entrypoint', () => {
    const themeScriptIndex = indexHtml.indexOf("localStorage.getItem('theme')");

    expect(themeScriptIndex).toBeGreaterThan(-1);
    expect(themeScriptIndex).toBeLessThan(indexHtml.indexOf('/runtime-config.js'));
    expect(themeScriptIndex).toBeLessThan(
      indexHtml.indexOf('/src/client/main.tsx')
    );
  });

  it('applies dark mode from localStorage before React loads', () => {
    expect(runInitialThemeScript('dark')).toEqual({
      className: 'dark',
      colorScheme: 'dark',
      themeColor: '#080707',
    });
  });

  it('resolves system dark mode before React loads', () => {
    expect(runInitialThemeScript('system', true)).toEqual({
      className: 'dark',
      colorScheme: 'dark',
      themeColor: '#080707',
    });
  });
});
