import { Component, AfterViewInit, ElementRef, ViewChild, NgZone, ChangeDetectorRef } from '@angular/core';
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
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef
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
      this.cdr.detectChanges();

      this.auth.loginConGoogle(response.credential).subscribe({
        next: () => {
          this.ngZone.run(() => {
            this.cargando = false;
            this.cdr.detectChanges();
            this.router.navigateByUrl(rutaInicialPorRol(this.auth.getRol()));
          });
        },
        error: (err: any) => {
          this.ngZone.run(() => {
            this.cargando = false;
            this.error = err?.error?.message || err?.error?.mensaje || 'No se pudo iniciar sesión con Google.';
            this.cdr.detectChanges();
          });
        }
      });
    });
  }

  onLogin(): void {
    this.error = '';

    const correo = (this.credenciales.correo || '').trim();
    const password = (this.credenciales.password || '').trim();

    if (!correo || !password) {
      this.error = 'Por favor ingresa tu correo y contraseña.';
      this.cdr.detectChanges();
      return;
    }

    this.cargando = true;
    this.cdr.detectChanges();

    this.auth.login(correo, 'FINAL', undefined, password).subscribe({
      next: () => {
        this.ngZone.run(() => {
          this.cargando = false;
          this.cdr.detectChanges();
          this.router.navigateByUrl(rutaInicialPorRol(this.auth.getRol()));
        });
      },
      error: (err) => {
        this.ngZone.run(() => {
          this.cargando = false;
          if (err?.name === 'TimeoutError' || err?.status === 0) {
            this.error = 'El servidor está iniciando, intenta de nuevo en unos segundos.';
          } else if (err?.status === 401) {
            this.error = 'Correo o contraseña incorrectos. Verifica tus datos.';
          } else if (err?.status === 403) {
            this.error = err?.error?.message || 'Tu cuenta aún no está verificada o no tiene permiso.';
          } else {
            this.error = err?.error?.message || err?.error?.mensaje || 'Correo o contraseña incorrectos.';
          }
          this.cdr.detectChanges();
        });
      }
    });
  }
}