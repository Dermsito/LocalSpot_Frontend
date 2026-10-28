import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService, rutaInicialPorRol } from '../../services/auth';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})
export class LoginComponent {
  credenciales = {
    correo: '',
    password: ''
  };

  cargando = false;
  error = '';

  constructor(private router: Router, private auth: AuthService) {}

  onLogin(): void {
    this.error = '';

    // Un único formulario resuelve el rol con las mismas credenciales.
    const { valido, rol, nombre } = this.auth.resolverCredenciales(
      this.credenciales.correo,
      this.credenciales.password
    );

    if (!valido) {
      this.error = 'Correo o contraseña incorrectos.';
      return;
    }

    this.cargando = true;

    // Simulación de carga rápida
    setTimeout(() => {
      this.auth.login(this.credenciales.correo, rol, nombre).subscribe({
        next: () => {
          this.cargando = false;
          // Cada rol va a su apartado correspondiente.
          this.router.navigateByUrl(rutaInicialPorRol(this.auth.getRol()));
        },
        error: () => {
          this.cargando = false;
          this.error = 'Error al iniciar sesión.';
        }
      });
    }, 500);
  }
}
