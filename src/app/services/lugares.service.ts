import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, map, catchError } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

export interface HorarioDia {
  dia: string;
  abierto: boolean;
  apertura: string;
  cierre: string;
}

export interface OpcionCatalogo {
  nombre: string;
  icono: string;
}

export const DIAS_SEMANA: string[] = [
  'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'
];

export const METODOS_PAGO: OpcionCatalogo[] = [
  { nombre: 'Efectivo', icono: '💵' },
  { nombre: 'Tarjeta', icono: '💳' },
  { nombre: 'Nequi', icono: '📱' },
  { nombre: 'Daviplata', icono: '📱' },
  { nombre: 'Transferencia', icono: '🏦' },
  { nombre: 'PSE', icono: '🏦' }
];

export const COMODIDADES: OpcionCatalogo[] = [
  { nombre: 'Wi-Fi gratis', icono: '📶' },
  { nombre: 'Parqueadero', icono: '🅿️' },
  { nombre: 'Zona para bicicletas', icono: '🚲' },
  { nombre: 'Accesibilidad', icono: '♿' },
  { nombre: 'Aire acondicionado', icono: '❄️' },
  { nombre: 'Domicilio', icono: '🛵' },
  { nombre: 'Apto para mascotas', icono: '🐾' },
  { nombre: 'Zona al aire libre', icono: '🌳' }
];

/**
 * Id que el antiguo login mock asignaba a TODOS los propietarios (id fijo = 1).
 * Los negocios guardados con este id quedaron "huérfanos" al introducir el id
 * único por correo, por lo que deben reasignarse (ver reclamarNegociosHeredados).
 */
export const PROPIETARIO_LEGACY_ID = 1;

/** Los 6 registros de ejemplo (datos semilla) usan ids pequeños 1..6. */
const ID_MAXIMO_SEMILLA = 6;

export function iconoDeOpcion(catalogo: OpcionCatalogo[], nombre: string): string {
  return catalogo.find(o => o.nombre === nombre)?.icono ?? '✓';
}

export function horariosPorDefecto(): HorarioDia[] {
  return DIAS_SEMANA.map((dia, indice) => ({
    dia,
    abierto: indice < 5,
    apertura: '08:00',
    cierre: '18:00'
  }));
}

/**
 * Construye un resumen legible del horario (ej. "Lunes a Viernes: 08:00 - 18:00").
 * Se usa para el campo `horario` y para la cabecera del negocio publicado.
 */
export function generarResumenHorario(horarios: HorarioDia[]): string {
  const abiertos = (horarios || []).filter(h => h.abierto);
  if (abiertos.length === 0) return 'Cerrado temporalmente';

  const segmentos: string[] = [];
  let i = 0;
  while (i < horarios.length) {
    if (!horarios[i].abierto) { i++; continue; }
    let j = i;
    while (
      j + 1 < horarios.length &&
      horarios[j + 1].abierto &&
      horarios[j + 1].apertura === horarios[i].apertura &&
      horarios[j + 1].cierre === horarios[i].cierre
    ) j++;
    const rango = j > i ? `${horarios[i].dia} a ${horarios[j].dia}` : horarios[i].dia;
    segmentos.push(`${rango}: ${horarios[i].apertura} - ${horarios[i].cierre}`);
    i = j + 1;
  }
  return segmentos.join(' · ');
}

export interface Calificacion {
  usuario: string;
  estrellas: number;
  fecha: string;
  comentario: string;
}

export interface Lugar {
  id: number;
  nombre: string;
  categoria: string;
  calificacion: number;
  direccion: string;
  icono: string;
  descripcion: string;
  horario: string;
  publicado: boolean;
  propietarioId: number;
  latitud?: number;
  longitud?: number;
  // Nuevos campos de personalización
  telefono?: string;
  whatsapp?: string;
  instagram?: string;
  web?: string;
  fotos: string[];
  rangoPrecio?: number; // 1, 2, 3
  horarios?: HorarioDia[];
  pagos?: string[];
  comodidades?: string[];
  calificaciones?: Calificacion[];
}

@Injectable({
  providedIn: 'root'
})
export class LugaresService {
  private LUGARES_KEY = 'localspot_lugares_mock';
  
