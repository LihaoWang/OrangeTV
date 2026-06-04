import { useLocation, useNavigate, useSearchParams as useRRSearchParams } from 'react-router-dom';

export function useRouter() {
  const navigate = useNavigate();

  return {
    push: (href: string) => navigate(href),
    replace: (href: string) => navigate(href, { replace: true }),
    back: () => window.history.back(),
    forward: () => window.history.forward(),
    refresh: () => window.location.reload(),
  };
}

export function usePathname() {
  return useLocation().pathname;
}

export function useSearchParams() {
  const [searchParams] = useRRSearchParams();
  return searchParams;
}

export function redirect(href: string): never {
  window.location.href = href;
  throw new Error(`Redirected to ${href}`);
}
