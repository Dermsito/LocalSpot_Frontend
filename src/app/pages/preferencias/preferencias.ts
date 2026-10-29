import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { PreferenciasService, PreferenciaDto } from '../../services/preferencias.service';
import { AuthService } from '../../services/auth';

interface CategoriaPreferencia {
  id: string;
  categoriaDbId: number;
  nombre: string;
  icono: string;
  seleccionada: boolean;
  preferenciaId?: number;
}

@Component({
  selector: 'app-preferencias',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './preferencias.html',
  styleUrl: './preferencias.css'
})
export class PreferenciasComponent implements OnInit {

  categorias: CategoriaPreferencia[] = [
    { id: 'restaurantes', categoriaDbId: 1, nombre: 'Restaurantes', icono: '🍽️', seleccionada: false },
    { id: 'cafes', categoriaDbId: 1, nombre: 'Cafeterías & Postres', icono: '☕', seleccionada: false },
    { id: 'bares', categoriaDbId: 2, nombre: 'Bares & Vida Nocturna', icono: '🍸', seleccionada: false },
    { id: 'entretenimiento', categoriaDbId: 2, nombre: 'Entretenimiento', icono: '🎬', seleccionada: false },
    { id: 'cultura', categoriaDbId: 3, nombre: 'Cultura & Arte', icono: '🎨', seleccionada: false },
    { id: 'airelibre', categoriaDbId: 4, nombre: 'Aire Libre & Naturaleza', icono: '🌳', seleccionada: false },
    { id: 'compras', categoriaDbId: 5, nombre: 'Tiendas & Compras', icono: '🛍️', seleccionada: false }
  ];

  cargando = false;
  usuario: any = null;

  constructor(
    private router: Router,
    private preferenciasService: PreferenciasService,
    private auth: AuthService
  ) {}

  ngOnInit(): void {
    this.usuario = this.auth.getUsuario();
    if (this.usuario) {
      this.preferenciasService.obtenerPreferencias().subscribe((prefs: PreferenciaDto[]) => {
        if (prefs && prefs.length > 0) {
          const idsDb = prefs.map(p => p.idCategoria);
          this.categorias.forEach(cat => {
            if (idsDb.includes(cat.categoriaDbId)) {
              cat.seleccionada = true;
            }
          });
        } else {
          this.cargarDesdeLocalStorage();
        }
      });
    } else {
      this.cargarDesdeLocalStorage();
    }
  }

  private cargarDesdeLocalStorage(): void {
    const guardadas = localStorage.getItem('preferencias_usuario');
    if (guardadas) {
      try {
        const ids: string[] = JSON.parse(guardadas);
        this.categorias.forEach(c => {
          c.seleccionada = ids.includes(c.id);
        });
      } catch (e) {}
    }
  }

  toggleCategoria(cat: CategoriaPreferencia) {
    cat.seleccionada = !cat.seleccionada;
  }

  guardarYContinuar() {
    this.cargando = true;
    const elegidas = this.categorias
      .filter(c => c.seleccionada)
      .map(c => c.id);

    localStorage.setItem('preferencias_usuario', JSON.stringify(elegidas));

    // Si hay usuario y token, guardar en backend
    if (this.usuario) {
      const categoriasSeleccionadas = Array.from(new Set(
        this.categorias.filter(c => c.seleccionada).map(c => c.categoriaDbId)
      ));

      let pendientes = categoriasSeleccionadas.length;
      if (pendientes === 0) {
        this.router.navigate(['/lugares']);
        return;
      }

      categoriasSeleccionadas.forEach(dbId => {
        this.preferenciasService.crearPreferencia(dbId, 50000).subscribe({
          next: () => {
            pendientes--;
            if (pendientes <= 0) {
              this.cargando = false;
              this.router.navigate(['/lugares']);
            }
          },
          error: () => {
            pendientes--;
            if (pendientes <= 0) {
              this.cargando = false;
              this.router.navigate(['/lugares']);
            }
          }
        });
      });
    } else {
      this.router.navigate(['/lugares']);
    }
  }
}
