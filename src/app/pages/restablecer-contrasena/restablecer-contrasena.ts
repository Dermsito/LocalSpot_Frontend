import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-restablecer-contrasena',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './restablecer-contrasena.html',
  styleUrl: './restablecer-contrasena.css'
})
export class RestablecerContrasenaComponent implements OnInit {
  token = '';
  nuevaContrasena = '';
  confirmarContrasena = '';
  cargando = false;
  mensajeExito = '';
  error = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.token = params['token'] || '';
      if (!this.token) {
        this.error = 'No se encontró un token válido en el enlace. Solicita uno nuevo.';
      }
      this.cdr.detectChanges();
    });
  }

  onSubmit(): void {
    if (!this.token) {
      this.error = 'El token es obligatorio para restablecer la contraseña';
      return;
    }

    if (!this.nuevaContrasena || this.nuevaContrasena.length < 6) {
      this.error = 'La contraseña debe tener al menos 6 caracteres';
      return;
    }

    if (this.nuevaContrasena !== this.confirmarContrasena) {
      this.error = 'Las contraseñas no coinciden';
      return;
    }

    this.cargando = true;
    this.error = '';

    this.authService.restablecerContrasena(this.token, this.nuevaContrasena).subscribe({
      next: (res: any) => {
        this.cargando = false;
        this.mensajeExito = res?.mensaje || '¡Contraseña restablecida con éxito! Ya puedes iniciar sesión.';
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.cargando = false;
        this.error = err?.error?.mensaje || 'El enlace de recuperación es inválido o ha expirado. Por favor solicita uno nuevo.';
        this.cdr.detectChanges();
      }
    });
  }
}
