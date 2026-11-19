import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, throwError } from 'rxjs';
import { environment } from '../../environments/environment';

export type Rol = 'FINAL' | 'ADMINISTRADOR' | 'PROPIETARIO';

export const TOKEN_KEY = 'localspot_token';
export const USUARIO_KEY = 'localspot_usuario';

export interface UsuarioSesion {
  id: number;
  nombre: string;
  correo: string;
  rol: Rol;
}

export interface ResultadoCredenciales {
  valido: boolean;
  rol: Rol;
  nombre?: string;
}

export function normalizarRol(valor: string | null | undefined): Rol {
  const limpio = (valor ?? '').toString().trim().toUpperCase().replace(/^ROLE_/, '');
  switch (limpio) {
    case 'ADMINISTRADOR':
    case 'ADMIN':
      return 'ADMINISTRADOR';
    case 'PROPIETARIO':
    case 'OWNER':
      return 'PROPIETARIO';
    default:
      return 'FINAL';
  }
}

export function rutaInicialPorRol(rol: Rol | null | undefined): string {
  switch (rol) {
    case 'ADMINISTRADOR':
      return '/admin/panel';
    case 'PROPIETARIO':
      return '/propietario/panel';
    default:
      return '/lugares';
  }
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  constructor(private http: HttpClient) {}

  login(correo: string, rol: Rol = 'FINAL', nombre?: string, password?: string): Observable<any> {
    const correoNormalizado = (correo || '').trim().toLowerCase();
    const contrasenaLimpia = (password || '').trim();

    if (!correoNormalizado || !contrasenaLimpia) {
      return throwError(() => ({
        status: 400,
        error: { message: 'Debes ingresar tu correo y contraseña.' }
      }));
    }

    return this.http.post<any>(`${environment.apiUrl}/auth/login`, {
      correo: correoNormalizado,
      contrasena: contrasenaLimpia
    }).pipe(
      tap((res: any) => {
        const u = res?.usuario || res;
        const rolNormalizado = normalizarRol(u?.rol);
        const sesion: UsuarioSesion = {
          id: u?.id,
          nombre: u?.nombre || nombre || correoNormalizado.split('@')[0],
          correo: correoNormalizado,
          rol: rolNormalizado
        };
        this.guardarSesion({ token: res.token, usuario: sesion });
      })
    );
  }

  loginConGoogle(idToken: string): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}/auth/google`, { idToken }).pipe(
      tap((res: any) => {
        const u = res?.usuario || res;
        const rolNormalizado = normalizarRol(u?.rol);
        const sesion: UsuarioSesion = {
          id: u?.id,
          nombre: u?.nombre || 'Usuario Google',
          correo: u?.correo || '',
          rol: rolNormalizado
        };
        this.guardarSesion({ token: res.token, usuario: sesion });
      })
    );
  }

  resolverCredenciales(correo: string, password: string): ResultadoCredenciales {
    const correoNormalizado = (correo ?? '').trim().toLowerCase();
    const passLimpio = (password ?? '').trim();
    if (!correoNormalizado || !passLimpio) {
      return { valido: false, rol: 'FINAL' };
    }
    return { valido: true, rol: 'FINAL' };
  }

  registrar(usuario: any): Observable<any> {
    const payload = {
      nombre: (usuario.nombre || '').trim(),
      correo: (usuario.correo || '').trim().toLowerCase(),
      contrasena: usuario.contrasena || usuario.password,
      tipoUsuario: usuario.tipoUsuario || usuario.rol || 'FINAL'
    };
    return this.http.post<any>(`${environment.apiUrl}/auth/register`, payload);
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USUARIO_KEY);
  }

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  getUsuario(): UsuarioSesion | null {
    const guardado = localStorage.getItem(USUARIO_KEY);
    return guardado ? JSON.parse(guardado) : null;
  }

  getRol(): Rol | null {
    return this.getUsuario()?.rol ?? null;
  }

  getRutaInicio(): string {
    return rutaInicialPorRol(this.getRol());
  }

  estaAutenticado(): boolean {
    const token = this.getToken();
    return Boolean(token && token !== 'mock-jwt-token');
  }

  solicitarRecuperacion(correo: string): Observable<any> {
    const correoNormalizado = (correo || '').trim().toLowerCase();
    return this.http.post<any>(`${environment.apiUrl}/auth/olvide-contrasena`, {
      correo: correoNormalizado
    });
  }

  restablecerContrasena(token: string, nuevaContrasena: string): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}/auth/restablecer-contrasena`, {
      token: (token || '').trim(),
      nuevaContrasena: (nuevaContrasena || '').trim()
    });
  }

  private guardarSesion(respuesta: any): void {
    localStorage.setItem(TOKEN_KEY, respuesta.token);
    localStorage.setItem(USUARIO_KEY, JSON.stringify(respuesta.usuario));
  }
}