import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService, rutaInicialPorRol } from '../../services/auth';

@Component({
  selector: 'app-admin-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './admin-login.html',
  styleUrls: ['./admin-login.css']
})
export class AdminLoginComponent {
  credenciales = {
    correo: '',
    password: ''
  };

  cargando = false;
  error = '';

  constructor(private router: Router, private auth: AuthService) {}

  onLoginAdmin(): void {
    this.error = '';

    // Se reutiliza el mismo resolver que el login general (sin duplicar lógica).
    const { valido, rol, nombre } = this.auth.resolverCredenciales(
      this.credenciales.correo,
      this.credenciales.password
    );

    if (!valido || rol !== 'ADMINISTRADOR') {
      this.error = 'Correo o contraseña incorrectos. Verifica tus datos de administrador.';
      return;
    }

    this.cargando = true;

    // Simulación de carga rápida (mock, igual que los otros accesos)
    setTimeout(() => {
      this.auth.login(this.credenciales.correo, 'ADMINISTRADOR', nombre).subscribe({
        next: () => {
          this.cargando = false;
          this.router.navigateByUrl(rutaInicialPorRol(this.auth.getRol()));
        },
        error: () => {
          this.cargando = false;
          this.error = 'No se pudo iniciar sesión como administrador.';
        }
      });
    }, 500);
  }
}
