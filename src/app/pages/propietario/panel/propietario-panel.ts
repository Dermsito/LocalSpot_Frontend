import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from '../../../services/auth';
import {
  LugaresService,
  Lugar,
  METODOS_PAGO,
  COMODIDADES,
  generarResumenHorario,
  horariosPorDefecto,
  OpcionCatalogo
} from '../../../services/lugares.service';
import { EstablecimientosService } from '../../../services/establecimientos.service';
import { MapaComponent } from '../../../shared/mapa/mapa.component';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-propietario-panel',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, MapaComponent],
  templateUrl: './propietario-panel.html',
  styleUrls: ['./propietario-panel.css']
})
export class PropietarioPanelComponent implements OnInit {
  usuario: any = null;
  misNegocios: Lugar[] = [];
  cargando = false;
  editando = false;
  negocioEnEdicion: any = {};
  nuevaFotoUrl = '';

  categorias = [
    { valor: 'restaurantes', nombre: 'Restaurantes', icono: '🍽️', dbId: 1 },
    { valor: 'cafes', nombre: 'Cafeterías', icono: '☕', dbId: 1 },
    { valor: 'bares', nombre: 'Bares', icono: '🍸', dbId: 2 },
    { valor: 'entretenimiento', nombre: 'Entretenimiento', icono: '🎬', dbId: 2 },
    { valor: 'deportes', nombre: 'Deportes', icono: '⚽', dbId: 4 },
    { valor: 'compras', nombre: 'Compras', icono: '🛍️', dbId: 5 }
  ];

  metodosPago: OpcionCatalogo[] = METODOS_PAGO;
  comodidadesDisponibles: OpcionCatalogo[] = COMODIDADES;

  constructor(
    private auth: AuthService,
    private lugaresService: LugaresService,
    private establecimientosService: EstablecimientosService,
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.usuario = this.auth.getUsuario();
    this.misNegocios = [];
    this.cargarNegocios();
  }

  private getAuthHeaders(): HttpHeaders {
    const token = this.auth.getToken() || localStorage.getItem('token') || '';
    return token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : new HttpHeaders();
  }

  cargarNegocios(): void {
    if (!this.usuario || !this.usuario.id) {
      this.misNegocios = [];
      return;
    }

    const idPropietarioActual = Number(this.usuario.id);
    this.cargando = true;

    this.establecimientosService.obtenerMisLugares().subscribe({
      next: (backendLugares) => {
        this.cargando = false;
        if (Array.isArray(backendLugares) && backendLugares.length > 0) {
          this.misNegocios = backendLugares
            .filter(b => b.idPropietario != null && Number(b.idPropietario) === idPropietarioActual)
            .map(b => ({
              id: b.idLugar,
              nombre: b.nombre,
              categoria: this.mapearCategoria(b.idCategoria),
              calificacion: 5.0,
              direccion: b.direccion || 'Ubicación local',
              icono: this.getIconoPorCategoria(this.mapearCategoria(b.idCategoria)),
              descripcion: b.descripcion || '',
              horario: b.horario || 'Lunes a Domingo: 10:00 - 20:00',
              publicado: b.estadoVerificacion === 'VERIFICADO',
              propietarioId: Number(b.idPropietario),
              latitud: b.latitud ? Number(b.latitud) : 4.3372,
              longitud: b.longitud ? Number(b.longitud) : -74.3640,
              fotos: [`https://picsum.photos/seed/lugar${b.idLugar}/800/600`],
              rangoPrecio: b.precioMax ? (b.precioMax > 50000 ? 3 : b.precioMax > 20000 ? 2 : 1) : 2,
              telefono: '3001234567',
              whatsapp: '573001234567',
              instagram: 'localspot',
              web: '',
              horarios: horariosPorDefecto(),
              pagos: ['Efectivo', 'Tarjeta'],
              comodidades: ['Wi-Fi gratis', 'Zona al aire libre']
            }));
        } else {
          this.misNegocios = [];
        }
        this.cdr.detectChanges();
      },
      error: () => {
        this.cargando = false;
        this.misNegocios = [];
        this.cdr.detectChanges();
      }
    });
  }

  onCoordenadasCambio(coords: { lat: number; lng: number }): void {
    this.negocioEnEdicion.latitud = coords.lat;
    this.negocioEnEdicion.longitud = coords.lng;
  }

  private mapearCategoria(id: number): string {
    const mapa: Record<number, string> = {
      1: 'restaurantes',
      2: 'entretenimiento',
      3: 'entretenimiento',
      4: 'deportes',
      5: 'compras'
    };
    return mapa[id] || 'restaurantes';
  }

  private getIconoPorCategoria(categoria: string): string {
    const iconos: Record<string, string> = {
      restaurantes: '🍽️',
      cafes: '☕',
      bares: '🍸',
      entretenimiento: '🎬',
      deportes: '⚽',
      compras: '🛍️'
    };
    return iconos[categoria] || '📍';
  }

