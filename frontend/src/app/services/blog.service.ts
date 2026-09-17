import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface ArticleListItem {
  id: string;
  title: string;
  category: string;
  image: string;
  date: string;
  views?: number;
  likes?: string;
  description?: string;
}

export interface BlogPost {
  id: string;
  meta: {
    id: string;
    title: string;
    category: string;
    image: string;
    date: string;
    views?: number;
    likes?: string;
    description?: string;
  };
  /** Markdown source — the only body storage (old `data[]` removed). */
  content: string;
  data?: any[];
  markdown?: string;
  feedbacks?: any[];
}

export interface Author {
  id: number;
  username: string;
  password: string;
  name: string;
}

@Injectable({
  providedIn: 'root'
})
export class BlogService {
  private http = inject(HttpClient);
  private baseUrl = environment.apiUrl;

  /** GET /articles — lightweight list used on the home page */
  getArticles(): Observable<ArticleListItem[]> {
    return this.http.get<ArticleListItem[]>(`${this.baseUrl}/articles`);
  }

  /** GET /blogs — full article contents (meta + data + feedbacks) */
  getBlogs(): Observable<BlogPost[]> {
    return this.http.get<BlogPost[]>(`${this.baseUrl}/blogs`);
  }

  /** GET /blogs/:id — single full article for the article page */
  getBlog(id: string): Observable<BlogPost> {
    return this.http.get<BlogPost>(`${this.baseUrl}/blogs/${id}`);
  }

  /** PATCH /articles/:id — bump the view counter (best effort).
   *  Chained by the caller after the blog PATCH to avoid concurrent
   *  writes to db.json racing each other on a local json-server. */
  bumpArticleViews(id: string, views: number): Observable<ArticleListItem> {
    return this.http.patch<ArticleListItem>(`${this.baseUrl}/articles/${id}`, { views });
  }

  /** PATCH /blogs/:id with the complete meta object (json-server merges
   *  shallowly, so the whole meta must be sent to keep views inside meta). */
  bumpBlogViews(id: string, meta: BlogPost['meta']): Observable<BlogPost> {
    return this.http.patch<BlogPost>(`${this.baseUrl}/blogs/${id}`, { meta });
  }

  /** PUT /blogs/:id — save an edited article (full replace) */
  updateBlog(blog: BlogPost): Observable<BlogPost> {
    return this.http.put<BlogPost>(`${this.baseUrl}/blogs/${blog.id}`, blog);
  }

  /** PATCH /articles/:id — keep the home-page listing in sync with the edited meta */
  updateArticleMeta(id: string, meta: Partial<ArticleListItem>): Observable<ArticleListItem> {
    return this.http.patch<ArticleListItem>(`${this.baseUrl}/articles/${id}`, meta);
  }

  /** POST /blogs + /articles — publish a brand-new article */
  createBlog(blog: BlogPost): Observable<BlogPost> {
    return this.http.post<BlogPost>(`${this.baseUrl}/blogs`, blog);
  }

  createArticle(article: ArticleListItem): Observable<ArticleListItem> {
    return this.http.post<ArticleListItem>(`${this.baseUrl}/articles`, article);
  }

  /** POST /api/login — checks MongoDB authors (bcrypt) */
  login(username: string, password: string): Observable<Author | null> {
    return this.http.post<Author | null>(`${this.baseUrl}/api/login`, { username, password });
  }

  /** GET /authors?username=&password= — legacy, now also proxied to MongoDB */
  findAuthor(username: string, password: string): Observable<Author[]> {
    const params = new URLSearchParams({ username, password }).toString();
    return this.http.get<Author[]>(`${this.baseUrl}/authors?${params}`);
  }

  /** POST /api/upload — upload an image to MongoDB GridFS, returns {url, absoluteUrl} */
  uploadImage(file: File): Observable<{ url: string; absoluteUrl: string; fileId: string; filename: string }> {
    const form = new FormData()
    form.append('image', file)
    return this.http.post<{ url: string; absoluteUrl: string; fileId: string; filename: string }>(
      `${this.baseUrl}/api/upload`,
      form
    )
  }
}
