import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { environment } from '../../../environments/environment';

declare global {
  interface Window {
    google?: any;
    __googleMapsLoading?: boolean;
    __googleMapsCallbacks?: Array<() => void>;
  }
}

@Component({
  selector: 'app-mapa',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="map-wrapper">
      <div #mapContainer class="map-container"></div>
      
      <div class="map-footer" *ngIf="lat && lng">
        <span class="coords-text">📍 Coordenadas: {{ lat.toFixed(4) }}, {{ lng.toFixed(4) }}</span>
        <a [href]="getUrlComoLlegar()" target="_blank" rel="noopener" class="btn-como-llegar">
          🚗 Cómo llegar (Google Maps) ↗
        </a>
      </div>
      
      <div *ngIf="cargando" class="map-loading">
        <div class="spinner"></div>
        <p>Cargando Google Maps...</p>
      </div>

      <div *ngIf="error" class="map-error">
        <span>⚠️ {{ error }}</span>
        <a [href]="getUrlComoLlegar()" target="_blank" rel="noopener" class="btn-fallback">
          Abrir en Google Maps
        </a>
      </div>
    </div>
  `,
  styles: [`
    .map-wrapper {
      position: relative;
      width: 100%;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 14px rgba(0,0,0,0.08);
      background: #f1f3f4;
    }
    .map-container {
      width: 100%;
      height: 320px;
      min-height: 250px;
    }
    .map-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 16px;
      background: #ffffff;
      border-top: 1px solid #e0e0e0;
      font-size: 0.88rem;
    }
    .coords-text {
      color: #5f6368;
    }
    .btn-como-llegar {
      color: #1a73e8;
      font-weight: 600;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }
    .btn-como-llegar:hover {
      text-decoration: underline;
    }
    .map-loading {
      position: absolute;
      inset: 0;
      background: rgba(255,255,255,0.85);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 12px;
      color: #555;
      font-size: 0.9rem;
    }
    .spinner {
      width: 32px;
      height: 32px;
      border: 3px solid #e0e0e0;
      border-top-color: #1a73e8;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    .map-error {
      padding: 24px;
      text-align: center;
      color: #5f6368;
      background: #fafafa;
    }
    .btn-fallback {
      display: inline-block;
      margin-top: 8px;
      padding: 6px 14px;
      background: #1a73e8;
      color: #fff;
      border-radius: 6px;
      text-decoration: none;
      font-weight: 500;
    }
  `]
})
export class MapaComponent implements OnInit, AfterViewInit, OnChanges {
  @Input() lat: number = 4.3372;
  @Input() lng: number = -74.3640;
  @Input() titulo: string = 'Ubicación';
  @Input() editable: boolean = false;
  @Input() zoom: number = 15;

  @Output() coordenadasCambio = new EventEmitter<{ lat: number; lng: number }>();

  @ViewChild('mapContainer', { static: false }) mapContainer!: ElementRef<HTMLDivElement>;

  cargando = true;
  error = '';
  map: any;
  marker: any;

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    this.cargarGoogleMaps();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if ((changes['lat'] || changes['lng']) && this.map && this.marker) {
      const pos = { lat: Number(this.lat) || 4.3372, lng: Number(this.lng) || -74.3640 };
      this.map.setCenter(pos);
      this.marker.setPosition(pos);
    }
  }

  getUrlComoLlegar(): string {
    return `https://www.google.com/maps/dir/?api=1&destination=${this.lat},${this.lng}`;
  }

  private cargarGoogleMaps(): void {
    const apiKey = (environment as any).mapsApiKey || '';

    if (window.google?.maps) {
      this.inicializarMapa();
      return;
    }

    if (window.__googleMapsLoading) {
      window.__googleMapsCallbacks = window.__googleMapsCallbacks || [];
      window.__googleMapsCallbacks.push(() => this.inicializarMapa());
      return;
    }

    window.__googleMapsLoading = true;
    window.__googleMapsCallbacks = [() => this.inicializarMapa()];

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      window.__googleMapsLoading = false;
      if (window.__googleMapsCallbacks) {
        window.__googleMapsCallbacks.forEach(cb => cb());
        window.__googleMapsCallbacks = [];
      }
    };
    script.onerror = () => {
      window.__googleMapsLoading = false;
      this.cargando = false;
      this.error = 'No se pudo cargar Google Maps. Verifica tu conexión o API Key.';
    };

    document.head.appendChild(script);
  }

  private inicializarMapa(): void {
    try {
      this.cargando = false;
      if (!this.mapContainer?.nativeElement || !window.google?.maps) {
        return;
      }

      const position = {
        lat: Number(this.lat) || 4.3372,
        lng: Number(this.lng) || -74.3640
      };

      this.map = new window.google.maps.Map(this.mapContainer.nativeElement, {
        center: position,
        zoom: this.zoom,
        mapTypeControl: false,
        fullscreenControl: true,
        streetViewControl: true
      });

      this.marker = new window.google.maps.Marker({
        position: position,
        map: this.map,
        title: this.titulo,
        draggable: this.editable,
        animation: window.google.maps.Animation.DROP
      });

      const infoWindow = new window.google.maps.InfoWindow({
        content: `<div style="padding: 4px; font-weight: 600;">📍 ${this.titulo}</div>`
      });

      this.marker.addListener('click', () => {
        infoWindow.open(this.map, this.marker);
      });

      if (this.editable) {
        this.marker.addListener('dragend', (event: any) => {
          const newLat = event.latLng.lat();
          const newLng = event.latLng.lng();
          this.lat = newLat;
          this.lng = newLng;
          this.coordenadasCambio.emit({ lat: newLat, lng: newLng });
        });

        this.map.addListener('click', (event: any) => {
          const newLat = event.latLng.lat();
          const newLng = event.latLng.lng();
          this.lat = newLat;
          this.lng = newLng;
          this.marker.setPosition(event.latLng);
          this.coordenadasCambio.emit({ lat: newLat, lng: newLng });
        });
      }
    } catch (e: any) {
      this.cargando = false;
      this.error = 'Error inicializando el mapa.';
    }
  }
}
