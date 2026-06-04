import { render, screen, waitFor } from '@testing-library/react';

import MobileBottomNav from '../MobileBottomNav';
import Sidebar from '../Sidebar';
import { ThemeToggle } from '../ThemeToggle';

const mockPush = jest.fn();

jest.mock('@/client/router', () => ({
  usePathname: () => '/',
  useRouter: () => ({ push: mockPush }),
  useSearchParams: () => new URLSearchParams(),
}));

jest.mock('@/client/theme-provider', () => ({
  useTheme: () => ({
    resolvedTheme: 'dark',
    setTheme: jest.fn(),
  }),
}));

jest.mock('../ChatModal', () => ({
  ChatModal: () => <div role='dialog'>聊天</div>,
}));

describe('hidden front-end options', () => {
  beforeEach(() => {
    mockPush.mockClear();
    localStorage.clear();
  });

  it('does not render manga, short drama, or live in desktop navigation', () => {
    render(<Sidebar activePath='/' />);

    expect(screen.queryByRole('button', { name: '动漫' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '短剧' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '直播' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: '电影' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '剧集' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '综艺' })).toBeInTheDocument();
  });

  it('does not render manga, short drama, or live in mobile navigation', () => {
    render(<MobileBottomNav activePath='/' />);

    expect(screen.queryByRole('button', { name: '动漫' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '短剧' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '直播' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: '电影' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '剧集' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '综艺' })).toBeInTheDocument();
  });

  it('does not render the chat entry point or chat modal', async () => {
    render(<ThemeToggle />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Toggle theme' })).toBeInTheDocument();
    });

    expect(screen.queryByRole('button', { name: 'Open chat' })).not.toBeInTheDocument();
    expect(screen.queryByRole('dialog', { name: '聊天' })).not.toBeInTheDocument();
  });
});
