import { Component, AfterViewInit, ElementRef, ViewChild, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService, rutaInicialPorRol } from '../../services/auth';
import { environment } from '../../../environments/environment';

declare const google: any;

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})
export class LoginComponent implements AfterViewInit {
  @ViewChild('googleBtn') googleBtn!: ElementRef;

  credenciales = {
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
            text: 'continue_with',
            shape: 'rectangular',
            locale: 'es'
          });
        } catch (e) {
          console.warn('Error inicializando botón de Google:', e);
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
          this.error = err?.error?.message || err?.error?.mensaje || 'No se pudo iniciar sesión con Google';
        }
      });
    });
  }

  onLogin(): void {
    this.error = '';

    const { valido, rol, nombre } = this.auth.resolverCredenciales(
      this.credenciales.correo,
      this.credenciales.password
    );

    if (!valido) {
      this.error = 'Correo o contraseña incorrectos.';
      return;
    }

    this.cargando = true;

    this.auth.login(this.credenciales.correo, rol, nombre, this.credenciales.password).subscribe({
      next: () => {
        this.cargando = false;
        this.router.navigateByUrl(rutaInicialPorRol(this.auth.getRol()));
      },
      error: (err) => {
        this.cargando = false;
        this.error = err?.error?.mensaje || 'Correo o contraseña incorrectos.';
      }
    });
  }
}
