import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login';
import { RegistroComponent } from './pages/registro/registro';
import { PreferenciasComponent } from './pages/preferencias/preferencias';
import { LugaresComponent } from './pages/lugares/lugares';

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
    path: 'preferencias',
    component: PreferenciasComponent
  },
  {
    path: 'lugares',
    component: LugaresComponent
  }
];