import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { LugaresService, Lugar } from '../../services/lugares.service';
import { FavoritosService } from '../../services/favoritos.service';
import { AuthService } from '../../services/auth';

interface Categoria {
  valor: string;
  nombre: string;
  icono: string;
}

@Component({
  selector: 'app-lugares',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './lugares.html',
  styleUrls: ['./lugares.css']
})
export class LugaresComponent implements OnInit {
  textoBusqueda = '';
  categoriaFiltro = 'todas';
  modoIa = false;
  buscandoIa = false;
  motivosIa: Record<number, string> = {};
  tieneResultadosIa = false;
  soloFavoritos = false;
  usuario: any = null;

  categorias: Categoria[] = [
    { valor: 'restaurantes', nombre: 'Restaurantes', icono: '🍽️' },
    { valor: 'cafes', nombre: 'Cafeterías', icono: '☕' },
    { valor: 'bares', nombre: 'Bares', icono: '🍸' },
    { valor: 'entretenimiento', nombre: 'Entretenimiento', icono: '🎬' },
    { valor: 'deportes', nombre: 'Deportes', icono: '⚽' },
    { valor: 'compras', nombre: 'Compras', icono: '🛍️' }
  ];

  lugares: Lugar[] = [];
  lugaresFiltrados: Lugar[] = [];

  constructor(
    private lugaresService: LugaresService,
    public favoritosService: FavoritosService,
    private auth: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.usuario = this.auth.getUsuario();
    this.lugares = this.lugaresService.getLugaresPublicados();
    this.lugaresFiltrados = [...this.lugares];

    if (this.usuario) {
      this.favoritosService.cargarFavoritos().subscribe();
    }

    this.lugaresService.cargarLugares().subscribe(lugares => {
      if (lugares && lugares.length > 0) {
        this.lugares = lugares;
        // No sobrescribir si hay resultados de IA activos
        if (!this.tieneResultadosIa) {
          this.filtrar();
        }
      }
    });
  }

  filtrar(): void {
    const terminos = this.normalizar(this.textoBusqueda).split(/\s+/).filter(t => t.length > 0);
    this.lugaresFiltrados = this.lugares.filter(l => {
      const textoLugar = this.normalizar(
        `${l.nombre} ${l.direccion} ${this.nombreCategoria(l.categoria)}`
      );
      const coincideTexto = terminos.every(t => textoLugar.includes(t));
      const coincideCategoria = this.categoriaFiltro === 'todas' || l.categoria === this.categoriaFiltro;
      const coincideFavorito = !this.soloFavoritos || this.favoritosService.esFavorito(l.id);
      return coincideTexto && coincideCategoria && coincideFavorito;
    });
  }

  toggleSoloFavoritos(): void {
    this.soloFavoritos = !this.soloFavoritos;
    this.filtrar();
  }

  toggleModoIa(): void {
    this.modoIa = !this.modoIa;
    this.motivosIa = {};
    this.tieneResultadosIa = false;
    if (!this.modoIa) {
      this.filtrar();
    }
  }

  toggleFavorito(lugarId: number, event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    if (!this.usuario) {
      alert('Inicia sesión para guardar favoritos.');
      return;
    }
    this.favoritosService.toggleFavorito(lugarId).subscribe({
      next: () => {
        if (this.soloFavoritos) {
          this.filtrar();
        }
      }
    });
  }

  buscar(): void {
    if (this.modoIa && this.textoBusqueda.trim()) {
      this.buscandoIa = true;
      this.tieneResultadosIa = false;
      this.lugaresService.buscarConIa(this.textoBusqueda.trim()).subscribe({
        next: (items) => {
          this.buscandoIa = false;
          if (items && items.length > 0) {
            this.motivosIa = {};
            items.forEach(it => {
              this.motivosIa[it.lugar.id] = it.motivoIa;
            });
            // Solo mostrar los lugares recomendados por la IA
            this.lugaresFiltrados = items.map(it => it.lugar);
            this.tieneResultadosIa = true;
          } else {
            this.tieneResultadosIa = false;
            this.filtrar();
          }
          this.cdr.detectChanges();
          document.getElementById('lugares')?.scrollIntoView({ behavior: 'smooth' });
        },
        error: () => {
          this.buscandoIa = false;
          this.tieneResultadosIa = false;
          this.filtrar();
          this.cdr.detectChanges();
          document.getElementById('lugares')?.scrollIntoView({ behavior: 'smooth' });
        }
      });
      return;
    }

    this.tieneResultadosIa = false;
    this.filtrar();
    document.getElementById('lugares')?.scrollIntoView({ behavior: 'smooth' });
  }

  private normalizar(texto: string): string {
    return texto
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  }

  irACategorias(evento: Event): void {
    evento.preventDefault();
    document.getElementById('categorias')?.scrollIntoView({ behavior: 'smooth' });
  }

  seleccionarCategoria(valor: string): void {
    this.categoriaFiltro = this.categoriaFiltro === valor ? 'todas' : valor;
    this.tieneResultadosIa = false;
    this.motivosIa = {};
    this.filtrar();
    document.getElementById('lugares')?.scrollIntoView({ behavior: 'smooth' });
  }

  nombreCategoria(valor: string): string {
    return this.categorias.find(c => c.valor === valor)?.nombre ?? valor;
  }

  estrellas(calificacion: number): boolean[] {
    return [1, 2, 3, 4, 5].map(n => n <= Math.round(calificacion));
  }
}