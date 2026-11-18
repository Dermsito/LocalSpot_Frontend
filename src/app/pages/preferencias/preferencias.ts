import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
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

interface RangoPrecio {
  valor: number;
  etiqueta: string;
  icono: string;
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
    { id: 'comida', categoriaDbId: 1, nombre: 'Comida', icono: '🍽️', seleccionada: false },
    { id: 'entretenimiento', categoriaDbId: 2, nombre: 'Entretenimiento', icono: '🎬', seleccionada: false },
    { id: 'cultura', categoriaDbId: 3, nombre: 'Cultura', icono: '🎨', seleccionada: false },
    { id: 'airelibre', categoriaDbId: 4, nombre: 'Aire Libre', icono: '🌳', seleccionada: false },
    { id: 'compras', categoriaDbId: 5, nombre: 'Compras', icono: '🛍️', seleccionada: false }
  ];

  rangosPrecio: RangoPrecio[] = [
    { valor: 20000, etiqueta: 'Económico', icono: '💰' },
    { valor: 50000, etiqueta: 'Medio', icono: '💳' },
    { valor: 150000, etiqueta: 'Premium', icono: '✨' }
  ];

  presupuestoSeleccionado = 50000;
  cargando = false;
  guardado = false;
  usuario: any = null;
  tienePreferenciasGuardadas = false;

  constructor(
    public router: Router,
    private preferenciasService: PreferenciasService,
    private auth: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.usuario = this.auth.getUsuario();
    if (this.usuario) {
      this.preferenciasService.obtenerPreferencias().subscribe((prefs: PreferenciaDto[]) => {
        if (prefs && prefs.length > 0) {
          this.tienePreferenciasGuardadas = true;
          // Usar el presupuesto de la primera preferencia guardada
          this.presupuestoSeleccionado = prefs[0].presupuestoMax || 50000;
          const idsDb = prefs.map(p => p.idCategoria);
          this.categorias.forEach(cat => {
            if (idsDb.includes(cat.categoriaDbId)) {
              cat.seleccionada = true;
            }
          });
        } else {
          this.cargarDesdeLocalStorage();
        }
        this.cdr.detectChanges();
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
    this.guardado = false;
  }

  seleccionarPresupuesto(valor: number) {
    this.presupuestoSeleccionado = valor;
    this.guardado = false;
  }

  get categoriasSeleccionadas(): number {
    return this.categorias.filter(c => c.seleccionada).length;
  }

  get puedeGuardar(): boolean {
    return this.categoriasSeleccionadas > 0 && !this.cargando;
  }

  get presupuestoEtiqueta(): string {
    return this.rangosPrecio.find(r => r.valor === this.presupuestoSeleccionado)?.etiqueta || 'Medio';
  }

  guardarYContinuar() {
    if (this.categoriasSeleccionadas === 0) {
      return;
    }

    this.cargando = true;
    this.guardado = false;

    const elegidas = this.categorias
      .filter(c => c.seleccionada)
      .map(c => c.id);

    localStorage.setItem('preferencias_usuario', JSON.stringify(elegidas));

    if (this.usuario) {
      const categoriasSeleccionadas = Array.from(new Set(
        this.categorias.filter(c => c.seleccionada).map(c => c.categoriaDbId)
      ));

      let pendientes = categoriasSeleccionadas.length;
      if (pendientes === 0) {
        this.finalizarGuardado();
        return;
      }

      categoriasSeleccionadas.forEach(dbId => {
        this.preferenciasService.crearPreferencia(dbId, this.presupuestoSeleccionado).subscribe({
          next: () => {
            pendientes--;
            if (pendientes <= 0) {
              this.finalizarGuardado();
            }
          },
          error: () => {
            pendientes--;
            if (pendientes <= 0) {
              this.finalizarGuardado();
            }
          }
        });
      });
    } else {
      this.finalizarGuardado();
    }
  }

  private finalizarGuardado(): void {
    this.cargando = false;
    this.guardado = true;
    this.tienePreferenciasGuardadas = true;
    setTimeout(() => {
      this.router.navigate(['/lugares']);
    }, 1200);
  }
}
