import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../services/auth';
import { LugaresService, Lugar, METODOS_PAGO, COMODIDADES, generarResumenHorario, horariosPorDefecto, OpcionCatalogo } from '../../../services/lugares.service';

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
    private lugaresService: LugaresService
  ) {}

  ngOnInit(): void {
    this.usuario = this.auth.getUsuario();
    if (this.usuario) {
      // Recupera los negocios creados antes del id único por correo (propietarioId = 1)
      this.lugaresService.reclamarNegociosHeredados(this.usuario.id);
    }
    this.cargarNegocios();
  }

  cargarNegocios(): void {
    if (this.usuario) {
      this.misNegocios = this.lugaresService.getLugaresPorPropietario(this.usuario.id);
    }
  }

  togglePublicacion(negocio: Lugar): void {
    if (!this.esPropietario(negocio)) {
      alert('No tienes permiso para publicar este establecimiento.');
      return;
    }
    const nuevoEstado = !negocio.publicado;
    this.lugaresService.actualizarLugar(negocio.id, { publicado: nuevoEstado });
    this.cargarNegocios();
    
    if (nuevoEstado) {
      alert(`¡Felicidades! "${negocio.nombre}" ahora es visible en la categoría de ${this.getNombreCategoria(negocio.categoria)}.`);
    } else {
      alert(`"${negocio.nombre}" ha sido retirado de los catálogos públicos.`);
    }
  }

  iniciarEdicion(negocio: Lugar): void {
    if (!this.esPropietario(negocio)) {
      alert('No tienes permiso para editar este establecimiento.');
      return;
    }
    this.editando = true;
    this.negocioEnEdicion = {
      ...negocio,
      fotos: [...(negocio.fotos || [])],
      horarios: negocio.horarios && negocio.horarios.length
        ? negocio.horarios.map(h => ({ ...h }))
        : horariosPorDefecto(),
      pagos: [...(negocio.pagos || [])],
      comodidades: [...(negocio.comodidades || [])]
    };
  }

  private esPropietario(negocio: Lugar): boolean {
    return !!this.usuario && negocio.propietarioId === this.usuario.id;
  }

  cancelarEdicion(): void {
    this.editando = false;
    this.negocioEnEdicion = {};
    this.nuevaFotoUrl = '';
  }

  agregarFoto(): void {
    if (this.nuevaFotoUrl.trim()) {
      if (!this.negocioEnEdicion.fotos) this.negocioEnEdicion.fotos = [];
      this.negocioEnEdicion.fotos.push(this.nuevaFotoUrl.trim());
      this.nuevaFotoUrl = '';
    }
  }

  eliminarFoto(index: number): void {
    this.negocioEnEdicion.fotos.splice(index, 1);
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
      // Actualizar icono basado en categoría por si cambió
      const cat = this.categorias.find(c => c.valor === this.negocioEnEdicion.categoria);
      if (cat) this.negocioEnEdicion.icono = cat.icono;

      // Mantener el resumen de horario sincronizado con el detalle por día
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
