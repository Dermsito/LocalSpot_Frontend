import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, of } from 'rxjs';
import { environment } from '../../environments/environment';

export interface EstablecimientoResponse {
  idLugar: number;
  idCategoria: number;
  idPropietario: number;
  nombre: string;
  descripcion?: string;
  direccion?: string;
  horario?: string;
  latitud?: number;
  longitud?: number;
  precioMin?: number;
  precioMax?: number;
  estadoVerificacion: string;
}

@Injectable({
  providedIn: 'root'
})
export class EstablecimientosService {
  private apiUrl = `${environment.apiUrl}/establecimientos`;

  constructor(private http: HttpClient) {}

  obtenerMisLugares(): Observable<EstablecimientoResponse[]> {
    return this.http.get<EstablecimientoResponse[]>(`${this.apiUrl}/mis-lugares`).pipe(
      catchError(err => {
        console.warn('Error al obtener mis lugares de backend:', err);
        return of([]);
      })
    );
  }

  registrarEstablecimiento(formData: FormData): Observable<EstablecimientoResponse> {
    return this.http.post<EstablecimientoResponse>(this.apiUrl, formData);
  }
}
