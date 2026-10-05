import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // Se obtiene dinámicamente la URL base desde las variables de entorno
  private apiUrl = `${environment.apiUrl}/auth`;

  constructor(private http: HttpClient) {}

  login(credenciales: any) {
    return this.http.post(`${this.apiUrl}/login`, credenciales);
  }

  registrar(usuario: any) {
    return this.http.post(`${this.apiUrl}/registro`, usuario);
  }
}