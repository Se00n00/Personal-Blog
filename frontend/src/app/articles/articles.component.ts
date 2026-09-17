import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button'
import { FieldsetModule } from 'primeng/fieldset';
import { ActivatedRoute } from '@angular/router';
import { Router } from '@angular/router';
import { switchMap } from 'rxjs/operators';
import { of } from 'rxjs';

import { BlogService, BlogPost } from '../services/blog.service';
import { AuthService } from '../services/auth.service';
import { ThemeService } from '../services/theme.service';
import { environment } from '../../environments/environment';
import hljs from 'highlight.js';

/** One rendered row of the raw-markdown doc sheet. */
export interface DocLine {
  kind: 'blank' | 'text' | 'image' | 'link' | 'rule' | 'code';
  text: string;
  /** Prebuilt inner HTML for text / rule / code rows (markers stay visible). */
  html: string;
  alt: string;
  src: string;
  href: string;
  /** True for ``` fence marker rows (rendered muted, inside the block). */
  fence: boolean;
  codeFirst: boolean;
  codeLast: boolean;
}

@Component({
  selector: 'app-articles',
  imports: [MatIconModule, CommonModule, ButtonModule,FieldsetModule,RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './articles.component.html',
  styleUrl: './articles.component.css'
})

export class ArticlesComponent {
  private blogService = inject(BlogService);
  private cdr = inject(ChangeDetectorRef);
  auth = inject(AuthService);
  theme = inject(ThemeService);

  like(){}
  comment_icon = 'comment';
  showComments:boolean = false;
  comment(){
    if(this.comment_icon === 'close'){
      this.comment_icon  = 'comment'
      this.showComments = false
    }
    else{
      this.showComments = true
      this.comment_icon= 'close'
    }
  }
  upCommentCrousal(){}
  downCommentCrousal(){}


  itemId: string | null = '';
  article: BlogPost | null = null;
  loading = true;
  copied = signal("copy")

  constructor(private route: ActivatedRoute,private router:Router) {}

  ngOnInit() {
    this.route.paramMap.pipe(
      switchMap((params) => {
        this.itemId = params.get('id'); // Get the 'id' parameter
        if (!this.itemId) {
          this.router.navigate(['/404']);
          return of(null);
        }
        this.loading = true;
        return this.blogService.getBlog(this.itemId);
      })
    ).subscribe({
      next: (blog) => {
        this.loading = false;
        if (!blog) {
          this.router.navigate(['/404']);
          return;
        }
        this.article = blog;
        this.cdr.markForCheck();
        // Count this visit (best effort — ignored if the API is read-only).
        // Chained sequentially: parallel writes race on a local json-server.
        const seen = (blog.meta.views ?? 0) + 1;
        blog.meta.views = seen;
        this.blogService.bumpBlogViews(blog.id, blog.meta).subscribe({
          next: () => this.blogService.bumpArticleViews(blog.id, seen).subscribe({ error: () => {} }),
          error: () => {}
        });
      },
      error: () => {
        this.loading = false;
        this.cdr.markForCheck();
        this.router.navigate(['/404']);
      }
    });
  }
  copyLink() {
    const url = window.location.href;
    navigator.clipboard.writeText(url)
    alert(`Link Copied: ${url}`)
  }
  copycontent(codeContent:string){
    navigator.clipboard.writeText(codeContent);
    this.copied.update(value => value="copied")
  }

  /** File label for the doc sidebar, e.g. "/ my-post.md". */
  docName(): string {
    const t = this.article?.meta?.title ?? 'untitled';
    const slug = t.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'untitled';
    return `/ ${slug}.md`;
  }

  /** Article body converted to raw markdown source lines (Left-editor style).
   *  Meta (title/date/views) is rendered in the sheet header, so only `data` is
   *  turned into markdown lines here — no duplicate `# Title`.
   *  New format: `content`/`markdown` is a plain markdown string. */
  markdownLines(): string[] {
    if (!this.article) return [];
    const rawContent = (this.article as any).content ?? (this.article as any).markdown;
    if (typeof rawContent === 'string' && rawContent.length > 0) {
      return rawContent.split('\n');
    }
    if (typeof this.article.data === 'string') {
      return (this.article.data as unknown as string).split('\n');
    }
    const lines: string[] = [];
    const push = (...ls: string[]) => lines.push(...ls);
    for (const item of (this.article.data as any[]) ?? []) {
      const v = item?.value;
      switch (item?.datatype) {
        case 'heading': push(`# ${v}`, ''); break;
        case 'subHeading': push(`## ${v}`, ''); break;
        case 'text':
        case 'subText': push(...String(v ?? '').split('\n'), ''); break;
        case 'quote':
          String(v ?? '').split('\n').forEach((ln) => push(`> ${ln}`));
          if (item.quoter) String(item.quoter).split('\n').forEach((ln) => push(`> — ${ln}`));
          push('');
          break;
        case 'explanation':
          String(v ?? '').split('\n').forEach((ln) => push(`> ${ln}`));
          push('');
          break;
        case 'list':
          if (Array.isArray(v)) for (const li of v) push(`- ${li}`);
          push('');
          break;
        case 'code':
          push('```' + (item.language ?? ''), ...String(v ?? '').split('\n'), '```', '');
          break;
        case 'code_text':
          push('```' + (item.language ?? ''), ...String(v ?? '').split('\n'), '```');
          if (item.codeDescription) push(...String(item.codeDescription).split('\n'));
          push('');
          break;
        case 'image': push(`![${item.imageTitle ?? ''}](${item.imageSrc ?? ''})`, ''); break;
        case 'site':
          push(`[${item.siteTitle ?? item.siteLink ?? ''}](${item.siteLink ?? ''})`);
          if (item.siteSubTitle) push(...String(item.siteSubTitle).split('\n'));
          push('');
          break;
        case 'keywords': break; // shown in the footer bar instead
        default:
          if (typeof v === 'string' && v) push(v, '');
          else if (Array.isArray(v)) { for (const li of v) push(`- ${li}`); push(''); }
          break;
      }
    }
    while (lines.length && lines[lines.length - 1] === '') lines.pop();
    return lines;
  }

  /** Headings with their 0-based line numbers, for the left outline. */
  docOutline(): { label: string; line: number; sub: boolean }[] {
    const out: { label: string; line: number; sub: boolean }[] = [];
    this.markdownLines().forEach((ln, i) => {
      if (ln.startsWith('## ')) out.push({ label: '- ' + ln.slice(3), line: i, sub: true });
      else if (ln.startsWith('# ')) out.push({ label: ln.slice(2), line: i, sub: false });
    });
    return out;
  }

  /** Keywords for the "open ..." suggestion bar at the bottom of the sheet. */
  docKeywords(): string[] {
    if (!this.article) return [];
    for (const item of this.article.data ?? []) {
      if (item?.datatype === 'keywords' && Array.isArray(item.value)) return item.value;
    }
    return this.article.meta?.category ? [this.article.meta.category] : [];
  }

  /** Escape raw text for innerHTML binding. */
  private esc(s: string): string {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  /** ASCII arrows -> proper glyphs (<-- to <-), prose only — never code. */
  private arrows(s: string): string {
    return s
      .replace(/<-->/g, '⟷')
      .replace(/<->/g, '↔')
      .replace(/<--/g, '←')
      .replace(/-->/g, '→')
      .replace(/=>/g, '⇒');
  }

  private safeHref(u: string): string {
    const t = (u ?? '').trim();
    return /^(https?:|mailto:)/i.test(t) ? t : '#';
  }

  private resolveImgSrc(src: string): string {
    const s = (src || '').trim();
    if (/^https?:\/\//i.test(s)) return s;
    if (s.startsWith('/api/')) return `${environment.apiUrl}${s}`;
    return s;
  }

  /** ***bi***, **b**, *i* — markers stay visible (muted), content styled. */
  private emHtml(s: string): string {
    const MU = '<span class="md-muted">';
    return s.split(/(\*\*\*[^*\n]+?\*\*\*|\*\*[^*\n]+?\*\*|\*[^*\n]+?\*)/g).map((p) => {
      let m: RegExpMatchArray | null;
      if ((m = p.match(/^\*\*\*([^*]+)\*\*\*$/))) return `${MU}***</span><strong><em>${this.esc(this.arrows(m[1]))}</em></strong>${MU}***</span>`;
      if ((m = p.match(/^\*\*([^*]+)\*\*$/))) return `${MU}**</span><strong>${this.esc(this.arrows(m[1]))}</strong>${MU}**</span>`;
      if ((m = p.match(/^\*([^*]+)\*$/))) return `${MU}*</span><em>${this.esc(this.arrows(m[1]))}</em>${MU}*</span>`;
      return this.esc(this.arrows(p));
    }).join('');
  }

  /** Inline `code` (markers stay, literal) + [links] + emphasis. */
  private inlineHtml(s: string): string {
    const MU = '<span class="md-muted">';
    return s.split(/(`[^`\n]+`)/g).map((part) => {
      if (/^`[^`\n]+`$/.test(part)) {
        return `${MU}\`</span><code class="md-code-inline">${this.esc(part.slice(1, -1))}</code>${MU}\`</span>`;
      }
      return part.split(/(\[[^\]\n]+\]\([^)\s\n]+\))/g).map((p) => {
        const lm = p.match(/^\[([^\]\n]+)\]\(([^)\s\n]+)\)$/);
        if (lm) return `<a href="${this.esc(this.safeHref(lm[2]))}" target="_blank" rel="noopener" title="${this.esc(lm[2])}" class="underline underline-offset-4 decoration-dotted hover:opacity-70">${this.emHtml(lm[1])}</a>`;
        return this.emHtml(p);
      }).join('');
    }).join('');
  }

  /** A normal markdown line -> HTML. # / > / - markers stay visible (muted). */
  private textHtml(line: string): string {
    const MU = '<span class="md-muted">';
    let m: RegExpMatchArray | null;
    if ((m = line.match(/^(#{1,4})\s(.*)$/))) {
      const cls = m[1].length === 1 ? 'md-h1' : m[1].length === 2 ? 'md-h2' : 'md-h3';
      return `${MU}${m[1]}</span> <span class="${cls}">${this.inlineHtml(m[2])}</span>`;
    }
    if ((m = line.match(/^>\s(.*)$/))) return `${MU}&gt;</span> ${this.inlineHtml(m[1])}`;
    if ((m = line.match(/^-\s(.*)$/)) && !line.startsWith('--')) return `${MU}-</span> ${this.inlineHtml(m[1])}`;
    return this.inlineHtml(line);
  }

  /** Markdown rows -> rendered doc rows (code fences collapsed to one block; outline still 1:1 except code). */
  docLines(): DocLine[] {
    const raw = this.markdownLines();
    const out: DocLine[] = [];
    const blank = (): DocLine => ({ kind: 'blank', text: '', html: '', alt: '', src: '', href: '', fence: false, codeFirst: false, codeLast: false });
    let inCode = false;
    let codeLang = 'python';
    let codeBuf: string[] = [];
    raw.forEach((line) => {
      if (!inCode && line.startsWith('```')) {
        inCode = true;
        codeLang = line.slice(3).trim() || 'python';
        codeBuf = [];
        return;
      }
      if (inCode) {
        if (line === '```') {
          const code = codeBuf.join('\n');
          let highlighted: string;
          try {
            highlighted = hljs.highlight(code, { language: codeLang, ignoreIllegals: true }).value;
          } catch {
            highlighted = this.esc(code);
          }
          const html = `<div class="code-header"><span>${this.esc(codeLang)}</span></div><pre><code class="hljs language-${codeLang}">${highlighted}</code></pre>`;
          out.push({ kind: 'code', text: code, html, alt: '', src: '', href: '', fence: false, codeFirst: true, codeLast: true });
          inCode = false;
          codeBuf = [];
        } else {
          codeBuf.push(line);
        }
        return;
      }
      if (line === '') { out.push(blank()); return; }
      const t = line.trim();
      if (t === '___' || t === '---' || t === '***') {
        out.push({ ...blank(), kind: 'rule', text: line, html: `<span class="md-rule"><span class="md-rule-line"></span><span class="md-muted">${t}</span><span class="md-rule-line"></span></span>` });
        return;
      }
      const img = line.match(/^!\[(.*?)\]\((.*?)\)$/);
      if (img) { out.push({ ...blank(), kind: 'image', alt: this.arrows(img[1]), src: this.resolveImgSrc(img[2]), href: '' }); return; }
      const link = line.match(/^\[(.*?)\]\((.*?)\)$/);
      if (link) { out.push({ ...blank(), kind: 'link', text: link[1], alt: '', src: '', href: this.safeHref(link[2]) }); return; }
      out.push({ ...blank(), kind: 'text', text: line, html: this.textHtml(line) });
    });
    // Round the code-block corners (each fence group is contiguous).
    for (let i = 0; i < out.length; i++) {
      if (out[i].kind !== 'code') continue;
      if (i === 0 || out[i - 1].kind !== 'code') out[i].codeFirst = true;
      if (i === out.length - 1 || out[i + 1].kind !== 'code') out[i].codeLast = true;
    }
    return out;
  }

  scrolltoid(id: any) {
    const element = document.getElementById(id);
    element?.scrollIntoView({
      behavior: 'smooth', // Enables smooth scrolling
      block: 'start',     // Scrolls to the top of the element
      inline: 'nearest'   // Optional: aligns horizontally nearest edge
    });
  }
}
