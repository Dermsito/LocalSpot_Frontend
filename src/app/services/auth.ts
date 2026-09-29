import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor() {}

  registrar(datosUsuario: any): Observable<any> {
    // Simulación local de registro exitoso (sin peticiones HTTP)
    return of({ status: 200, mensaje: 'Usuario registrado exitosamente' });
  }

  login(datosLogin: any): Observable<any> {
    // Simulación local de login exitoso con token falso
    return of({ 
      token: 'fake-jwt-token-local-12345',
      correo: datosLogin.correo 
    });
  }
}