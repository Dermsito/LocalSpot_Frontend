import { Component, AfterViewInit, ElementRef, ViewChild, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService, rutaInicialPorRol } from '../../services/auth';
import { environment } from '../../../environments/environment';

declare const google: any;

@Component({
  selector: 'app-registro',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './registro.html',
  styleUrls: ['./registro.css']
})
export class RegistroComponent implements AfterViewInit {
  @ViewChild('googleBtn') googleBtn!: ElementRef;

  nuevoUsuario = {
    nombre: '',
    correo: '',
    password: ''
  };

  cargando = false;
  error = '';

  constructor(
    private router: Router,
    private auth: AuthService,
    private ngZone: NgZone
  ) {}

  ngAfterViewInit(): void {
    this.iniciarGoogleBtn();
  }

  private iniciarGoogleBtn(): void {
    const clientId = (environment as any).googleClientId;
    if (!clientId) return;

    const interval = setInterval(() => {
      if (typeof google !== 'undefined' && google.accounts && this.googleBtn) {
        clearInterval(interval);
        try {
          google.accounts.id.initialize({
            client_id: clientId,
            callback: (res: any) => this.onGoogleResponse(res)
          });
          google.accounts.id.renderButton(this.googleBtn.nativeElement, {
            theme: 'outline',
            size: 'large',
            width: '100%',
            text: 'signup_with',
            shape: 'rectangular',
            locale: 'es'
          });
        } catch (e) {
          console.warn('Error inicializando botón de Google en registro:', e);
        }
      }
    }, 150);

    setTimeout(() => clearInterval(interval), 5000);
  }

  private onGoogleResponse(response: any): void {
    if (!response || !response.credential) return;

    this.ngZone.run(() => {
      this.cargando = true;
      this.error = '';

      this.auth.loginConGoogle(response.credential).subscribe({
        next: () => {
          this.cargando = false;
          this.router.navigateByUrl(rutaInicialPorRol(this.auth.getRol()));
        },
        error: (err: any) => {
          this.cargando = false;
          this.error = err?.error?.message || err?.error?.mensaje || 'No se pudo registrar con Google';
        }
      });
    });
  }

  onRegistro(): void {
    this.error = '';

    if (!this.nuevoUsuario.nombre.trim() || !this.nuevoUsuario.correo.trim() || !this.nuevoUsuario.password.trim()) {
      this.error = 'Por favor completa todos los campos.';
      return;
    }

    if (this.nuevoUsuario.password.trim().length < 8) {
      this.error = 'La contraseña debe tener al menos 8 caracteres.';
      return;
    }

    this.cargando = true;

    this.auth.registrar({
      nombre: this.nuevoUsuario.nombre.trim(),
      correo: this.nuevoUsuario.correo.trim(),
      contrasena: this.nuevoUsuario.password.trim()
    }).subscribe({
      next: () => {
        this.auth.login(this.nuevoUsuario.correo.trim(), 'FINAL', this.nuevoUsuario.nombre.trim(), this.nuevoUsuario.password.trim()).subscribe({
          next: () => {
            this.cargando = false;
            this.router.navigateByUrl(rutaInicialPorRol(this.auth.getRol()));
          },
          error: () => {
            this.cargando = false;
            this.router.navigate(['/login']);
          }
        });
      },
      error: (err) => {
        this.cargando = false;
        const fieldError = err?.error?.errors?.[0]?.message;
        this.error = fieldError || err?.error?.message || err?.error?.mensaje || 'Error al registrar el usuario. Verifica los datos.';
      }
    });
  }
}