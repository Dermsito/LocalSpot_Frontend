import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, of } from 'rxjs';
import { environment } from '../../environments/environment';

export interface PreferenciaDto {
  idPreferencia?: number;
  idCategoria: number;
  nombreCategoria?: string;
  presupuestoMax: number;
}

@Injectable({
  providedIn: 'root'
})
export class PreferenciasService {
  private apiUrl = `${environment.apiUrl}/preferencias`;

  constructor(private http: HttpClient) {}

  obtenerPreferencias(): Observable<PreferenciaDto[]> {
    return this.http.get<PreferenciaDto[]>(this.apiUrl).pipe(
      catchError(err => {
        console.warn('Error al obtener preferencias del backend:', err);
        return of([]);
      })
    );
  }

  crearPreferencia(idCategoria: number, presupuestoMax: number = 50000): Observable<PreferenciaDto> {
    return this.http.post<PreferenciaDto>(this.apiUrl, {
      idCategoria,
      presupuestoMax
    });
  }

  eliminarPreferencia(idPreferencia: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${idPreferencia}`);
  }
}
