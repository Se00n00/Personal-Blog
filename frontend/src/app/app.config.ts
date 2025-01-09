import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideHighlightOptions } from 'ngx-highlightjs';


import { providePrimeNG } from 'primeng/config';
import Aura from '@primeng/themes/aura';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }), 
    provideRouter(routes), 
    provideAnimationsAsync(),
    provideHighlightOptions({
      fullLibraryLoader: () => import('highlight.js')
    }),
    provideAnimationsAsync(),
        providePrimeNG({
            theme: {
                preset: Aura
            }
    })
  ]
};