  private initialLugares: Lugar[] = [
    { 
      id: 1, 
      nombre: 'Restaurante El Mirador', 
      categoria: 'restaurantes', 
      calificacion: 4.8, 
      direccion: 'Calle 10 # 5-20', 
      icono: '🍽️', 
      publicado: true, 
      propietarioId: 0,
      descripcion: 'Disfruta de platos gastronómicos de alta calidad con la mejor vista panorámica de la ciudad.',
      horario: 'Lunes a Domingo: 12:00 - 22:00',
      horarios: DIAS_SEMANA.map(dia => ({ dia, abierto: true, apertura: '12:00', cierre: '22:00' })),
      telefono: '6012345678',
      whatsapp: '573001234567',
      instagram: 'elmirador',
      web: 'https://elmirador.example.com',
      pagos: ['Efectivo', 'Tarjeta', 'Transferencia'],
      comodidades: ['Wi-Fi gratis', 'Parqueadero', 'Zona al aire libre', 'Accesibilidad'],
      rangoPrecio: 3,
      fotos: [
        'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=elegant%20rooftop%20restaurant%20interior&image_size=landscape_4_3',
        'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=gourmet%20food%20plate&image_size=landscape_4_3'
      ]
    },
    { 
      id: 2, 
      nombre: 'Café Central', 
      categoria: 'cafes', 
      calificacion: 4.5, 
      direccion: 'Carrera 7 # 12-40', 
      icono: '☕', 
      publicado: true, 
      propietarioId: 0,
      descripcion: 'Un espacio moderno y acogedor diseñado para amantes del buen café.',
      horario: 'Lunes a Sábado: 08:00 - 20:00',
      horarios: DIAS_SEMANA.map((dia, indice) => ({ dia, abierto: indice < 6, apertura: '08:00', cierre: '20:00' })),
      telefono: '6013456789',
      whatsapp: '573109876543',
      instagram: 'cafecentral',
      web: 'https://cafecentral.example.com',
      pagos: ['Efectivo', 'Tarjeta', 'Nequi'],
      comodidades: ['Wi-Fi gratis', 'Apto para mascotas', 'Zona al aire libre'],
      rangoPrecio: 2,
      fotos: [
        'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=cozy%20coffee%20shop%20interior&image_size=landscape_4_3'
      ]
    },
    { 
      id: 3, 
      nombre: 'Bar La Estación', 
      categoria: 'bares', 
      calificacion: 4.2, 
      direccion: 'Calle 15 # 8-30', 
      icono: '🍸', 
      publicado: true, 
      propietarioId: 0, 
      descripcion: 'Coctelería de autor y música en vivo los fines de semana. Un ambiente industrial único.', 
      horario: 'Martes a Sábado: 16:00 - 02:00', 
      telefono: '6014567890', 
      whatsapp: '573101112131', 
      instagram: 'barlaestacion', 
      web: '', 
      horarios: DIAS_SEMANA.map((dia, i) => ({ dia, abierto: i >= 1 && i <= 5, apertura: '16:00', cierre: '02:00' })), 
      pagos: ['Efectivo', 'Tarjeta', 'Nequi'], 
      comodidades: ['Wi-Fi gratis', 'Zona al aire libre', 'Accesibilidad'], 
      rangoPrecio: 2, 
      fotos: ['https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=industrial%20style%20bar%20interior&image_size=landscape_4_3'] 
    },
    { 
      id: 4, 
      nombre: 'Cine Olimpo', 
      categoria: 'entretenimiento', 
      calificacion: 4.6, 
      direccion: 'Av. Principal # 45-10', 
      icono: '🎬', 
      publicado: true, 
      propietarioId: 0, 
      descripcion: 'Sala de cine con las mejores películas del momento y tecnología de sonido envolvente.', 
      horario: 'Lunes a Domingo: 14:00 - 23:00', 
      telefono: '6015678901', 
      whatsapp: '573102223334', 
      instagram: 'cineolimpo', 
      web: 'https://cineolimpo.example.com', 
      horarios: DIAS_SEMANA.map(dia => ({ dia, abierto: true, apertura: '14:00', cierre: '23:00' })), 
      pagos: ['Efectivo', 'Tarjeta', 'PSE'], 
      comodidades: ['Parqueadero', 'Accesibilidad', 'Aire acondicionado'], 
      rangoPrecio: 2, 
      fotos: ['https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=modern%20cinema%20theater%20hall&image_size=landscape_4_3'] 
    },
    { 
      id: 5, 
      nombre: 'Gimnasio Fitness Club', 
      categoria: 'deportes', 
      calificacion: 4.7, 
      direccion: 'Calle 20 # 14-05', 
      icono: '⚽', 
      publicado: true, 
      propietarioId: 0, 
      descripcion: 'Entrena con equipos de última generación, clases dirigidas y entrenadores certificados.', 
      horario: 'Lunes a Viernes: 05:00 - 22:00 · Sábado: 07:00 - 15:00', 
      telefono: '6016789012', 
      whatsapp: '573103334445', 
      instagram: 'fitnessclub', 
      web: '', 
      horarios: DIAS_SEMANA.map((dia, i) => ({ dia, abierto: i < 6, apertura: i < 5 ? '05:00' : '07:00', cierre: i < 5 ? '22:00' : '15:00' })), 
      pagos: ['Efectivo', 'Tarjeta', 'Transferencia'], 
      comodidades: ['Parqueadero', 'Aire acondicionado', 'Accesibilidad', 'Wi-Fi gratis'], 
      rangoPrecio: 2, 
      fotos: ['https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=modern%20gym%20fitness%20interior&image_size=landscape_4_3'] 
    },
    { 
      id: 6, 
      nombre: 'Plaza Comercial Centro', 
      categoria: 'compras', 
      calificacion: 4.4, 
      direccion: 'Carrera 10 # 10-10', 
      icono: '🛍️', 
      publicado: true, 
      propietarioId: 0, 
      descripcion: 'Más de 50 locales con lo mejor en moda, tecnología y una variada plazoleta de comidas.', 
      horario: 'Lunes a Domingo: 10:00 - 20:00', 
      telefono: '6017890123', 
      whatsapp: '573104445556', 
      instagram: 'plazacentro', 
      web: '', 
      horarios: DIAS_SEMANA.map(dia => ({ dia, abierto: true, apertura: '10:00', cierre: '20:00' })), 
      pagos: ['Efectivo', 'Tarjeta', 'PSE', 'Nequi'], 
      comodidades: ['Parqueadero', 'Wi-Fi gratis', 'Accesibilidad', 'Aire acondicionado'], 
      rangoPrecio: 2, 
      fotos: ['https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=modern%20shopping%20mall%20interior&image_size=landscape_4_3'] 
    }
  ];

