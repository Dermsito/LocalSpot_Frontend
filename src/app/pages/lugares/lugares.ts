import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Lugar {
  id: number;
  nombre: string;
  categoria: string;
  calificacion: number;
  direccion: string;
  icono: string;
}

@Component({
  selector: 'app-lugares',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './lugares.html',
  styleUrl: './lugares.css'
})
export class LugaresComponent implements OnInit {
  textoBusqueda: string = '';
  categoriaFiltro: string = 'todas';

  lugares: Lugar[] = [
    { id: 1, nombre: 'Restaurante El Mirador', categoria: 'restaurantes', calificacion: 4.8, direccion: 'Calle 10 # 5-20', icono: '🍽️' },
    { id: 2, nombre: 'Café Central', categoria: 'cafes', calificacion: 4.5, direccion: 'Carrera 7 # 12-40', icono: '☕' },
    { id: 3, nombre: 'Bar La Estación', categoria: 'bares', calificacion: 4.2, direccion: 'Calle 15 # 8-30', icono: '🍸' },
    { id: 4, nombre: 'Cine Olimpo', categoria: 'entretenimiento', calificacion: 4.6, direccion: 'Av. Principal # 45-10', icono: '🎬' },
    { id: 5, nombre: 'Gimnasio Fitness Club', categoria: 'deportes', calificacion: 4.7, direccion: 'Calle 20 # 14-05', icono: '⚽' },
    { id: 6, nombre: 'Plaza Comercial Centro', categoria: 'compras', calificacion: 4.4, direccion: 'Carrera 10 # 10-10', icono: '🛍️' }
  ];

  lugaresFiltrados: Lugar[] = [];

  ngOnInit() {
    const prefGuardadas = localStorage.getItem('preferencias_usuario');
    if (prefGuardadas) {
      const categoriasElegidas: string[] = JSON.parse(prefGuardadas);
      if (categoriasElegidas.length > 0) {
        this.lugaresFiltrados = this.lugares.filter(l => categoriasElegidas.includes(l.categoria));
        return;
      }
    }
    this.lugaresFiltrados = [...this.lugares];
  }

  filtrar() {
    this.lugaresFiltrados = this.lugares.filter(lugar => {
      const coincideNombre = lugar.nombre.toLowerCase().includes(this.textoBusqueda.toLowerCase());
      const coincideCategoria = this.categoriaFiltro === 'todas' || lugar.categoria === this.categoriaFiltro;
      return coincideNombre && coincideCategoria;
    });
  }
}