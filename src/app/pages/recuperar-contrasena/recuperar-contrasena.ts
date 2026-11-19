import { Component, NgZone, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { timeout } from 'rxjs';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-recuperar-contrasena',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './recuperar-contrasena.html',
  styleUrl: './recuperar-contrasena.css'
})
export class RecuperarContrasenaComponent {
  correo = '';
  cargando = false;
  mensajeExito = '';
  tokenRecuperacion = '';
  error = '';

  constructor(
    private authService: AuthService,
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef
  ) {}

  onSubmit(): void {
    if (!this.correo || !this.correo.includes('@')) {
      this.error = 'Ingresa un correo electrónico válido.';
      this.cdr.detectChanges();
      return;
    }

    this.cargando = true;
    this.error = '';
    this.mensajeExito = '';
    this.tokenRecuperacion = '';
    this.cdr.detectChanges();

    this.authService.solicitarRecuperacion(this.correo).pipe(
      timeout(65000)
    ).subscribe({
      next: (res: any) => {
        this.ngZone.run(() => {
          this.cargando = false;
          this.tokenRecuperacion = res?.token || '';
          this.mensajeExito = res?.mensaje || 'Solicitud procesada. Revisa tu correo o continúa para restablecer tu contraseña.';
          this.cdr.detectChanges();
        });
      },
      error: (err: any) => {
        this.ngZone.run(() => {
          this.cargando = false;
          if (err?.name === 'TimeoutError' || err?.status === 0) {
            this.error = 'El servidor está iniciando, intenta de nuevo en unos segundos.';
          } else {
            this.error = err?.error?.mensaje || err?.error?.message || 'Ocurrió un error al procesar la solicitud. Intenta de nuevo.';
          }
          this.cdr.detectChanges();
        });
      }
    });
  }
}