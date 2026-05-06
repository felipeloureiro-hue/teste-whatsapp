const express = require('express')
const router = express.Router()
const multer = require('multer')
const axios = require('axios')
const db = require('../db')

const upload = multer({ storage: multer.memoryStorage() })
const GRAPH_VERSION = process.env.GRAPH_VERSION || 'v21.0'

function findWaba(brandId, wabaDbId) {
  const brand = db.get('brands').find({ id: brandId }).value()
  if (!brand) return null
  return brand.wabas.find(w => w.id === wabaDbId) || null
}

// ── LIST TEMPLATES ───────────────────────────────────────────────────────────

router.get('/', async (req, res) => {
  const { brandId, wabaId } = req.query
  if (!brandId || !wabaId) {
    return res.status(400).json({ error: 'brandId e wabaId são obrigatórios' })
  }
  const waba = findWaba(brandId, wabaId)
  if (!waba) return res.status(404).json({ error: 'WABA não encontrada' })

  try {
    const response = await axios.get(
      `https://graph.facebook.com/${GRAPH_VERSION}/${waba.wabaId}/message_templates`,
      {
        params: { fields: 'name,status,category,language,components', limit: 200 },
        headers: { Authorization: `Bearer ${waba.accessToken}` },
      }
    )
    res.json(response.data)
  } catch (err) {
    res.status(err.response?.status || 500).json(err.response?.data || { error: err.message })
  }
})

// ── CREATE TEMPLATE ──────────────────────────────────────────────────────────

router.post('/create', upload.single('headerFile'), async (req, res) => {
  const { brandId, wabaId, name, category, bodyText, headerType, headerText, footer, variableExamples } = req.body

  if (!brandId || !wabaId || !name || !category || !bodyText) {
    return res.status(400).json({ error: 'brandId, wabaId, name, category e bodyText são obrigatórios' })
  }

  const waba = findWaba(brandId, wabaId)
  if (!waba) return res.status(404).json({ error: 'WABA não encontrada' })

  const { accessToken, appId, wabaId: metaWabaId } = waba

  let parsedVarExamples = {}
  try {
    parsedVarExamples = typeof variableExamples === 'string'
      ? JSON.parse(variableExamples)
      : (variableExamples || {})
  } catch {
    parsedVarExamples = {}
  }

  // Extract named variables from body text
  const varRegex = /\{\{(\w+)\}\}/g
  const variables = []
  const seen = new Set()
  let match
  while ((match = varRegex.exec(bodyText)) !== null) {
    if (!seen.has(match[1])) {
      seen.add(match[1])
      variables.push(match[1])
    }
  }

  const components = []

  // ── HEADER ──
  if (headerType === 'text' && headerText) {
    components.push({ type: 'HEADER', format: 'TEXT', text: headerText })
  } else if (headerType === 'image' || headerType === 'document') {
    if (!req.file) {
      return res.status(400).json({ error: 'headerFile é obrigatório para header image/document' })
    }

    const fileType = headerType === 'image' ? req.file.mimetype : 'application/pdf'

    try {
      // Step 1: Create upload session
      const sessionRes = await axios.post(
        `https://graph.facebook.com/${GRAPH_VERSION}/${appId}/uploads`,
        null,
        {
          params: {
            file_length: req.file.size,
            file_type: fileType,
            file_name: req.file.originalname,
          },
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      )

      const uploadSessionId = sessionRes.data.id

      // Step 2: Upload file bytes
      const uploadRes = await axios.post(
        `https://graph.facebook.com/${uploadSessionId}`,
        req.file.buffer,
        {
          headers: {
            Authorization: `OAuth ${accessToken}`,
            file_offset: '0',
            'Content-Type': fileType,
          },
          maxBodyLength: Infinity,
          maxContentLength: Infinity,
        }
      )

      const headerHandle = uploadRes.data.h
      components.push({
        type: 'HEADER',
        format: headerType === 'image' ? 'IMAGE' : 'DOCUMENT',
        example: { header_handle: [headerHandle] },
      })
    } catch (err) {
      return res.status(err.response?.status || 500).json({
        error: 'Falha no upload da mídia para a Meta',
        details: err.response?.data || err.message,
      })
    }
  }

  // ── BODY ──
  const bodyComponent = { type: 'BODY', text: bodyText }
  if (variables.length > 0) {
    bodyComponent.example = {
      body_text_named_params: variables.map(varName => ({
        param_name: varName,
        example: parsedVarExamples[varName] || `exemplo_${varName}`,
      })),
    }
  }
  components.push(bodyComponent)

  // ── FOOTER ──
  if (footer && footer.trim()) {
    components.push({ type: 'FOOTER', text: footer.trim() })
  }

  const payload = {
    name,
    category,
    language: 'pt_BR',
    components,
  }

  try {
    const response = await axios.post(
      `https://graph.facebook.com/${GRAPH_VERSION}/${metaWabaId}/message_templates`,
      payload,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    )
    res.json(response.data)
  } catch (err) {
    res.status(err.response?.status || 500).json(err.response?.data || { error: err.message })
  }
})

module.exports = router
