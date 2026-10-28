import { Component, OnInit } from '@angular/core';
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

@Component({
  selector: 'app-detalle-lugar',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
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
    private auth: AuthService
  ) {}

  ngOnInit(): void {
    const idParam = Number(this.route.snapshot.paramMap.get('id'));
    this.usuario = this.auth.getUsuario();
    
    this.lugaresService.lugares$.subscribe(lugares => {
      const encontrado = lugares.find(l => l.id === idParam);
      if (encontrado) {
        this.lugar = this.enriquecerLugar(encontrado);
      }
      this.indiceFoto = 0;
    });
  }

  private enriquecerLugar(l: Lugar): any {
    // Si no hay fotos, ponemos una por defecto
    const fotos = l.fotos && l.fotos.length > 0 
      ? l.fotos 
      : [`https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=modern%20${l.categoria}%20building&image_size=landscape_4_3`];

    const pagos = (l.pagos || []).map(nombre => ({
      icono: iconoDeOpcion(METODOS_PAGO, nombre),
      nombre
    }));

    const comodidades = (l.comodidades || []).map(nombre => ({      icono: iconoDeOpcion(COMODIDADES, nombre),
      nombre
    }));

    return {
      ...l,
      calificacionPromedio: l.calificacion || 0,
      esFavorito: false,
      rangoPrecio: l.rangoPrecio || 2,
      telefono: l.telefono || '',
      whatsapp: l.whatsapp || '',
      instagram: l.instagram || '',
      web: l.web || '',
      horarios: l.horarios || [],
      fotos: fotos,
      pagos: pagos,
      comodidades: comodidades,
      etiquetas: [this.nombreCategoria(l.categoria), 'Nuevo'],
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

    const reseña: Calificacion = {
      usuario: this.usuario.nombre,
      estrellas: this.nuevaResena.estrellas,
      fecha: new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' }),
      comentario: this.nuevaResena.comentario
    };

    this.lugaresService.agregarResena(this.lugar.id, reseña);
    
    // Limpiar formulario
    this.nuevaResena = { estrellas: 5, comentario: '' };
    this.mostrarFormularioResena = false;
    alert('¡Gracias por tu reseña!');
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

  toggleFavorito(): void {
    this.lugar.esFavorito = !this.lugar.esFavorito;
  }
}
