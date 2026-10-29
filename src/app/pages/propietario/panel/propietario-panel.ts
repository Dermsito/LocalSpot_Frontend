import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../services/auth';
import { LugaresService, Lugar, METODOS_PAGO, COMODIDADES, generarResumenHorario, horariosPorDefecto, OpcionCatalogo } from '../../../services/lugares.service';
import { EstablecimientosService, EstablecimientoResponse } from '../../../services/establecimientos.service';

@Component({
  selector: 'app-propietario-panel',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './propietario-panel.html',
  styleUrls: ['./propietario-panel.css']
})
export class PropietarioPanelComponent implements OnInit {
  usuario: any = null;
  misNegocios: Lugar[] = [];
  editando = false;
  negocioEnEdicion: any = {};
  nuevaFotoUrl = '';

  categorias = [
    { valor: 'restaurantes', nombre: 'Restaurantes', icono: '🍽️' },
    { valor: 'cafes', nombre: 'Cafeterías', icono: '☕' },
    { valor: 'bares', nombre: 'Bares', icono: '🍸' },
    { valor: 'entretenimiento', nombre: 'Entretenimiento', icono: '🎬' },
    { valor: 'deportes', nombre: 'Deportes', icono: '⚽' },
    { valor: 'compras', nombre: 'Compras', icono: '🛍️' }
  ];

  metodosPago: OpcionCatalogo[] = METODOS_PAGO;
  comodidadesDisponibles: OpcionCatalogo[] = COMODIDADES;

  constructor(
    private auth: AuthService,
    private lugaresService: LugaresService,
    private establecimientosService: EstablecimientosService
  ) {}

  ngOnInit(): void {
    this.usuario = this.auth.getUsuario();
    if (this.usuario) {
      this.lugaresService.reclamarNegociosHeredados(this.usuario.id);
    }
    this.cargarNegocios();
  }

  cargarNegocios(): void {
    if (this.usuario) {
      // 1. Cargar desde backend si es PROPIETARIO
      this.establecimientosService.obtenerMisLugares().subscribe(backendLugares => {
        if (backendLugares && backendLugares.length > 0) {
          const adaptados: Lugar[] = backendLugares.map(b => ({
            id: b.idLugar,
            nombre: b.nombre,
            categoria: this.mapearCategoria(b.idCategoria),
            calificacion: 5.0,
            direccion: b.direccion || 'Ubicación local',
            icono: this.getIconoPorCategoria(this.mapearCategoria(b.idCategoria)),
            descripcion: b.descripcion || '',
            horario: b.horario || 'Lunes a Domingo: 10:00 - 20:00',
            publicado: b.estadoVerificacion === 'VERIFICADO',
            propietarioId: b.idPropietario,
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
          this.misNegocios = adaptados;
        } else {
          this.misNegocios = this.lugaresService.getLugaresPorPropietario(this.usuario.id);
        }
      });
    }
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

  togglePublicacion(negocio: Lugar): void {
    if (!this.esPropietario(negocio)) {
      alert('No tienes permiso para publicar este establecimiento.');
      return;
    }
    const nuevoEstado = !negocio.publicado;
    this.lugaresService.actualizarLugar(negocio.id, { publicado: nuevoEstado });
    negocio.publicado = nuevoEstado;
  }

  esPropietario(negocio: Lugar): boolean {
    return this.usuario && negocio.propietarioId === this.usuario.id;
  }

  editar(negocio: Lugar): void {
    if (!this.esPropietario(negocio)) {
      alert('Solo puedes editar tus propios establecimientos.');
      return;
    }
    this.negocioEnEdicion = { 
      ...negocio,
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
    if (this.negocioEnEdicion.id) {
      if (!this.esPropietario(this.negocioEnEdicion)) {
        alert('No tienes permiso para modificar este establecimiento.');
        return;
      }
      const cat = this.categorias.find(c => c.valor === this.negocioEnEdicion.categoria);
      if (cat) this.negocioEnEdicion.icono = cat.icono;

      this.negocioEnEdicion.horario = generarResumenHorario(this.negocioEnEdicion.horarios || []);

      this.lugaresService.actualizarLugar(this.negocioEnEdicion.id, this.negocioEnEdicion);
      this.editando = false;
      this.cargarNegocios();
      alert('Toda la información de tu negocio ha sido actualizada correctamente.');
    }
  }

  getNombreCategoria(valor: string): string {
    return this.categorias.find(c => c.valor === valor)?.nombre || valor;
  }

  logout(): void {
    this.auth.logout();
  }
}
