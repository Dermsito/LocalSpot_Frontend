import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, tap, catchError } from 'rxjs';
import { environment } from '../../environments/environment';

export type Rol = 'FINAL' | 'ADMINISTRADOR' | 'PROPIETARIO';

export const TOKEN_KEY = 'localspot_token';
export const USUARIO_KEY = 'localspot_usuario';
export const CUENTAS_MOCK_KEY = 'localspot_cuentas_mock';

/**
 * Clave del almacén de negocios. Debe coincidir con la usada en LugaresService
 * ('localspot_lugares_mock'); solo se lee aquí para detectar propietarios.
 */
const LUGARES_STORAGE_KEY = 'localspot_lugares_mock';

/**
 * Credenciales de PRUEBA (solo frontend) del administrador.
 */
export const CREDENCIALES_ADMIN_PRUEBA = {
  correo: 'admin1@gmail.com',
  password: '12345'
};

export interface UsuarioSesion {
  id: number;
  nombre: string;
  correo: string;
  rol: Rol;
}

/** Registro local (mock) de cuentas que ya iniciaron sesión o se registraron. */
interface CuentaMock {
  nombre: string;
  rol: Rol;
}

export interface ResultadoCredenciales {
  valido: boolean;
  rol: Rol;
  nombre?: string;
}

/**
 * Unifica el rol que pueda venir del backend en cualquiera de sus variantes
 * (ROLE_ADMINISTRADOR, ADMIN, USUARIO, ROLE_USER, ...) al formato interno.
 */
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

/**
 * Ruta inicial a la que debe entrar cada rol después de iniciar sesión.
 * - FINAL (USUARIO)   -> exploración del catálogo
 * - PROPIETARIO       -> panel privado del propietario
 * - ADMINISTRADOR     -> panel de administración
 */
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

  /**
   * Intenta autenticarse contra el backend real (/api/auth/login).
   * Si no se envía contraseña o el backend no está disponible, utiliza el mock.
   */
  login(correo: string, rol: Rol = 'FINAL', nombre?: string, password?: string): Observable<any> {
    const correoNormalizado = correo.trim().toLowerCase();

    if (password) {
      return this.http.post<any>(`${environment.apiUrl}/auth/login`, {
        correo: correoNormalizado,
        contrasena: password
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
          this.registrarCuentaMock(correoNormalizado, sesion.nombre, rolNormalizado);
        }),
        catchError((error) => {
          if (error.status === 401 || error.status === 403) {
            throw error;
          }
          return this.loginMock(correoNormalizado, rol, nombre);
        })
      );
    }

    return this.loginMock(correoNormalizado, rol, nombre);
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
        if (sesion.correo) {
          this.registrarCuentaMock(sesion.correo, sesion.nombre, rolNormalizado);
        }
      })
    );
  }

  private loginMock(correoNormalizado: string, rol: Rol, nombre?: string): Observable<any> {
    const rolNormalizado = normalizarRol(rol);
    const nombreFinal = nombre || correoNormalizado.split('@')[0];

    const mockRespuesta = {
      token: 'mock-jwt-token',
      usuario: {
        id: this.generarIdUsuario(correoNormalizado),
        nombre: nombreFinal,
        correo: correoNormalizado,
        rol: rolNormalizado
      }
    };

    this.guardarSesion(mockRespuesta);
    this.registrarCuentaMock(correoNormalizado, nombreFinal, rolNormalizado);
    return of(mockRespuesta);
  }

  /**
   * Resuelve el rol a partir de las credenciales ingresadas.
   */
  resolverCredenciales(correo: string, password: string): ResultadoCredenciales {
    const correoNormalizado = (correo ?? '').trim().toLowerCase();

    if (correoNormalizado === CREDENCIALES_ADMIN_PRUEBA.correo) {
      return {
        valido: password === CREDENCIALES_ADMIN_PRUEBA.password,
        rol: 'ADMINISTRADOR',
        nombre: 'Administrador'
      };
    }

    const cuenta = this.getCuentasMock()[correoNormalizado];
    if (cuenta) {
      return { valido: true, rol: cuenta.rol, nombre: cuenta.nombre };
    }

    if (this.tieneNegociosRegistrados(correoNormalizado)) {
      return { valido: true, rol: 'PROPIETARIO' };
    }

    return { valido: true, rol: 'FINAL' };
  }

  private generarIdUsuario(correo: string): number {
    let hash = 5381;
    for (let i = 0; i < correo.length; i++) {
      hash = ((hash << 5) + hash + correo.charCodeAt(i)) | 0;
    }
    return Math.abs(hash) % 1000000 || 1;
  }

  private tieneNegociosRegistrados(correo: string): boolean {
    try {
      const id = this.generarIdUsuario(correo);
      const lugares = JSON.parse(localStorage.getItem(LUGARES_STORAGE_KEY) || '[]');
      return Array.isArray(lugares)
        && lugares.some((l: any) => l && l.id > 6 && l.propietarioId === id);
    } catch {
      return false;
    }
  }

  private getCuentasMock(): Record<string, CuentaMock> {
    try {
      return JSON.parse(localStorage.getItem(CUENTAS_MOCK_KEY) || '{}');
    } catch {
      return {};
    }
  }

  private registrarCuentaMock(correo: string, nombre: string, rol: Rol): void {
    const cuentas = this.getCuentasMock();
    cuentas[correo] = { nombre, rol };
    localStorage.setItem(CUENTAS_MOCK_KEY, JSON.stringify(cuentas));
  }

  registrar(usuario: any): Observable<any> {
    const payload = {
      nombre: usuario.nombre,
      correo: (usuario.correo || '').trim().toLowerCase(),
      contrasena: usuario.contrasena || usuario.password,
      tipoUsuario: usuario.tipoUsuario || usuario.rol || 'FINAL'
    };
    return this.http.post<any>(`${environment.apiUrl}/auth/register`, payload).pipe(
      catchError(() => {
        console.log('Simulando registro en frontend (offline):', usuario);
        return of({ success: true, usuario: payload });
      })
    );
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
    return this.getToken() !== null;
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
