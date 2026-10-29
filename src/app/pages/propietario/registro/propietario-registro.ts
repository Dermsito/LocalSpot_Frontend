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

interface Categoria {
  valor: string;
  nombre: string;
  dbId: number;
}

@Component({
  selector: 'app-propietario-registro',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './propietario-registro.html',
  styleUrls: ['./propietario-registro.css']
})
export class PropietarioRegistroComponent implements OnInit {
  nuevoNegocio = {
    nombre: '',
    correo: '',
    contrasena: '',
    nombreNegocio: '',
    categoria: '',
    descripcion: '',
    direccion: '',
    telefono: ''
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

  ngOnInit(): void {}

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
    this.cargando = true;

    // Registrar o iniciar sesión
    const password = this.nuevoNegocio.contrasena || '12345678';
    this.authService.login(this.nuevoNegocio.correo, 'PROPIETARIO', this.nuevoNegocio.nombre, password).subscribe({
      next: () => {
        const usuario = this.authService.getUsuario();
        const catObj = this.categorias.find(c => c.valor === this.nuevoNegocio.categoria) || this.categorias[0];

        // Enviar a Backend vía multipart si hay sesión
        const formData = new FormData();
        formData.append('nombre', this.nuevoNegocio.nombreNegocio);
        formData.append('idCategoria', catObj.dbId.toString());
        formData.append('descripcion', this.nuevoNegocio.descripcion || 'Lugar registrado en LocalSpot');
        formData.append('direccion', this.nuevoNegocio.direccion || 'Ubicación local');
        formData.append('horario', generarResumenHorario(this.horarios));

        this.establecimientosService.registrarEstablecimiento(formData).subscribe({
          next: () => {
            this.finalizarRegistroLocal(usuario?.id || 0);
          },
          error: () => {
            this.finalizarRegistroLocal(usuario?.id || 0);
          }
        });
      },
      error: () => {
        // En caso de error, guardar local
        this.finalizarRegistroLocal(0);
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
      propietarioId: propietarioId,
      publicado: false
    });

    this.cargando = false;
    this.router.navigate(['/propietario/panel']);
  }
}
