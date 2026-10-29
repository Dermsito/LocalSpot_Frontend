import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
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
  error = '';

  constructor(
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  onSubmit(): void {
    if (!this.correo || !this.correo.includes('@')) {
      this.error = 'Ingresa un correo electrónico válido';
      return;
    }

    this.cargando = true;
    this.error = '';
    this.mensajeExito = '';

    this.authService.solicitarRecuperacion(this.correo).subscribe({
      next: (res: any) => {
        this.cargando = false;
        this.mensajeExito = res?.mensaje || 'Te hemos enviado un enlace para restablecer tu contraseña. Revisa tu bandeja de entrada o buzón de correo.';
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.cargando = false;
        this.error = err?.error?.mensaje || 'Ocurrió un error al procesar la solicitud. Intenta de nuevo.';
        this.cdr.detectChanges();
      }
    });
  }
}
