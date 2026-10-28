import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login';
import { RegistroComponent } from './pages/registro/registro';
import { LugaresComponent } from './pages/lugares/lugares';
import { DetalleLugarComponent } from './pages/detalle-lugar/detalle-lugar';
import { AdminLoginComponent } from './pages/admin-login/admin-login';
import { AdminRegistroComponent } from './pages/admin-registro/admin-registro';
import { PropietarioLoginComponent } from './pages/propietario/login/propietario-login';
import { PropietarioRegistroComponent } from './pages/propietario/registro/propietario-registro';
import { PropietarioPanelComponent } from './pages/propietario/panel/propietario-panel';
import { AdminPanelComponent } from './pages/admin/panel/admin-panel';
import { roleGuard } from './guards/role.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },
  {
    path: 'login',
    component: LoginComponent
  },
  {
    path: 'registro',
    component: RegistroComponent
  },
  {
    path: 'lugares',
    component: LugaresComponent
  },
  {
    path: 'lugar/:id',
    component: DetalleLugarComponent
  },
  {
    path: 'admin/login',
    component: AdminLoginComponent
  },
  {
    path: 'admin/registro',
    component: AdminRegistroComponent
  },
  {
    path: 'admin/panel',
    component: AdminPanelComponent,
    canActivate: [roleGuard('ADMINISTRADOR')]
  },
  {
    path: 'propietario/login',
    component: PropietarioLoginComponent
  },
  {
    path: 'propietario/registro',
    component: PropietarioRegistroComponent
  },
  {
    path: 'propietario/panel',
    component: PropietarioPanelComponent,
    canActivate: [roleGuard('PROPIETARIO')]
  }
];