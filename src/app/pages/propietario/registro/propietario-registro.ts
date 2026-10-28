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

interface Categoria {
  valor: string;
  nombre: string;
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
    // Datos del propietario
    nombre: '',
    correo: '',
    contrasena: '',
    // Datos del negocio
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
    { valor: 'restaurantes', nombre: 'Restaurante' },
    { valor: 'cafes', nombre: 'Cafetería' },
    { valor: 'bares', nombre: 'Bar / Vida nocturna' },
    { valor: 'entretenimiento', nombre: 'Entretenimiento' },
    { valor: 'deportes', nombre: 'Deportes y fitness' },
    { valor: 'compras', nombre: 'Tienda / Compras' }
  ];

  metodosPago: OpcionCatalogo[] = METODOS_PAGO;
  comodidadesDisponibles: OpcionCatalogo[] = COMODIDADES;

  cargando = false;

  constructor(
    private lugaresService: LugaresService,
    private authService: AuthService,
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
    
    // 1. Simular registro de usuario propietario
    this.authService.login(this.nuevoNegocio.correo, 'PROPIETARIO', this.nuevoNegocio.nombre).subscribe(() => {
      const usuario = this.authService.getUsuario();
      
      // 2. Guardar el negocio en el estado local
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
        propietarioId: usuario?.id || 0,
        publicado: false // Empieza como borrador
      });

      setTimeout(() => {
        this.cargando = false;
        // 3. Redirigir al panel del propietario
        this.router.navigate(['/propietario/panel']);
      }, 1000);
    });
  }
}
