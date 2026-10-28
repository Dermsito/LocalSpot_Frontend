import { HttpInterceptorFn } from '@angular/common/http';
import { TOKEN_KEY } from './auth';

/**
 * Adjunta el JWT al header Authorization de cada petición saliente cuando hay sesión.
 * Lee el token directamente de localStorage para evitar dependencias circulares
 * con AuthService (que a su vez usa HttpClient).
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem(TOKEN_KEY);

  if (!token) {
    return next(req);
  }

  return next(
    req.clone({
      setHeaders: { Authorization: `Bearer ${token}` }
    })
  );
};
