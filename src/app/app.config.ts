import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withPreloading, PreloadAllModules, withViewTransitions, withInMemoryScrolling } from '@angular/router';
import { provideHttpClient, withInterceptors, withFetch } from '@angular/common/http';
import { routes } from './app.routes';
import { authInterceptor } from './services/auth.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(
      routes,
      withPreloading(PreloadAllModules),
      withViewTransitions(),
      withInMemoryScrolling({ scrollPositionRestoration: 'enabled' })
    ),
    provideHttpClient(
      withFetch(),
      withInterceptors([authInterceptor])
    )
  ]
};