  private lugaresSubject = new BehaviorSubject<Lugar[]>(this.loadLugares());
  lugares$ = this.lugaresSubject.asObservable();

  constructor(private http: HttpClient) {}

  cargarLugares(): Observable<Lugar[]> {
    return this.http.get<any>(`${environment.apiUrl}/lugares?size=50`).pipe(
      map((res: any) => {
        const content = res?.content;
        if (Array.isArray(content) && content.length > 0) {
          const adaptados: Lugar[] = content.map((b: any) => ({
            id: b.idLugar,
            nombre: b.nombre,
            categoria: this.mapearCategoria(b.nombreCategoria || b.idCategoria),
            calificacion: b.promedioCalificacion || 4.5,
            direccion: b.direccion || 'Ubicación local',
            icono: this.getIconoPorCategoria(this.mapearCategoria(b.nombreCategoria || b.idCategoria)),
            descripcion: b.descripcion || '',
            horario: b.horario || 'Lunes a Domingo: 10:00 - 20:00',
            publicado: true,
            propietarioId: b.idPropietario || 0,
            latitud: b.latitud ? Number(b.latitud) : 4.3372,
            longitud: b.longitud ? Number(b.longitud) : -74.3640,
            fotos: b.fotos && b.fotos.length > 0 
              ? b.fotos.map((f: any) => typeof f === 'string' ? f : f.urlFoto) 
              : [`https://picsum.photos/seed/lugar${b.idLugar}/800/600`],
            rangoPrecio: b.precioMax ? (b.precioMax > 50000 ? 3 : b.precioMax > 20000 ? 2 : 1) : 2,
            telefono: '3001234567',
            whatsapp: '573001234567',
            instagram: 'localspot',
            web: '',
            horarios: horariosPorDefecto(),
            pagos: ['Efectivo', 'Tarjeta'],
            comodidades: ['Wi-Fi gratis', 'Zona al aire libre']
          }));
          this.saveLugares(adaptados);
          return adaptados;
        }
        return this.getLugaresPublicados();
      }),
      catchError(() => of(this.getLugaresPublicados()))
    );
  }

