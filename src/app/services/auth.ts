import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

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
 * No son una cuenta real ni un mecanismo de seguridad: habilitan el panel de
 * administrador durante el desarrollo local. Cuando el backend esté conectado,
 * el rol y la autenticación vendrán del servidor.
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
  constructor() {}

  /**
   * MOCK LOGIN: No usa HttpClient, no usa el backend.
   *
   * IMPORTANTE (integración futura): en producción el rol NO se decide aquí,
   * lo determina el backend en la respuesta del login. El parámetro `rol` es
   * solo del simulador local; al conectar la API se reemplaza por
   * `normalizarRol(respuestaBackend.usuario.rol)`.
   */
  login(correo: string, rol: Rol = 'FINAL', nombre?: string): Observable<any> {
    const correoNormalizado = correo.trim().toLowerCase();
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
   * MOCK: resuelve el rol a partir de las credenciales ingresadas, para que un
   * único formulario de login atienda a todos los roles.
   *
   * Orden de resolución:
   *   1. Credenciales de administrador de prueba -> ADMINISTRADOR
   *   2. Cuentas ya registradas localmente        -> su rol (p. ej. PROPIETARIO)
   *   3. Correo con negocios guardados            -> PROPIETARIO
   *   4. Resto                                    -> FINAL (USUARIO)
   *
   * `valido` solo es false cuando el correo es el del administrador y la
   * contraseña no coincide (los demás roles mantienen el mock abierto).
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

  /**
   * Genera un id estable y único por correo (hash djb2) para que cada
   * propietario solo vea y administre sus propios negocios en el mock.
   */
  private generarIdUsuario(correo: string): number {
    let hash = 5381;
    for (let i = 0; i < correo.length; i++) {
      hash = ((hash << 5) + hash + correo.charCodeAt(i)) | 0;
    }
    return Math.abs(hash) % 1000000 || 1;
  }

  /** ¿El correo ya tiene negocios guardados en el mock? (ids 1-6 son de ejemplo) */
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
    console.log('Simulando registro en frontend:', usuario);
    return of({ success: true });
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

  /** Ruta a la que corresponde el rol de la sesión actual. */
  getRutaInicio(): string {
    return rutaInicialPorRol(this.getRol());
  }

  estaAutenticado(): boolean {
    return this.getToken() !== null;
  }

  private guardarSesion(respuesta: any): void {
    localStorage.setItem(TOKEN_KEY, respuesta.token);
    localStorage.setItem(USUARIO_KEY, JSON.stringify(respuesta.usuario));
  }
}
