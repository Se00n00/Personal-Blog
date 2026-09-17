import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ArticleListItem, BlogPost, BlogService } from '../services/blog.service';
import { environment } from '../../environments/environment';
import hljs from 'highlight.js';

function blankBlock(datatype: string): any {
  switch (datatype) {
    case 'keywords': return { datatype, value: [] };
    case 'list': return { datatype, value: [] };
    case 'quote': return { datatype, value: '', quoter: '' };
    case 'image': return { datatype, imageSrc: '', imageTitle: '' };
    case 'site': return { datatype, siteTitle: '', siteSubTitle: '', siteLink: '' };
    case 'code': return { datatype, language: '', value: '' };
    case 'code_text': return { datatype, language: '', value: '', codeDescription: '' };
    default: return { datatype, value: '' };
  }
}

@Component({
  selector: 'app-create',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './create.component.html',
  styleUrl: './create.component.css'
})
export class CreateComponent implements OnInit {
  private blogService = inject(BlogService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  conditioned: string = '';

  /** Edit mode when the route carries an article id (/edit/:id). */
  editMode = false;
  private blogId: string | null = null;

  title = '';
  description = '';
  category = '';
  image = '';
  markdown = '';
  blocks: any[] = [];
  private feedbacks: any[] = [];
  private originalDate = '';
  private originalViews = 0;
  private originalLikes = '0';

  loading = false;
  saving = false;
  error: string | null = null;
  preview = false;

  // image upload for markdown references — stored in MongoDB GridFS
  uploadingImage = false;
  uploadedImages: { url: string; absoluteUrl: string; fileId: string; filename: string }[] = [];
  imageUploadError: string | null = null;

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.editMode = true;
      this.blogId = id;
      this.loading = true;
      this.blogService.getBlog(id).subscribe({
        next: (blog) => {
          this.loading = false;
          this.title = blog.meta.title ?? '';
          this.description = blog.meta.description ?? '';
          this.category = blog.meta.category ?? '';
          this.image = blog.meta.image ?? '';
          this.originalDate = blog.meta.date ?? '';
          this.originalViews = blog.meta.views ?? 0;
          this.originalLikes = blog.meta.likes ?? '0';
          const rawContent = (blog as any).content ?? (blog as any).markdown;
          if (typeof rawContent === 'string') {
            this.markdown = rawContent;
          } else if (typeof blog.data === 'string') {
            this.markdown = blog.data as unknown as string;
          } else if (Array.isArray(blog.data)) {
            this.markdown = this.dataToMarkdown(blog.data);
          } else {
            this.markdown = '';
          }
          this.blocks = Array.isArray(blog.data) ? blog.data : [];
          this.feedbacks = Array.isArray(blog.feedbacks) ? blog.feedbacks : [];
        },
        error: () => {
          this.loading = false;
          this.router.navigate(['/404']);
        }
      });
    }
  }

  private dataToMarkdown(data: any[]): string {
    const lines: string[] = [];
    const push = (...ls: string[]) => lines.push(...ls);
    for (const item of data ?? []) {
      const v = item?.value;
      switch (item?.datatype) {
        case 'heading': push(`# ${v}`, ''); break;
        case 'subHeading': push(`## ${v}`, ''); break;
        case 'text':
        case 'subText': push(...String(v ?? '').split('\n'), ''); break;
        case 'quote':
          String(v ?? '').split('\n').forEach((ln: string) => push(`> ${ln}`));
          if (item.quoter) String(item.quoter).split('\n').forEach((ln: string) => push(`> — ${ln}`));
          push('');
          break;
        case 'explanation':
          String(v ?? '').split('\n').forEach((ln: string) => push(`> ${ln}`));
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
        case 'keywords': break;
        default:
          if (typeof v === 'string' && v) push(v, '');
          else if (Array.isArray(v)) { for (const li of v) push(`- ${li}`); push(''); }
          break;
      }
    }
    while (lines.length && lines[lines.length - 1] === '') lines.pop();
    return lines.join('\n');
  }

  togglePreview() {
    this.preview = !this.preview;
  }

  onImageSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    this.imageUploadError = null;
    this.uploadingImage = true;
    this.blogService.uploadImage(file).subscribe({
      next: (res) => {
        this.uploadingImage = false;
        this.uploadedImages = [res, ...this.uploadedImages].slice(0, 8);
        // reset input so same file can be re-selected
        input.value = '';
      },
      error: (err) => {
        this.uploadingImage = false;
        this.imageUploadError = err?.error?.error || err?.message || 'Upload failed';
      }
    });
  }

  copyMarkdown(img: { url: string; absoluteUrl: string; filename: string }) {
    const md = `![${img.filename}](${img.url})`;
    navigator.clipboard.writeText(md);
    // also insert at cursor if possible
    const ta = document.querySelector('textarea') as HTMLTextAreaElement | null;
    if (ta) {
      const start = ta.selectionStart ?? ta.value.length;
      const end = ta.selectionEnd ?? ta.value.length;
      const before = this.markdown.slice(0, start);
      const after = this.markdown.slice(end);
      const insert = (before && !before.endsWith('\n') ? '\n' : '') + md + (after && !after.startsWith('\n') ? '\n' : '');
      this.markdown = before + insert + after;
      setTimeout(() => {
        ta.focus();
        const pos = before.length + insert.length;
        ta.setSelectionRange(pos, pos);
        this.autoResize({ target: ta } as unknown as Event);
      });
    }
  }

  autoResize(event: Event) {
    const ta = event.target as HTMLTextAreaElement;
    ta.style.height = 'auto';
    ta.style.height = ta.scrollHeight + 'px';
  }

  private esc(s: string): string {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  private arrows(s: string): string {
    return s.replace(/<-->/g, '⟷').replace(/<->/g, '↔').replace(/<--/g, '←').replace(/-->/g, '→').replace(/=>/g, '⇒');
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

  previewMarkdownLines(): string[] {
    return this.markdown.split('\n');
  }

  previewDocLines(): any[] {
    const raw = this.previewMarkdownLines();
    const out: any[] = [];
    const blank = () => ({ kind: 'blank', text: '', html: '', alt: '', src: '', href: '', fence: false, codeFirst: false, codeLast: false });
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
    if (inCode && codeBuf.length) {
      const code = codeBuf.join('\n');
      let highlighted: string;
      try {
        highlighted = hljs.highlight(code, { language: codeLang, ignoreIllegals: true }).value;
      } catch {
        highlighted = this.esc(code);
      }
      const html = `<div class="code-header"><span>${this.esc(codeLang)}</span></div><pre><code class="hljs language-${codeLang}">${highlighted}</code></pre>`;
      out.push({ kind: 'code', text: code, html, alt: '', src: '', href: '', fence: false, codeFirst: true, codeLast: true });
    }
    return out;
  }

  addBlock(datatype: string) {
    this.blocks = [...this.blocks, blankBlock(datatype)];
  }

  removeBlock(index: number) {
    this.blocks = this.blocks.filter((_, i) => i !== index);
  }

  /** keywords / list blocks are edited one entry per line. */
  blockLines(block: any): string {
    const v = block?.value;
    return Array.isArray(v) ? v.join('\n') : (v ?? '');
  }

  setBlockLines(block: any, text: string) {
    block.value = text.split('\n').map((s) => s.trim()).filter((s) => s.length > 0);
  }

  save() {
    if (!this.title.trim() || this.saving) {
      return;
    }
    this.saving = true;
    this.error = null;

    if (this.editMode && this.blogId) {
      const id = this.blogId;
      const blog: BlogPost = {
        id,
        meta: {
          id,
          title: this.title.trim(),
          category: this.category.trim(),
          image: this.image.trim(),
          date: this.originalDate,
          views: this.originalViews,
          likes: this.originalLikes,
          description: this.description.trim()
        },
        data: [] as any,
        content: this.markdown,
        feedbacks: this.feedbacks
      } as unknown as BlogPost;
      this.blogService.updateBlog(blog).subscribe({
        next: () => {
          this.blogService.updateArticleMeta(id, {
            title: blog.meta.title,
            category: blog.meta.category,
            image: blog.meta.image,
            description: blog.meta.description
          }).subscribe({
            next: () => this.router.navigate(['/article', id]),
            error: () => this.fail('Article saved, but the listing could not be updated.')
          });
        },
        error: () => this.fail('Could not save the article. Is the API running?')
      });
    } else {
      const id = crypto.randomUUID();
      const date = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      const blog: BlogPost = {
        id,
        meta: {
          id,
          title: this.title.trim(),
          category: this.category.trim(),
          image: this.image.trim(),
          date,
          views: 0,
          likes: '0',
          description: this.description.trim()
        },
        data: [] as any,
        content: this.markdown,
        feedbacks: []
      } as unknown as BlogPost;
      const article: ArticleListItem = {
        id,
        title: blog.meta.title,
        category: blog.meta.category,
        image: blog.meta.image,
        date,
        views: 0,
        likes: '0',
        description: blog.meta.description
      };
      this.blogService.createBlog(blog).subscribe({
        next: () => {
          this.blogService.createArticle(article).subscribe({
            next: () => this.router.navigate(['/article', id]),
            error: () => this.fail('Article saved, but it could not be added to the listing.')
          });
        },
        error: () => this.fail('Could not publish the article. Is the API running?')
      });
    }
  }

  private fail(message: string) {
    this.saving = false;
    this.error = message;
  }

  // Legacy stubs kept for compatibility with the block palette template.
  create_quote(_quote: HTMLDivElement) { this.addBlock('quote'); }
  create_image(_image: HTMLDivElement) { this.addBlock('image'); }
  create_text(_text: HTMLDivElement) { this.addBlock('text'); }
  create_heading(_heading: HTMLDivElement) { this.addBlock('heading'); }
  create_sub_heading(_sub_heading: HTMLDivElement) { this.addBlock('subHeading'); }
  create_code(_code: HTMLDivElement) { this.addBlock('code'); }
  create_code_text(_code_text: HTMLDivElement) { this.addBlock('code_text'); }
  create_list(_list: HTMLDivElement) { this.addBlock('list'); }
  create_tags(_tags: HTMLDivElement) { this.addBlock('keywords'); }
}
