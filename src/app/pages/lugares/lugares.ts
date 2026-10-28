import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { LugaresService, Lugar } from '../../services/lugares.service';

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

  constructor(private lugaresService: LugaresService) {}

  ngOnInit(): void {
    this.lugares = this.lugaresService.getLugaresPublicados();
    this.lugaresFiltrados = [...this.lugares];
  }

  filtrar(): void {
    const terminos = this.normalizar(this.textoBusqueda).split(/\s+/).filter(t => t.length > 0);
    this.lugaresFiltrados = this.lugares.filter(l => {
      const textoLugar = this.normalizar(
        `${l.nombre} ${l.direccion} ${this.nombreCategoria(l.categoria)}`
      );
      const coincideTexto = terminos.every(t => textoLugar.includes(t));
      const coincideCategoria = this.categoriaFiltro === 'todas' || l.categoria === this.categoriaFiltro;
      return coincideTexto && coincideCategoria;
    });
  }

  buscar(): void {
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
