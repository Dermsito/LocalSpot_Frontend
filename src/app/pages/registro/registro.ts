import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-registro',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './registro.html',
  styleUrls: ['./registro.css']
})
export class RegistroComponent {
  nuevoUsuario = {
    nombre: '',
    correo: '',
    password: ''
  };

  constructor(private router: Router) {}

  onRegistro(): void {
    console.log('Usuario registrado exitosamente:', this.nuevoUsuario);
    
    // 👇 Redirige a la pantalla de Iniciar Sesión en lugar de ir directo a explorar
    this.router.navigate(['/login']);
  }
}