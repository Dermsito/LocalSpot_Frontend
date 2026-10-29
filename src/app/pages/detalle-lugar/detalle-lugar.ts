import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import {
  LugaresService,
  Lugar,
  Calificacion,
  METODOS_PAGO,
  COMODIDADES,
  iconoDeOpcion
} from '../../services/lugares.service';
import { AuthService } from '../../services/auth';
import { CalificacionesService } from '../../services/calificaciones.service';
import { FavoritosService } from '../../services/favoritos.service';
import { MapaComponent } from '../../shared/mapa/mapa.component';

@Component({
  selector: 'app-detalle-lugar',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, MapaComponent],
  templateUrl: './detalle-lugar.html',
  styleUrl: './detalle-lugar.css'
})
export class DetalleLugarComponent implements OnInit {
  lugar: any;
  indiceFoto = 0;
  usuario: any = null;

  // Estado para la nueva reseña
  mostrarFormularioResena = false;
  nuevaResena = {
    estrellas: 5,
    comentario: ''
  };

  constructor(
    private route: ActivatedRoute,
    private lugaresService: LugaresService,
    private auth: AuthService,
    private califService: CalificacionesService,
    private favoritosService: FavoritosService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const idParam = Number(this.route.snapshot.paramMap.get('id'));
    this.usuario = this.auth.getUsuario();
    
    // Cargar estado de favoritos si el usuario está autenticado
    if (this.usuario) {
      this.favoritosService.cargarFavoritos().subscribe(() => {
        if (this.lugar) {
          this.lugar.esFavorito = this.favoritosService.esFavorito(this.lugar.id);
          this.cdr.detectChanges();
        }
      });
    }

    this.lugaresService.lugares$.subscribe(lugares => {
      const encontrado = lugares.find(l => l.id === idParam);
      if (encontrado) {
        this.lugar = this.enriquecerLugar(encontrado);
        if (this.usuario) {
          this.lugar.esFavorito = this.favoritosService.esFavorito(this.lugar.id);
        }
      }
      this.indiceFoto = 0;
      this.cdr.detectChanges();
    });
  }

  private enriquecerLugar(l: Lugar): any {
    const fotos = l.fotos && l.fotos.length > 0 
      ? l.fotos 
      : [`https://picsum.photos/seed/lugar${l.id}/800/600`];

    const pagos = (l.pagos || []).map(nombre => ({
      icono: iconoDeOpcion(METODOS_PAGO, nombre),
      nombre
    }));

    const comodidades = (l.comodidades || []).map(nombre => ({
      icono: iconoDeOpcion(COMODIDADES, nombre),
      nombre
    }));

    return {
      ...l,
      latitud: l.latitud ? Number(l.latitud) : 4.3372,
      longitud: l.longitud ? Number(l.longitud) : -74.3640,
      calificacionPromedio: l.calificacion || 0,
      esFavorito: this.favoritosService.esFavorito(l.id),
      rangoPrecio: l.rangoPrecio || 2,
      telefono: l.telefono || '',
      whatsapp: l.whatsapp || '',
      instagram: l.instagram || '',
      web: l.web || '',
      horarios: l.horarios || [],
      fotos: fotos,
      pagos: pagos,
      comodidades: comodidades,
      etiquetas: [this.nombreCategoria(l.categoria), 'Verificado'],
      calificaciones: l.calificaciones || []
    };
  }

  nombreCategoria(valor: string): string {
    const categorias: any = {
      'restaurantes': 'Restaurante',
      'cafes': 'Cafetería',
      'bares': 'Bar',
      'entretenimiento': 'Entretenimiento',
      'deportes': 'Deportes',
      'compras': 'Compras'
    };
    return categorias[valor] || valor;
  }

  toggleFormularioResena(): void {
    if (!this.usuario) {
      alert('Debes iniciar sesión para escribir una reseña.');
      return;
    }
    this.mostrarFormularioResena = !this.mostrarFormularioResena;
  }

  enviarResena(): void {
    if (!this.nuevaResena.comentario.trim()) {
      alert('Por favor, escribe un comentario.');
      return;
    }

    const puntuacion = this.nuevaResena.estrellas;
    const comentario = this.nuevaResena.comentario;

    // 1. Guardar en Backend
    this.califService.calificar(this.lugar.id, puntuacion, comentario).subscribe({
      next: (res) => {
        // 2. Reflejar inmediatamente en UI y estado local
        const reseña: Calificacion = {
          usuario: this.usuario.nombre || 'Tú',
          estrellas: puntuacion,
          fecha: new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' }),
          comentario: comentario
        };

        this.lugaresService.agregarResena(this.lugar.id, reseña);

        this.nuevaResena = { estrellas: 5, comentario: '' };
        this.mostrarFormularioResena = false;
        this.cdr.detectChanges();
        alert('¡Gracias por tu reseña! Ha sido guardada con éxito.');
      },
      error: (err) => {
        // Fallback local por si el usuario no tiene token backend válido
        const reseña: Calificacion = {
          usuario: this.usuario.nombre || 'Tú',
          estrellas: puntuacion,
          fecha: new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' }),
          comentario: comentario
        };
        this.lugaresService.agregarResena(this.lugar.id, reseña);
        this.nuevaResena = { estrellas: 5, comentario: '' };
        this.mostrarFormularioResena = false;
        this.cdr.detectChanges();
        alert('¡Gracias por tu reseña!');
      }
    });
  }

  toggleFavorito(): void {
    if (!this.usuario) {
      alert('Inicia sesión para guardar este lugar en tus favoritos.');
      return;
    }

    this.favoritosService.toggleFavorito(this.lugar.id).subscribe({
      next: () => {
        this.lugar.esFavorito = this.favoritosService.esFavorito(this.lugar.id);
        this.cdr.detectChanges();
      },
      error: () => {
        // Fallback optimista si falla token
        this.lugar.esFavorito = !this.lugar.esFavorito;
        this.cdr.detectChanges();
      }
    });
  }

  siguienteFoto(): void {
    this.indiceFoto = (this.indiceFoto + 1) % this.lugar.fotos.length;
  }

  anteriorFoto(): void {
    const total = this.lugar.fotos.length;
    this.indiceFoto = (this.indiceFoto - 1 + total) % total;
  }

  irAFoto(indice: number): void {
    this.indiceFoto = indice;
  }

  simbolosPrecio(nivel: number): string {
    return '$'.repeat(nivel);
  }

  etiquetaPrecio(nivel: number): string {
    return ['Económico', 'Moderado', 'Premium'][nivel - 1] ?? 'Moderado';
  }
}
