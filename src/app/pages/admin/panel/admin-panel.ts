import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../services/auth';
import { LugaresService, Lugar } from '../../../services/lugares.service';

interface Categoria {
  valor: string;
  nombre: string;
  icono: string;
}

@Component({
  selector: 'app-admin-panel',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './admin-panel.html',
  styleUrls: ['./admin-panel.css']
})
export class AdminPanelComponent implements OnInit {
  usuario: any = null;
  negocios: Lugar[] = [];

  // Filtros
  busqueda = '';
  filtroCategoria = 'todas';
  filtroEstado = 'todos';

  // Edición
  editando = false;
  negocioEnEdicion: any = {};

  categorias: Categoria[] = [
    { valor: 'restaurantes', nombre: 'Restaurantes', icono: '🍽️' },
    { valor: 'cafes', nombre: 'Cafeterías', icono: '☕' },
    { valor: 'bares', nombre: 'Bares', icono: '🍸' },
    { valor: 'entretenimiento', nombre: 'Entretenimiento', icono: '🎬' },
    { valor: 'deportes', nombre: 'Deportes', icono: '⚽' },
    { valor: 'compras', nombre: 'Compras', icono: '🛍️' }
  ];

  constructor(
    private auth: AuthService,
    private lugaresService: LugaresService
  ) {}

  ngOnInit(): void {
    this.usuario = this.auth.getUsuario();
    this.lugaresService.lugares$.subscribe(lugares => {
      this.negocios = lugares;
    });
  }

  get negociosFiltrados(): Lugar[] {
    const q = this.busqueda.trim().toLowerCase();
    return this.negocios.filter(n => {
      const coincideTexto = !q
        || n.nombre.toLowerCase().includes(q)
        || (n.direccion || '').toLowerCase().includes(q);

      const coincideCategoria = this.filtroCategoria === 'todas'
        || n.categoria === this.filtroCategoria;

      const coincideEstado = this.filtroEstado === 'todos'
        || (this.filtroEstado === 'publicados' && n.publicado)
        || (this.filtroEstado === 'borradores' && !n.publicado);

      return coincideTexto && coincideCategoria && coincideEstado;
    });
  }

  get totalPublicados(): number {
    return this.negocios.filter(n => n.publicado).length;
  }

  get totalBorradores(): number {
    return this.negocios.filter(n => !n.publicado).length;
  }

  getNombreCategoria(valor: string): string {
    return this.categorias.find(c => c.valor === valor)?.nombre || valor;
  }

  limpiarFiltros(): void {
    this.busqueda = '';
    this.filtroCategoria = 'todas';
    this.filtroEstado = 'todos';
  }

  iniciarEdicion(negocio: Lugar): void {
    this.editando = true;
    this.negocioEnEdicion = { ...negocio };
  }

  cancelarEdicion(): void {
    this.editando = false;
    this.negocioEnEdicion = {};
  }

  guardarCambios(): void {
    if (!this.negocioEnEdicion.id) return;

    const cat = this.categorias.find(c => c.valor === this.negocioEnEdicion.categoria);
    this.lugaresService.actualizarLugar(this.negocioEnEdicion.id, {
      nombre: this.negocioEnEdicion.nombre,
      categoria: this.negocioEnEdicion.categoria,
      direccion: this.negocioEnEdicion.direccion,
      telefono: this.negocioEnEdicion.telefono,
      descripcion: this.negocioEnEdicion.descripcion,
      icono: cat ? cat.icono : this.negocioEnEdicion.icono
    });

    this.editando = false;
    this.negocioEnEdicion = {};
    alert('Establecimiento actualizado correctamente.');
  }

  togglePublicacion(negocio: Lugar): void {
    this.lugaresService.actualizarLugar(negocio.id, { publicado: !negocio.publicado });
  }

  logout(): void {
    this.auth.logout();
  }
}
