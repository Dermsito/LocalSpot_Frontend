import { Component, NgZone, ChangeDetectorRef } from '@angular/core';
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

  constructor(
    private router: Router,
    private auth: AuthService,
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef
  ) {}

  onLoginAdmin(): void {
    this.error = '';

    const correo = (this.credenciales.correo || '').trim();
    const password = (this.credenciales.password || '').trim();

    if (!correo || !password) {
      this.error = 'Ingresa tu correo y contraseña de administrador.';
      this.cdr.detectChanges();
      return;
    }

    this.cargando = true;
    this.cdr.detectChanges();

    this.auth.login(correo, 'ADMINISTRADOR', undefined, password).subscribe({
      next: () => {
        this.ngZone.run(() => {
          this.cargando = false;
          if (this.auth.getRol() !== 'ADMINISTRADOR') {
            this.auth.logout();
            this.error = 'Esta cuenta no tiene permisos de administrador.';
            this.cdr.detectChanges();
            return;
          }
          this.cdr.detectChanges();
          this.router.navigateByUrl(rutaInicialPorRol(this.auth.getRol()));
        });
      },
      error: (err) => {
        this.ngZone.run(() => {
          this.cargando = false;
          if (err?.name === 'TimeoutError' || err?.status === 0) {
            this.error = 'El servidor está iniciando, intenta de nuevo en unos segundos.';
          } else {
            this.error = err?.error?.message || err?.error?.mensaje || 'Correo o contraseña incorrectos.';
          }
          this.cdr.detectChanges();
        });
      }
    });
  }
}