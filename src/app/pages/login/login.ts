import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class LoginComponent {
  loginData = {
    correo: '',
    password: ''
  };

  constructor(private router: Router) {}

  onLogin() {
    if (!this.loginData.correo || !this.loginData.password) {
      alert('Por favor, ingresa tu correo y contraseña');
      return;
    }

    // Redirige a la pantalla de preferencias
    this.router.navigate(['/preferencias']);
  }
}