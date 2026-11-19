import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
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

  constructor(
    private router: Router,
    private auth: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  onLogin(): void {
    this.error = '';

    const correo = (this.credenciales.correo || '').trim();
    const password = (this.credenciales.password || '').trim();

    if (!correo || !password) {
      this.error = 'Ingresa tu correo y contraseña de propietario.';
      this.cdr.detectChanges();
      return;
    }

    this.cargando = true;
    this.cdr.detectChanges();

    this.auth.login(correo, 'PROPIETARIO', undefined, password).pipe(
      finalize(() => {
        this.cargando = false;
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: () => {
        this.router.navigate(['/propietario/panel']);
      },
      error: (err) => {
        if (err?.name === 'TimeoutError' || err?.status === 0) {
          this.error = 'El servidor está iniciando, intenta de nuevo en unos segundos.';
        } else {
          this.error = err?.error?.message || err?.error?.mensaje || 'Correo o contraseña incorrectos.';
        }
        this.cdr.detectChanges();
      }
    });
  }
}