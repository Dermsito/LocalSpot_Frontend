import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

interface CategoriaOpcion {
  valor: string;
  nombre: string;
}

@Component({
  selector: 'app-admin-registro',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './admin-registro.html',
  styleUrls: ['./admin-registro.css']
})
export class AdminRegistroComponent {
  nuevoAdmin = {
    nombreResponsable: '',
    nombreNegocio: '',
    categoria: '',
    correo: '',
    telefono: '',
    password: '',
    codigoAdmin: ''
  };

  categorias: CategoriaOpcion[] = [
    { valor: 'restaurantes', nombre: 'Restaurante' },
    { valor: 'cafes', nombre: 'Cafetería' },
    { valor: 'bares', nombre: 'Bar / Vida nocturna' },
    { valor: 'entretenimiento', nombre: 'Entretenimiento' },
    { valor: 'deportes', nombre: 'Deportes y fitness' },
    { valor: 'compras', nombre: 'Tienda / Compras' }
  ];

  constructor(private router: Router) {}

  onRegistroAdmin(): void {
    console.log('Registro de administrador:', this.nuevoAdmin);
    // TODO: conectar con AuthController / AdminLugarController cuando la API esté disponible
    this.router.navigate(['/admin/login']);
  }
}
