import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from '../../../services/auth';
import { LugaresService, Lugar } from '../../../services/lugares.service';
import { environment } from '../../../../environments/environment';

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
    private lugaresService: LugaresService,
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.usuario = this.auth.getUsuario();
    this.cargarTodosLosLugaresAdmin();
  }

  private getAuthHeaders(): HttpHeaders {
    const token = this.auth.getToken() || localStorage.getItem('token') || '';
    return token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : new HttpHeaders();
  }

  cargarTodosLosLugaresAdmin(): void {
    const url = `${environment.apiUrl}/admin/lugares?page=0&size=100`;
    this.http.get<any>(url, { headers: this.getAuthHeaders() }).subscribe({
      next: (resp) => {
        const lista = Array.isArray(resp) ? resp : (resp?.content || []);
        this.negocios = lista.map((item: any) => this.mapearLugarAdmin(item));
        this.cdr.detectChanges();
      },
      error: () => {
        this.lugaresService.lugares$.subscribe(lugares => {
          this.negocios = lugares;
          this.cdr.detectChanges();
        });
      }
    });
  }

  private mapearLugarAdmin(item: any): any {
    const mapCat: Record<number, { valor: string; icono: string }> = {
      1: { valor: 'restaurantes', icono: '🍽️' },
      2: { valor: 'entretenimiento', icono: '🎬' },
      3: { valor: 'entretenimiento', icono: '🎨' },
      4: { valor: 'deportes', icono: '⚽' },
      5: { valor: 'compras', icono: '🛍️' }
    };
    const cat = mapCat[Number(item.idCategoria)] || { valor: 'restaurantes', icono: '🏪' };
    return {
      id: Number(item.idLugar),
      nombre: item.nombre || '',
      categoria: cat.valor,
      icono: cat.icono,
      direccion: item.direccion || '',
      descripcion: item.descripcion || '',
      telefono: '',
      horario: item.horario || '',
      calificacion: 4.5,
      fotos: [],
      rating: 4.5,
      resenas: 0,
      latitud: item.latitud,
      longitud: item.longitud,
      propietarioId: item.idPropietario,
      publicado: item.estadoVerificacion === 'VERIFICADO'
    } as Lugar;
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
    const nuevoEstado = negocio.publicado ? 'RECHAZADO' : 'VERIFICADO';
    const url = `${environment.apiUrl}/admin/lugares/${negocio.id}/verificacion`;

    this.http.patch(url, { estado: nuevoEstado }, { headers: this.getAuthHeaders() }).subscribe({
      next: () => {
        negocio.publicado = !negocio.publicado;
        this.lugaresService.actualizarLugar(negocio.id, { publicado: negocio.publicado });
        this.cdr.detectChanges();
      },
      error: (err) => {
        alert(err?.error?.message || 'No se pudo actualizar el estado de verificación.');
      }
    });
  }

  logout(): void {
    this.auth.logout();
  }
}
