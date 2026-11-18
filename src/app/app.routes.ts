import { Routes } from '@angular/router';
import { roleGuard } from './guards/role.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login').then(m => m.LoginComponent)
  },
  {
    path: 'registro',
    loadComponent: () => import('./pages/registro/registro').then(m => m.RegistroComponent)
  },
  {
    path: 'recuperar-contrasena',
    loadComponent: () => import('./pages/recuperar-contrasena/recuperar-contrasena').then(m => m.RecuperarContrasenaComponent)
  },
  {
    path: 'restablecer-contrasena',
    loadComponent: () => import('./pages/restablecer-contrasena/restablecer-contrasena').then(m => m.RestablecerContrasenaComponent)
  },
  {
    path: 'lugares',
    loadComponent: () => import('./pages/lugares/lugares').then(m => m.LugaresComponent)
  },
  {
    path: 'lugar/:id',
    loadComponent: () => import('./pages/detalle-lugar/detalle-lugar').then(m => m.DetalleLugarComponent)
  },
  {
    path: 'admin/login',
    loadComponent: () => import('./pages/admin-login/admin-login').then(m => m.AdminLoginComponent)
  },
  {
    path: 'admin/registro',
    loadComponent: () => import('./pages/admin-registro/admin-registro').then(m => m.AdminRegistroComponent)
  },
  {
    path: 'admin/panel',
    loadComponent: () => import('./pages/admin/panel/admin-panel').then(m => m.AdminPanelComponent),
    canActivate: [roleGuard('ADMINISTRADOR')]
  },
  {
    path: 'propietario/login',
    loadComponent: () => import('./pages/propietario/login/propietario-login').then(m => m.PropietarioLoginComponent)
  },
  {
    path: 'propietario/registro',
    loadComponent: () => import('./pages/propietario/registro/propietario-registro').then(m => m.PropietarioRegistroComponent)
  },
  {
    path: 'propietario/panel',
    loadComponent: () => import('./pages/propietario/panel/propietario-panel').then(m => m.PropietarioPanelComponent),
    canActivate: [roleGuard('PROPIETARIO')]
  }
];