  buscarConIa(consulta: string): Observable<{ lugar: Lugar; motivoIa: string }[]> {
    return this.http.post<any[]>(`${environment.apiUrl}/lugares/buscar-ia`, { consulta }).pipe(
      map((items: any[]) => {
        if (!Array.isArray(items)) return [];
        return items.map((item: any) => {
          const b = item.lugar;
          const adaptado: Lugar = {
            id: b.idLugar,
            nombre: b.nombre,
            categoria: this.mapearCategoria(b.nombreCategoria || b.idCategoria),
            calificacion: b.promedioCalificacion || 4.5,
            direccion: b.direccion || 'Ubicación local',
            icono: this.getIconoPorCategoria(this.mapearCategoria(b.nombreCategoria || b.idCategoria)),
            descripcion: b.descripcion || '',
            horario: b.horario || 'Lunes a Domingo: 10:00 - 20:00',
            publicado: true,
            propietarioId: b.idPropietario || 0,
            latitud: b.latitud ? Number(b.latitud) : 4.3372,
            longitud: b.longitud ? Number(b.longitud) : -74.3640,
            fotos: b.fotos && b.fotos.length > 0
              ? b.fotos.map((f: any) => typeof f === 'string' ? f : f.urlFoto)
              : [`https://picsum.photos/seed/lugar${b.idLugar}/800/600`],
            rangoPrecio: b.precioMax ? (b.precioMax > 50000 ? 3 : b.precioMax > 20000 ? 2 : 1) : 2,
            telefono: '3001234567',
            whatsapp: '573001234567',
            instagram: 'localspot',
            web: '',
            horarios: horariosPorDefecto(),
            pagos: ['Efectivo', 'Tarjeta'],
            comodidades: ['Wi-Fi gratis', 'Zona al aire libre']
          };
          return {
            lugar: adaptado,
            motivoIa: item.motivoIa
          };
        });
      }),
      catchError((err) => {
        console.warn('Error en búsqueda con IA:', err);
        return of([]);
      })
    );
  }

  private mapearCategoria(nombreOId: any): string {
    const val = String(nombreOId || '').toLowerCase();
    if (val.includes('restaurante') || val === '1') return 'restaurantes';
    if (val.includes('cafe') || val.includes('cafeteria')) return 'cafes';
    if (val.includes('bar')) return 'bares';
    if (val.includes('entretenimiento') || val.includes('cine') || val === '2') return 'entretenimiento';
    if (val.includes('deporte')) return 'deportes';
    if (val.includes('compra') || val.includes('tienda') || val === '5') return 'compras';
    if (val.includes('cultural') || val.includes('arte') || val === '3') return 'entretenimiento';
    if (val.includes('naturaleza') || val.includes('aire') || val === '4') return 'entretenimiento';
    return 'restaurantes';
  }

  private loadLugares(): Lugar[] {
    const saved = localStorage.getItem(this.LUGARES_KEY);
    if (!saved) {
      return this.initialLugares.map(l => this.normalizarLugar(l));
    }
    try {
      const parsed = JSON.parse(saved);
      if (!Array.isArray(parsed)) return this.initialLugares;

      // Unimos los datos guardados con los iniciales (semilla)
      // Si el ID es <= 6, forzamos que use la información rica definida en el código
      // para restaurar lo que el usuario reportó como perdido.
      const normalizados = parsed.map(l => {
        const baseSemilla = this.initialLugares.find(s => s.id === l.id);
        if (baseSemilla && l.id <= ID_MAXIMO_SEMILLA) {
          // Restauramos la información de contacto, fotos, horarios etc. del código
          return this.normalizarLugar({ ...l, ...baseSemilla });
        }
        return this.normalizarLugar(l);
      });

      // Aseguramos que si faltan semillas en el localStorage, se agreguen
      this.initialLugares.forEach(semilla => {
        if (!normalizados.find(n => n.id === semilla.id)) {
          normalizados.push(this.normalizarLugar(semilla));
        }
      });

      return normalizados.sort((a, b) => a.id - b.id);
    } catch {
      return this.initialLugares;
    }
  }

  /**
   * Completa los campos nuevos que un registro antiguo pudiera no tener.
   * Es aditivo: conserva TODAS las propiedades originales (spread) y no elimina datos.
   */
  private normalizarLugar(l: any): Lugar {
    return {
      ...l,
      publicado: l.publicado === undefined ? true : l.publicado,
      fotos: Array.isArray(l.fotos) ? l.fotos : [],
      rangoPrecio: l.rangoPrecio ?? 2,
      telefono: l.telefono ?? '',
      whatsapp: l.whatsapp ?? '',
      instagram: l.instagram ?? '',
      web: l.web ?? '',
      descripcion: l.descripcion ?? '',
      horario: l.horario ?? '',
      propietarioId: typeof l.propietarioId === 'number' ? l.propietarioId : PROPIETARIO_LEGACY_ID,
      horarios: Array.isArray(l.horarios) ? l.horarios : [],
      pagos: Array.isArray(l.pagos) ? l.pagos : [],
      comodidades: Array.isArray(l.comodidades) ? l.comodidades : [],
      calificaciones: Array.isArray(l.calificaciones) ? l.calificaciones : []
    };
  }

