import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../services/auth';

@Component({
  selector: 'app-propietario-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './propietario-login.html',
  styleUrls: ['./propietario-login.css']
})
export class PropietarioLoginComponent {
  credenciales = {
    correo: '',
    password: ''
  };

  cargando = false;
  error = '';

  constructor(private router: Router, private auth: AuthService) {}

  onLogin(): void {
    this.error = '';
    this.cargando = true;

    this.auth.login(this.credenciales.correo, 'PROPIETARIO', undefined, this.credenciales.password).subscribe({
      next: () => {
        this.cargando = false;
        this.router.navigate(['/propietario/panel']);
      },
      error: (err) => {
        this.cargando = false;
        this.error = err?.error?.mensaje || 'Error al iniciar sesión.';
      }
    });
  }
}
