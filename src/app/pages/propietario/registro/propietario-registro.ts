import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import {
  LugaresService,
  METODOS_PAGO,
  COMODIDADES,
  horariosPorDefecto,
  generarResumenHorario,
  OpcionCatalogo
} from '../../../services/lugares.service';
import { AuthService } from '../../../services/auth';
import { EstablecimientosService } from '../../../services/establecimientos.service';
import { MapaComponent } from '../../../shared/mapa/mapa.component';

interface Categoria {
  valor: string;
  nombre: string;
  dbId: number;
}

@Component({
  selector: 'app-propietario-registro',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, MapaComponent],
  templateUrl: './propietario-registro.html',
  styleUrls: ['./propietario-registro.css']
})
export class PropietarioRegistroComponent implements OnInit {
  usuarioLogueado: any = null;
  errorMensaje = '';

  nuevoNegocio = {
    nombre: '',
    correo: '',
    contrasena: '',
    nombreNegocio: '',
    categoria: '',
    descripcion: '',
    direccion: '',
    telefono: '',
    latitud: 4.3372,
    longitud: -74.3640
  };

  horarios = horariosPorDefecto();
  pagos: string[] = ['Efectivo', 'Tarjeta'];
  comodidades: string[] = [];

  categorias: Categoria[] = [
    { valor: 'restaurantes', nombre: 'Restaurante', dbId: 1 },
    { valor: 'cafes', nombre: 'Cafetería', dbId: 1 },
    { valor: 'bares', nombre: 'Bar / Vida nocturna', dbId: 2 },
    { valor: 'entretenimiento', nombre: 'Entretenimiento', dbId: 2 },
    { valor: 'deportes', nombre: 'Deportes y fitness', dbId: 4 },
    { valor: 'compras', nombre: 'Tienda / Compras', dbId: 5 }
  ];

  metodosPago: OpcionCatalogo[] = METODOS_PAGO;
  comodidadesDisponibles: OpcionCatalogo[] = COMODIDADES;

  cargando = false;

  constructor(
    private lugaresService: LugaresService,
    private authService: AuthService,
    private establecimientosService: EstablecimientosService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.usuarioLogueado = this.authService.getUsuario();
  }

  onCoordenadasCambio(coords: { lat: number; lng: number }): void {
    this.nuevoNegocio.latitud = coords.lat;
    this.nuevoNegocio.longitud = coords.lng;
  }

  tienePago(nombre: string): boolean {
    return this.pagos.includes(nombre);
  }

  togglePago(nombre: string): void {
    const index = this.pagos.indexOf(nombre);
    if (index >= 0) this.pagos.splice(index, 1);
    else this.pagos.push(nombre);
  }

  tieneComodidad(nombre: string): boolean {
    return this.comodidades.includes(nombre);
  }

  toggleComodidad(nombre: string): void {
    const index = this.comodidades.indexOf(nombre);
    if (index >= 0) this.comodidades.splice(index, 1);
    else this.comodidades.push(nombre);
  }

  onRegistro(): void {
    this.errorMensaje = '';
    if (!this.nuevoNegocio.nombreNegocio.trim() || !this.nuevoNegocio.categoria || !this.nuevoNegocio.direccion.trim()) {
      this.errorMensaje = 'Completa el nombre del negocio, la categoría y la dirección.';
      return;
    }

    this.cargando = true;
    const usuarioActual = this.authService.getUsuario();

    if (usuarioActual && usuarioActual.id) {
      this.enviarEstablecimientoBackend(Number(usuarioActual.id));
      return;
    }

    const password = this.nuevoNegocio.contrasena || '12345678';
    this.authService.login(this.nuevoNegocio.correo, 'PROPIETARIO', this.nuevoNegocio.nombre, password).subscribe({
      next: () => {
        const usuario = this.authService.getUsuario();
        this.enviarEstablecimientoBackend(usuario?.id || 0);
      },
      error: (err) => {
        this.cargando = false;
        this.errorMensaje = err?.error?.message || 'No se pudo iniciar sesión o crear la cuenta de propietario.';
      }
    });
  }

  private enviarEstablecimientoBackend(propietarioId: number): void {
    const catObj = this.categorias.find(c => c.valor === this.nuevoNegocio.categoria) || this.categorias[0];
    const formData = new FormData();
    formData.append('nombre', this.nuevoNegocio.nombreNegocio.trim());
    formData.append('idCategoria', catObj.dbId.toString());
    formData.append('descripcion', this.nuevoNegocio.descripcion || 'Lugar registrado en LocalSpot');
    formData.append('direccion', this.nuevoNegocio.direccion.trim());
    formData.append('horario', generarResumenHorario(this.horarios));
    formData.append('latitud', this.nuevoNegocio.latitud.toString());
    formData.append('longitud', this.nuevoNegocio.longitud.toString());

    this.establecimientosService.registrarEstablecimiento(formData).subscribe({
      next: () => {
        this.finalizarRegistroLocal(propietarioId);
      },
      error: (err) => {
        this.cargando = false;
        if (err?.status === 401 || err?.status === 403) {
          this.errorMensaje = 'Tu sesión expiró. Cierra sesión y vuelve a ingresar como propietario para guardar el negocio.';
        } else {
          this.errorMensaje = err?.error?.message || 'Error al guardar el establecimiento en el servidor.';
        }
      }
    });
  }

  private finalizarRegistroLocal(propietarioId: number): void {
    this.lugaresService.agregarLugar({
      nombre: this.nuevoNegocio.nombreNegocio,
      categoria: this.nuevoNegocio.categoria,
      direccion: this.nuevoNegocio.direccion,
      descripcion: this.nuevoNegocio.descripcion,
      telefono: this.nuevoNegocio.telefono,
      horario: generarResumenHorario(this.horarios),
      horarios: this.horarios,
      pagos: this.pagos,
      comodidades: this.comodidades,
      latitud: this.nuevoNegocio.latitud,
      longitud: this.nuevoNegocio.longitud,
      propietarioId: propietarioId,
      publicado: false
    });

    this.cargando = false;
    this.router.navigate(['/propietario/panel']);
  }
}
