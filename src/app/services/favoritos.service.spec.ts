import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { FavoritosService, FavoritoItem } from './favoritos.service';
import { environment } from '../../environments/environment';

describe('FavoritosService (Unit Tests)', () => {
  let service: FavoritosService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [FavoritosService]
    });

    service = TestBed.inject(FavoritosService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('debe crearse correctamente', () => {
    expect(service).toBeTruthy();
  });

  it('debe cargar favoritos y actualizar los IDs reactivos en favoritosIds$', () => {
    const mockFavoritos: FavoritoItem[] = [
      { idUsuario: 100, idLugar: 1, nombreLugar: 'Pizzeria El Rincon Secreto' },
      { idUsuario: 100, idLugar: 2, nombreLugar: 'Sabor Escondido' }
    ];

    service.cargarFavoritos().subscribe(items => {
      expect(items.length).toBe(2);
      expect(service.esFavorito(1)).toBeTrue();
      expect(service.esFavorito(2)).toBeTrue();
      expect(service.esFavorito(3)).toBeFalse();
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/favoritos`);
    expect(req.request.method).toBe('GET');
    req.flush(mockFavoritos);
  });

  it('debe agregar un lugar a favoritos cuando no esta en la lista (POST)', () => {
    const lugarId = 5;

    service.toggleFavorito(lugarId).subscribe(() => {
      expect(service.esFavorito(lugarId)).toBeTrue();
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/favoritos/${lugarId}`);
    expect(req.request.method).toBe('POST');
    req.flush({ idUsuario: 100, idLugar: lugarId });
  });

  it('debe remover un lugar de favoritos cuando ya existe (DELETE)', () => {
    const lugarId = 1;

    // Precargamos favorito
    service.cargarFavoritos().subscribe();
    const reqGet = httpMock.expectOne(`${environment.apiUrl}/favoritos`);
    reqGet.flush([{ idUsuario: 100, idLugar: lugarId }]);

    expect(service.esFavorito(lugarId)).toBeTrue();

    // Toggle para eliminar
    service.toggleFavorito(lugarId).subscribe(() => {
      expect(service.esFavorito(lugarId)).toBeFalse();
    });

    const reqDelete = httpMock.expectOne(`${environment.apiUrl}/favoritos/${lugarId}`);
    expect(reqDelete.request.method).toBe('DELETE');
    reqDelete.flush(null);
  });
});