  esPropietario(negocio: Lugar): boolean {
    return Boolean(this.usuario && negocio.propietarioId && Number(negocio.propietarioId) === Number(this.usuario.id));
  }

  editar(negocio: Lugar): void {
    if (!this.esPropietario(negocio)) {
      alert('Solo puedes editar tus propios establecimientos.');
      return;
    }
    this.negocioEnEdicion = {
      ...negocio,
      latitud: negocio.latitud ? Number(negocio.latitud) : 4.3372,
      longitud: negocio.longitud ? Number(negocio.longitud) : -74.3640,
      fotos: [...(negocio.fotos || [])],
      horarios: negocio.horarios ? JSON.parse(JSON.stringify(negocio.horarios)) : horariosPorDefecto(),
      pagos: [...(negocio.pagos || [])],
      comodidades: [...(negocio.comodidades || [])]
    };
    this.editando = true;
  }

  iniciarEdicion(negocio: Lugar): void {
    this.editar(negocio);
  }

  cancelarEdicion(): void {
    this.editando = false;
    this.negocioEnEdicion = {};
  }

  agregarFoto(): void {
    if (this.nuevaFotoUrl && this.nuevaFotoUrl.trim()) {
      if (!this.negocioEnEdicion.fotos) this.negocioEnEdicion.fotos = [];
      this.negocioEnEdicion.fotos.push(this.nuevaFotoUrl.trim());
      this.nuevaFotoUrl = '';
    }
  }

  eliminarFoto(index: number): void {
    if (this.negocioEnEdicion.fotos) {
      this.negocioEnEdicion.fotos.splice(index, 1);
    }
  }

  tienePago(nombre: string): boolean {
    return (this.negocioEnEdicion.pagos || []).includes(nombre);
  }

  togglePago(nombre: string): void {
    if (!this.negocioEnEdicion.pagos) this.negocioEnEdicion.pagos = [];
    const index = this.negocioEnEdicion.pagos.indexOf(nombre);
    if (index >= 0) {
      this.negocioEnEdicion.pagos.splice(index, 1);
    } else {
      this.negocioEnEdicion.pagos.push(nombre);
    }
  }

  tieneComodidad(nombre: string): boolean {
    return (this.negocioEnEdicion.comodidades || []).includes(nombre);
  }

  toggleComodidad(nombre: string): void {
    if (!this.negocioEnEdicion.comodidades) this.negocioEnEdicion.comodidades = [];
    const index = this.negocioEnEdicion.comodidades.indexOf(nombre);
    if (index >= 0) {
      this.negocioEnEdicion.comodidades.splice(index, 1);
    } else {
      this.negocioEnEdicion.comodidades.push(nombre);
    }
  }

  guardarCambios(): void {
    if (!this.negocioEnEdicion.id) return;
    if (!this.esPropietario(this.negocioEnEdicion)) {
      alert('No tienes permiso para modificar este establecimiento.');
      return;
    }

    const cat = this.categorias.find(c => c.valor === this.negocioEnEdicion.categoria) || this.categorias[0];
    this.negocioEnEdicion.icono = cat.icono;
    this.negocioEnEdicion.horario = generarResumenHorario(this.negocioEnEdicion.horarios || []);

    const url = `${environment.apiUrl}/establecimientos/${this.negocioEnEdicion.id}`;
    const payload = {
      nombre: this.negocioEnEdicion.nombre,
      descripcion: this.negocioEnEdicion.descripcion || '',
      direccion: this.negocioEnEdicion.direccion || '',
      horario: this.negocioEnEdicion.horario || '',
      idCategoria: cat.dbId,
      latitud: this.negocioEnEdicion.latitud,
      longitud: this.negocioEnEdicion.longitud,
      precioMin: 0,
      precioMax: this.negocioEnEdicion.rangoPrecio === 3 ? 60000 : this.negocioEnEdicion.rangoPrecio === 2 ? 30000 : 15000
    };

    this.http.put<any>(url, payload, { headers: this.getAuthHeaders() }).subscribe({
      next: () => {
        this.lugaresService.actualizarLugar(this.negocioEnEdicion.id, this.negocioEnEdicion);
        this.lugaresService.cargarLugares().subscribe();
        this.editando = false;
        this.cargarNegocios();
        alert('Ubicación y datos de tu negocio actualizados correctamente.');
      },
      error: (err) => {
        alert(err?.error?.message || 'Error al guardar los cambios en el servidor.');
      }
    });
  }

  getNombreCategoria(valor: string): string {
    return this.categorias.find(c => c.valor === valor)?.nombre || valor;
  }

  logout(): void {
    this.misNegocios = [];
    this.auth.logout();
  }
}
