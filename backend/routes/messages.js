const express = require('express')
const router = express.Router()
const axios = require('axios')
const db = require('../db')

const GRAPH_VERSION = process.env.GRAPH_VERSION || 'v21.0'

router.post('/send-test', async (req, res) => {
  const { brandId, wabaId, phoneNumberId, to, templateName, headerMedia, variables } = req.body

  if (!brandId || !wabaId || !phoneNumberId || !to || !templateName) {
    return res.status(400).json({
      error: 'brandId, wabaId, phoneNumberId, to e templateName são obrigatórios',
    })
  }

  const brand = db.get('brands').find({ id: brandId }).value()
  if (!brand) return res.status(404).json({ error: 'Marca não encontrada' })

  const waba = brand.wabas.find(w => w.id === wabaId)
  if (!waba) return res.status(404).json({ error: 'WABA não encontrada' })

  const { accessToken } = waba

  const components = []

  if (headerMedia && headerMedia.url && headerMedia.type) {
    components.push({
      type: 'header',
      parameters: [
        {
          type: headerMedia.type,
          [headerMedia.type]: { link: headerMedia.url },
        },
      ],
    })
  }

  const vars = variables || {}
  if (Object.keys(vars).length > 0) {
    components.push({
      type: 'body',
      parameters: Object.entries(vars).map(([k, v]) => ({
        type: 'text',
        parameter_name: k,
        text: String(v),
      })),
    })
  }

  const payload = {
    messaging_product: 'whatsapp',
    to,
    type: 'template',
    template: {
      name: templateName,
      language: { code: 'pt_BR' },
      components,
    },
  }

  try {
    const response = await axios.post(
      `https://graph.facebook.com/${GRAPH_VERSION}/${phoneNumberId}/messages`,
      payload,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    )
    res.json(response.data)
  } catch (err) {
    res.status(err.response?.status || 500).json(err.response?.data || { error: err.message })
  }
})

module.exports = router
