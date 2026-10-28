import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService, Rol, rutaInicialPorRol } from '../services/auth';

/**
 * Permite el acceso solo si la sesión tiene uno de los roles indicados.
 * Uso: { path: 'admin/panel', canActivate: [roleGuard('ADMINISTRADOR')] }
 *
 * Nota: esto solo controla la navegación en el frontend (UX/redirección).
 * La autorización de datos la impone el backend.
 */
export const roleGuard = (...roles: Rol[]): CanActivateFn => () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.estaAutenticado()) {
    return router.createUrlTree(['/login']);
  }

  const rol = auth.getRol();
  if (rol !== null && roles.includes(rol)) {
    return true;
  }

  // Autenticado pero sin permisos: lo llevamos a su propio apartado.
  return router.createUrlTree([rutaInicialPorRol(rol)]);
};
