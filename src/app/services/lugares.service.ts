private iaCache = new Map<string, { lugar: Lugar; motivoIa: string }[]>();

  buscarConIa(consulta: string): Observable<{ lugar: Lugar; motivoIa: string }[]> {
    const clave = consulta.trim().toLowerCase();
    if (this.iaCache.has(clave)) {
      return of(this.iaCache.get(clave)!);
    }

    return this.http.post<any[]>(`${environment.apiUrl}/lugares/buscar-ia`, { consulta }).pipe(
      map((items: any[]) => {
        if (!Array.isArray(items)) return [];
        const resultado = items.map((item: any) => {
          const b = item.lugar;
          const adaptado: Lugar = {
            id: b.idLugar,
            nombre: b.nombre,
            categoria: this.mapearCategoria(b.nombreCategoria || b.idCategoria),
            calificacion: b.promedioCalificacion || 4.5,
            direccion: b.direccion || 'Ubicación local',
            icono: this.getIconoPorCategoria(this.mapearCategoria(b.nombreCategoria || b.idCategoria)),
            descripcion: b.descripcion || '',
            horario: b.horario || 'Lunes a Domingo: 10:00 - 20:00',
            publicado: true,
            propietarioId: b.idPropietario || 0,
            latitud: b.latitud ? Number(b.latitud) : 4.3372,
            longitud: b.longitud ? Number(b.longitud) : -74.3640,
            fotos: b.fotos && b.fotos.length > 0
              ? b.fotos.map((f: any) => typeof f === 'string' ? f : f.urlFoto)
              : [`https://picsum.photos/seed/lugar${b.idLugar}/800/600`],
            rangoPrecio: b.precioMax ? (b.precioMax > 50000 ? 3 : b.precioMax > 20000 ? 2 : 1) : 2,
            telefono: '3001234567',
            whatsapp: '573001234567',
            instagram: 'localspot',
            web: '',
            horarios: horariosPorDefecto(),
            pagos: ['Efectivo', 'Tarjeta'],
            comodidades: ['Wi-Fi gratis', 'Zona al aire libre']
          };
          return {
            lugar: adaptado,
            motivoIa: item.motivoIa
          };
        });
        if (resultado.length > 0) {
          this.iaCache.set(clave, resultado);
        }
        return resultado;
      }),
      catchError((err) => {
        console.warn('Error en búsqueda con IA:', err);
        return of([]);
      })
    );
  }