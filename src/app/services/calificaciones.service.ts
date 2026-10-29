import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, of } from 'rxjs';
import { environment } from '../../environments/environment';

export interface CalificacionDto {
  idCalificacion?: number;
  idUsuario?: number;
  idLugar: number;
  puntuacion: number;
  comentario: string;
  visible?: boolean;
  fechaRegistro?: string;
}

@Injectable({
  providedIn: 'root'
})
export class CalificacionesService {
  constructor(private http: HttpClient) {}

  calificar(idLugar: number, puntuacion: number, comentario: string): Observable<CalificacionDto> {
    return this.http.post<CalificacionDto>(`${environment.apiUrl}/lugares/${idLugar}/calificaciones`, {
      puntuacion,
      comentario
    }).pipe(
      catchError(err => {
        // Si ya calificó (409 o 400), intentamos PUT para editar
        return this.http.put<CalificacionDto>(`${environment.apiUrl}/lugares/${idLugar}/calificaciones`, {
          puntuacion,
          comentario
        });
      })
    );
  }
}
