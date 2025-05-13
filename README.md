# My Blog

---

## 📝 Adding a New Article

### 1. Update `articles.json` for Article Listing

Insert the following JSON structure into `articles.json`:

```json
{
  "id": "identification number",
  "title": "Title of the Article",
  "category": "Article's Label",
  "image": "ImageOfArticle.jpg",
  "date": "Feb 9, 2025",
  "description": "Short description of the article"
}
```

### 2. Update `firstblog.json` with Article Content

Each article should be added with the following structure:

```json
{
  "meta": {
    // Article metadata (same or similar to what's in articles.json)
  },
  "data": {
    // Full article content goes here
  }
}
```

---

## 🚀 Deploying the Blog

### Steps:

1. **Add the new article** (as described above).
2. Install GitHub Pages deployment tool:

   ```bash
   ng add angular-cli-ghpages
   ```
3. Deploy the blog to GitHub Pages:

   ```bash
   ng deploy --base-href=/<Personal-Blog>/
   ```


---
