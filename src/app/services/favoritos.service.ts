import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, tap, catchError, of } from 'rxjs';
import { environment } from '../../environments/environment';

export interface FavoritoItem {
  idUsuario: number;
  idLugar: number;
  nombreLugar?: string;
  fechaAgregado?: string;
}

@Injectable({
  providedIn: 'root'
})
export class FavoritosService {
  private apiUrl = `${environment.apiUrl}/favoritos`;
  private favoritosSubject = new BehaviorSubject<number[]>([]);
  favoritosIds$ = this.favoritosSubject.asObservable();

  constructor(private http: HttpClient) {}

  cargarFavoritos(): Observable<FavoritoItem[]> {
    return this.http.get<FavoritoItem[]>(this.apiUrl).pipe(
      tap(items => {
        const ids = (items || []).map(i => i.idLugar);
        this.favoritosSubject.next(ids);
      }),
      catchError(err => {
        console.warn('Error al cargar favoritos del backend:', err);
        return of([]);
      })
    );
  }

  esFavorito(idLugar: number): boolean {
    return this.favoritosSubject.value.includes(idLugar);
  }

  toggleFavorito(idLugar: number): Observable<any> {
    const yaEs = this.esFavorito(idLugar);
    if (yaEs) {
      return this.http.delete(`${this.apiUrl}/${idLugar}`).pipe(
        tap(() => {
          const actuales = this.favoritosSubject.value.filter(id => id !== idLugar);
          this.favoritosSubject.next(actuales);
        })
      );
    } else {
      return this.http.post<FavoritoItem>(`${this.apiUrl}/${idLugar}`, {}).pipe(
        tap(() => {
          const actuales = [...this.favoritosSubject.value, idLugar];
          this.favoritosSubject.next(actuales);
        })
      );
    }
  }
}
