import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

interface Categoria {
  id: string;
  nombre: string;
  icono: string;
  seleccionada: boolean;
}

@Component({
  selector: 'app-preferencias',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './preferencias.html',
  styleUrl: './preferencias.css'
})
export class PreferenciasComponent {

  categorias: Categoria[] = [
    { id: 'restaurantes', nombre: 'Restaurantes', icono: '🍽️', seleccionada: false },
    { id: 'cafes', nombre: 'Cafeterías & Postres', icono: '☕', seleccionada: false },
    { id: 'bares', nombre: 'Bares & Vida Nocturna', icono: '🍸', seleccionada: false },
    { id: 'entretenimiento', nombre: 'Entretenimiento', icono: '🎬', seleccionada: false },
    { id: 'deportes', nombre: 'Deportes & Fitness', icono: '⚽', seleccionada: false },
    { id: 'compras', nombre: 'Tiendas & Compras', icono: '🛍️', seleccionada: false }
  ];

  constructor(private router: Router) {}

  toggleCategoria(cat: Categoria) {
    cat.seleccionada = !cat.seleccionada;
  }

  guardarYContinuar() {
    const elegidas = this.categorias
      .filter(c => c.seleccionada)
      .map(c => c.id);

    localStorage.setItem('preferencias_usuario', JSON.stringify(elegidas));
    this.router.navigate(['/lugares']);
  }
}