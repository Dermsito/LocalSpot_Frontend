import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { CalificacionesService, CalificacionDto } from './calificaciones.service';
import { environment } from '../../environments/environment';

describe('CalificacionesService (Unit Tests)', () => {
  let service: CalificacionesService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [CalificacionesService]
    });

    service = TestBed.inject(CalificacionesService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('debe enviar calificacion mediante POST al backend', () => {
    const idLugar = 10;
    const puntuacion = 5;
    const comentario = 'Excelente lugar';

    const mockResponse: CalificacionDto = {
      idCalificacion: 1,
      idLugar,
      puntuacion,
      comentario
    };

    service.calificar(idLugar, puntuacion, comentario).subscribe(res => {
      expect(res).toEqual(mockResponse);
      expect(res.puntuacion).toBe(5);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/lugares/${idLugar}/calificaciones`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ puntuacion, comentario });
    req.flush(mockResponse);
  });

  it('debe hacer fallback a PUT si el backend responde con error porque ya existia una calificacion previa', () => {
    const idLugar = 10;
    const puntuacion = 4;
    const comentario = 'Actualizando mi comentario';

    service.calificar(idLugar, puntuacion, comentario).subscribe(res => {
      expect(res.puntuacion).toBe(4);
    });

    const reqPost = httpMock.expectOne(`${environment.apiUrl}/lugares/${idLugar}/calificaciones`);
    expect(reqPost.request.method).toBe('POST');
    reqPost.flush('Ya existe calificacion', { status: 400, statusText: 'Bad Request' });

    const reqPut = httpMock.expectOne(`${environment.apiUrl}/lugares/${idLugar}/calificaciones`);
    expect(reqPut.request.method).toBe('PUT');
    reqPut.flush({ idCalificacion: 1, idLugar, puntuacion, comentario });
  });
});
