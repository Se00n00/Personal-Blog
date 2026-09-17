import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';

import { BlogService, ArticleListItem } from '../services/blog.service';
import { AuthService } from '../services/auth.service';
import { ThemeService } from '../services/theme.service';

@Component({
  selector: 'app-home',
  imports: [CommonModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit {
  private blogService = inject(BlogService);
  private cdr = inject(ChangeDetectorRef);
  private router = inject(Router);
  auth = inject(AuthService);
  theme = inject(ThemeService);

  public articles: ArticleListItem[] = [];
  loading = true;
  error: string | null = null;

  ngOnInit() {
    this.loadArticles();
  }

  loadArticles() {
    this.loading = true;
    this.error = null;
    this.blogService.getArticles().subscribe({
      next: (data) => {
        this.articles = [...data];
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.error = 'Could not load articles. Is the API running?';
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  logout() {
    this.auth.logout();
  }

  /** "July 22, 2025" -> "07/25" for the list's date column. */
  shortDate(date: string | undefined): string {
    if (!date) {
      return '';
    }
    const months: Record<string, number> = {
      january: 1, february: 2, march: 3, april: 4, may: 5, june: 6,
      july: 7, august: 8, september: 9, october: 10, november: 11, december: 12,
      jan: 1, feb: 2, mar: 3, apr: 4, jun: 6, jul: 7, aug: 8,
      sep: 9, sept: 9, oct: 10, nov: 11, dec: 12
    };
    const match = date.trim().match(/^([a-zA-Z]+)\s+\d{1,2},?\s+(\d{4})/);
    if (!match) {
      return '';
    }
    const month = months[match[1].toLowerCase()];
    if (!month) {
      return '';
    }
    const year = match[2].slice(2);
    return `${String(month).padStart(2, '0')}/${year}`;
  }

  editArticle(event: Event, id: string) {
    event.stopPropagation();
    event.preventDefault();
    this.router.navigate(['/edit', id]);
  }
}
