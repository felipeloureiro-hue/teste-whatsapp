require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') })

const express = require('express')
const cors = require('cors')

const brandsRouter = require('./routes/brands')
const templatesRouter = require('./routes/templates')
const messagesRouter = require('./routes/messages')
const settingsRouter = require('./routes/settings')

const app = express()

app.use(cors())
app.use(express.json())

app.use('/api/brands', brandsRouter)
app.use('/api/templates', templatesRouter)
app.use('/api/messages', messagesRouter)
app.use('/api/settings', settingsRouter)

app.get('/api/health', (_req, res) => res.json({ ok: true }))

const PORT = 3001
app.listen(PORT, () => {
  console.log(`\n  Backend rodando em http://localhost:${PORT}\n`)
})
