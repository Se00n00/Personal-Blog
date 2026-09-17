// See https://github.com/typicode/json-server#module
require('dotenv').config()
const jsonServer = require('json-server')
const path = require('path')
const { MongoClient, GridFSBucket, ObjectId } = require('mongodb')
const multer = require('multer')

const server = jsonServer.create()

// Load db.json by absolute path so it works both locally and on Vercel
const router = jsonServer.router(path.join(__dirname, '../db.json'))

const middlewares = jsonServer.defaults()

server.use(middlewares)
server.use(jsonServer.bodyParser)

// Allow frontend (GitHub Pages / localhost) to call this API from another origin
server.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*')
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization'
  )
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS')
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200)
  }
  next()
})

// --- MongoDB / GridFS for image uploads + auth ---
// Uses MONGODB_URI env, e.g. mongodb+srv://<db_username>:<db_password>@sky.huh9av8.mongodb.net/?appName=Sky
// The json-server db.json holds articles/blogs; authors & images live in MongoDB.
const MONGODB_URI = process.env.MONGODB_URI || ''
let mongoClient = null
let bucket = null
let mongoReady = false
let mongoError = null
const bcrypt = require('bcryptjs')

async function initMongo() {
  if (!MONGODB_URI) {
    mongoError = 'MONGODB_URI not set'
    console.warn('[mongo] MONGODB_URI not set — image upload will be disabled (still serving db.json)')
    return
  }
  try {
    mongoClient = new MongoClient(MONGODB_URI, { serverSelectionTimeoutMS: 5000 })
    await mongoClient.connect()
    const db = mongoClient.db('personal-blog')
    bucket = new GridFSBucket(db, { bucketName: 'images' })
    mongoReady = true
    mongoError = null
    console.log('[mongo] connected, GridFS bucket `images` ready (personal-blog)')
  } catch (e) {
    mongoError = e.message
    console.warn('[mongo] connection failed — image upload disabled:', e.message)
  }
}
initMongo()

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (/^image\//.test(file.mimetype)) cb(null, true)
    else cb(new Error('Only images allowed'))
  }
})

// POST /api/upload  — field `image`, returns { url, fileId, filename }
// URL can be dropped into markdown as ![alt](url)
server.post('/api/upload', upload.single('image'), async (req, res) => {
  if (!mongoReady || !bucket) {
    return res.status(503).json({ error: 'Image storage not ready (MongoDB not connected). Check MONGODB_URI.' })
  }
  if (!req.file) return res.status(400).json({ error: 'No image file (field `image`)' })
  try {
    const filename = `${Date.now()}-${req.file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_')}`
    const uploadStream = bucket.openUploadStream(filename, {
      contentType: req.file.mimetype,
      metadata: { originalName: req.file.originalname }
    })
    uploadStream.end(req.file.buffer)
    await new Promise((resolve, reject) => {
      uploadStream.on('finish', resolve)
      uploadStream.on('error', reject)
    })
    const fileId = uploadStream.id.toString()
    const url = `/api/images/${fileId}`
    // absolute URL for convenience when behind proxy
    const host = req.get('host')
    const proto = req.get('x-forwarded-proto') || req.protocol
    const absoluteUrl = host ? `${proto}://${host}${url}` : url
    res.json({ url, absoluteUrl, fileId, filename, contentType: req.file.mimetype })
  } catch (e) {
    console.error('[upload] failed', e)
    res.status(500).json({ error: 'Upload failed', details: e.message })
  }
})

// GET /api/images/:id — stream image from GridFS
server.get('/api/images/:id', async (req, res) => {
  if (!mongoReady || !bucket) return res.status(503).json({ error: 'Image storage not ready' })
  try {
    const id = new ObjectId(req.params.id)
    const files = await bucket.find({ _id: id }).toArray()
    if (!files.length) return res.status(404).json({ error: 'Not found' })
    const file = files[0]
    res.set('Content-Type', file.contentType || 'application/octet-stream')
    res.set('Cache-Control', 'public, max-age=31536000')
    bucket.openDownloadStream(id).pipe(res)
  } catch (e) {
    res.status(400).json({ error: 'Invalid id', details: e.message })
  }
})

// Health for uploads — includes last error so you can debug Vercel without logs
server.get('/api/upload/health', (_req, res) => {
  res.json({ mongoReady, hasUri: !!MONGODB_URI, mongoError: mongoError || null, uriPrefix: MONGODB_URI ? MONGODB_URI.slice(0, 32) + '...' : null })
})

// --- Auth via MongoDB (replaces db.json authors) ---
server.post('/api/login', async (req, res) => {
  if (!mongoReady || !mongoClient) return res.status(503).json({ error: 'Auth not ready' })
  const { username, password } = req.body || {}
  if (!username || !password) return res.status(400).json({ error: 'Missing username/password' })
  try {
    const db = mongoClient.db('personal-blog')
    const user = await db.collection('authors').findOne({ username: String(username).trim() })
    if (!user) return res.json(null)
    const ok = await bcrypt.compare(String(password), user.password)
    if (!ok) return res.json(null)
    const { password: _pw, ...safe } = user
    res.json(safe)
  } catch (e) {
    res.status(500).json({ error: 'Login failed', details: e.message })
  }
})

// Backward compat: old frontend did GET /authors?username=&password= — now proxy to MongoDB
async function handleGetAuthors(req, res) {
  if (!mongoReady || !mongoClient) return res.json([])
  const { username, password } = req.query || {}
  if (!username || !password) return res.json([])
  try {
    const db = mongoClient.db('personal-blog')
    const user = await db.collection('authors').findOne({ username: String(username).trim() })
    if (!user) return res.json([])
    const ok = await bcrypt.compare(String(password), user.password)
    if (!ok) return res.json([])
    const { password: _pw, ...safe } = user
    res.json([safe])
  } catch (e) {
    res.json([])
  }
}
server.get('/api/authors', handleGetAuthors)
server.get('/authors', handleGetAuthors)

// Add this before server.use(router)
// /api/articles -> /articles, /api/blogs -> /blogs, /api/blogs/1 -> /blogs/1
server.use(
  jsonServer.rewriter({
    '/api/*': '/$1',
    '/blog/:resource/:id/show': '/:resource/:id'
  })
)

server.use(router)

// Only listen when run directly (local dev: `npm start`).
// On Vercel the exported server is used as a serverless function — do NOT listen.
if (require.main === module) {
  const port = process.env.PORT || 3000
  server.listen(port, () => {
    console.log(`JSON Server is running on port ${port}`)
  })
}

// Export the Server API
module.exports = server