  private saveLugares(lugares: Lugar[]): void {
    localStorage.setItem(this.LUGARES_KEY, JSON.stringify(lugares));
    this.lugaresSubject.next(lugares);
  }

  /**
   * Agrega una nueva reseña a un establecimiento.
   * Calcula automáticamente el nuevo promedio de calificación.
   */
  agregarResena(lugarId: number, reseña: Calificacion): void {
    const lugares = this.lugaresSubject.value.map(l => {
      if (l.id === lugarId) {
        const nuevasCalificaciones = [...(l.calificaciones || []), reseña];
        // Calcular nuevo promedio
        const suma = nuevasCalificaciones.reduce((acc, c) => acc + c.estrellas, 0);
        const nuevoPromedio = parseFloat((suma / nuevasCalificaciones.length).toFixed(1));
        
        return { 
          ...l, 
          calificaciones: nuevasCalificaciones,
          calificacion: nuevoPromedio
        };
      }
      return l;
    });
    this.saveLugares(lugares);
  }

  /**
   * Recupera los negocios "heredados": aquellos creados cuando el login mock
   * asignaba siempre el id 1 a todos los propietarios. Se reasignan al
   * propietario actual en cuanto inicia sesión, de forma que vuelven a aparecer
   * en su panel sin perder fotos, descripciones ni ningún otro dato.
   *
   * Es idempotente y auto-limitante: una vez reasignados dejan de valer
   * PROPIETARIO_LEGACY_ID, por lo que no se vuelven a mover. No elimina ni
   * sobrescribe información; solo cambia el dueño de esos registros.
   *
   * @returns cuántos negocios fueron reasignados.
   */
  reclamarNegociosHeredados(propietarioId: number): number {
    if (!propietarioId || propietarioId === PROPIETARIO_LEGACY_ID) return 0;

    const lugares = this.lugaresSubject.value;
    let reasignados = 0;
    const actualizados = lugares.map(l => {
      const esHeredado =
        l.propietarioId === PROPIETARIO_LEGACY_ID && l.id > ID_MAXIMO_SEMILLA;
      if (esHeredado) {
        reasignados++;
        return { ...l, propietarioId };
      }
      return l;
    });

    if (reasignados > 0) {
      this.saveLugares(actualizados);
      console.info(
        `[LocalSpot] Se recuperaron ${reasignados} negocio(s) heredado(s) para el propietario ${propietarioId}.`
      );
    }
    return reasignados;
  }

  getLugaresPublicados(): Lugar[] {
    return this.lugaresSubject.value.filter(l => l.publicado);
  }

  /** Lista completa de establecimientos (usado por el panel de administración). */
  getTodosLosLugares(): Lugar[] {
    return this.lugaresSubject.value;
  }

  getLugaresPorPropietario(propietarioId: number): Lugar[] {
    return this.lugaresSubject.value.filter(l => l.propietarioId === propietarioId);
  }

  getLugarById(id: number): Lugar | undefined {
    return this.lugaresSubject.value.find(l => l.id === id);
  }

  agregarLugar(lugar: Partial<Lugar>): void {
    const lugares = this.lugaresSubject.value;
    const nuevoLugar: Lugar = {
      id: Date.now(),
      nombre: lugar.nombre || '',
      categoria: lugar.categoria || 'restaurantes',
      calificacion: 0,
      direccion: lugar.direccion || '',
      icono: this.getIconoPorCategoria(lugar.categoria || ''),
      descripcion: lugar.descripcion || '',
      horario: lugar.horario || '',
      publicado: false,
      propietarioId: lugar.propietarioId || 0,
      fotos: lugar.fotos || [],
      rangoPrecio: lugar.rangoPrecio || 2,
      telefono: lugar.telefono || '',
      whatsapp: lugar.whatsapp || '',
      instagram: lugar.instagram || '',
      web: lugar.web || '',
      horarios: lugar.horarios || horariosPorDefecto(),
      pagos: lugar.pagos || ['Efectivo', 'Tarjeta'],
      comodidades: lugar.comodidades || []
    };
    this.saveLugares([...lugares, nuevoLugar]);
  }

  actualizarLugar(id: number, cambios: Partial<Lugar>): void {
    const lugares = this.lugaresSubject.value.map(l => 
      l.id === id ? { ...l, ...cambios } : l
    );
    this.saveLugares(lugares);
  }

  private getIconoPorCategoria(categoria: string): string {
    const iconos: any = {
      'restaurantes': '🍽️',
      'cafes': '☕',
      'bares': '🍸',
      'entretenimiento': '🎬',
      'deportes': '⚽',
      'compras': '🛍️'
    };
    return iconos[categoria] || '📍';
  }
}
