import { Injectable, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, map, tap } from 'rxjs';
import { Author, BlogService } from './blog.service';

const SESSION_KEY = 'blog-author';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private blogService = inject(BlogService);
  private router = inject(Router);

  /** Reactive login flag the top bar / guards read. Restored from localStorage. */
  readonly loggedIn = signal<boolean>(this.readSession() !== null);

  currentAuthor(): Author | null {
    return this.readSession();
  }

  login(username: string, password: string): Observable<Author | null> {
    return this.blogService.login(username.trim(), password).pipe(
      tap((author) => {
        if (author) {
          const { password: _pw, ...safe } = author as any;
          localStorage.setItem(SESSION_KEY, JSON.stringify(safe));
          this.loggedIn.set(true);
        }
      })
    );
  }

  logout(): void {
    localStorage.removeItem(SESSION_KEY);
    this.loggedIn.set(false);
  }

  private readSession(): Author | null {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      return raw ? (JSON.parse(raw) as Author) : null;
    } catch {
      return null;
    }
  }
}
