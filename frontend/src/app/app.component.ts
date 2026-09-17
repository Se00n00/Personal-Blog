import { Component, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterOutlet } from '@angular/router';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { filter } from 'rxjs';
import { ThemeService } from './services/theme.service';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, MatSlideToggleModule, RouterLink],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'frontend';
  checked = false;
  disabled = false;
  theme = inject(ThemeService);
  auth = inject(AuthService);
  private router = inject(Router);

  /** Article pages go edge-to-edge (no blue shell). */
  isArticle = signal(this.router.url.startsWith('/article'));

  constructor() {
    this.router.events.pipe(filter((e) => e instanceof NavigationEnd)).subscribe((e) => {
      this.isArticle.set((e as NavigationEnd).urlAfterRedirects.startsWith('/article'));
    });
  }

  logout() {
    this.auth.logout();
  }
}
