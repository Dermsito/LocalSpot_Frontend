import { HttpInterceptorFn } from '@angular/common/http';
import { TOKEN_KEY } from './auth';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.url.includes('/api/auth/')) {
    return next(req);
  }

  const token = localStorage.getItem(TOKEN_KEY);

  if (!token || token === 'mock-jwt-token') {
    return next(req);
  }

  return next(
    req.clone({
      setHeaders: { Authorization: `Bearer ${token}` }
    })
  );
};