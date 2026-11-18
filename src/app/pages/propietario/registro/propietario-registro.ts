onRegistro(): void {
    this.cargando = true;
    const usuarioActual = this.authService.getUsuario();

    if (usuarioActual && usuarioActual.id) {
      this.enviarEstablecimientoBackend(Number(usuarioActual.id));
      return;
    }

    const password = this.nuevoNegocio.contrasena || '12345678';
    this.authService.login(this.nuevoNegocio.correo, 'PROPIETARIO', this.nuevoNegocio.nombre, password).subscribe({
      next: () => {
        const usuario = this.authService.getUsuario();
        this.enviarEstablecimientoBackend(usuario?.id || 0);
      },
      error: () => {
        this.finalizarRegistroLocal(0);
      }
    });
  }

  private enviarEstablecimientoBackend(propietarioId: number): void {
    const catObj = this.categorias.find(c => c.valor === this.nuevoNegocio.categoria) || this.categorias[0];
    const formData = new FormData();
    formData.append('nombre', this.nuevoNegocio.nombreNegocio);
    formData.append('idCategoria', catObj.dbId.toString());
    formData.append('descripcion', this.nuevoNegocio.descripcion || 'Lugar registrado en LocalSpot');
    formData.append('direccion', this.nuevoNegocio.direccion || 'Ubicación local');
    formData.append('horario', generarResumenHorario(this.horarios));

    this.establecimientosService.registrarEstablecimiento(formData).subscribe({
      next: () => {
        this.finalizarRegistroLocal(propietarioId);
      },
      error: () => {
        this.finalizarRegistroLocal(propietarioId);
      }
    });
  }