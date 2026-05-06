const express = require('express')
const router = express.Router()
const { v4: uuidv4 } = require('uuid')
const db = require('../db')

// ── BRANDS ──────────────────────────────────────────────────────────────────

router.get('/', (_req, res) => {
  res.json(db.get('brands').value())
})

router.post('/', (req, res) => {
  const { name } = req.body
  if (!name || !name.trim()) return res.status(400).json({ error: 'name é obrigatório' })
  const brand = { id: uuidv4(), name: name.trim(), wabas: [], destinations: [] }
  db.get('brands').push(brand).write()
  res.status(201).json(brand)
})

router.put('/:brandId', (req, res) => {
  const { brandId } = req.params
  const { name } = req.body
  const brand = db.get('brands').find({ id: brandId }).value()
  if (!brand) return res.status(404).json({ error: 'Marca não encontrada' })
  if (!name || !name.trim()) return res.status(400).json({ error: 'name é obrigatório' })
  db.get('brands').find({ id: brandId }).assign({ name: name.trim() }).write()
  res.json(db.get('brands').find({ id: brandId }).value())
})

router.delete('/:brandId', (req, res) => {
  const { brandId } = req.params
  if (!db.get('brands').find({ id: brandId }).value()) {
    return res.status(404).json({ error: 'Marca não encontrada' })
  }
  db.get('brands').remove({ id: brandId }).write()
  res.json({ success: true })
})

// ── WABAS ────────────────────────────────────────────────────────────────────

router.get('/:brandId/wabas', (req, res) => {
  const brand = db.get('brands').find({ id: req.params.brandId }).value()
  if (!brand) return res.status(404).json({ error: 'Marca não encontrada' })
  res.json(brand.wabas)
})

router.post('/:brandId/wabas', (req, res) => {
  const { brandId } = req.params
  const { wabaId, appId, accessToken } = req.body
  if (!wabaId || !appId || !accessToken) {
    return res.status(400).json({ error: 'wabaId, appId e accessToken são obrigatórios' })
  }
  const brand = db.get('brands').find({ id: brandId }).value()
  if (!brand) return res.status(404).json({ error: 'Marca não encontrada' })
  const waba = { id: uuidv4(), wabaId, appId, accessToken, phoneNumbers: [] }
  db.get('brands').find({ id: brandId }).get('wabas').push(waba).write()
  res.status(201).json(waba)
})

router.put('/:brandId/wabas/:wabaDbId', (req, res) => {
  const { brandId, wabaDbId } = req.params
  const brand = db.get('brands').find({ id: brandId }).value()
  if (!brand) return res.status(404).json({ error: 'Marca não encontrada' })
  const waba = db.get('brands').find({ id: brandId }).get('wabas').find({ id: wabaDbId }).value()
  if (!waba) return res.status(404).json({ error: 'WABA não encontrada' })
  const updates = {}
  const { wabaId, appId, accessToken } = req.body
  if (wabaId) updates.wabaId = wabaId
  if (appId) updates.appId = appId
  if (accessToken) updates.accessToken = accessToken
  db.get('brands').find({ id: brandId }).get('wabas').find({ id: wabaDbId }).assign(updates).write()
  res.json(db.get('brands').find({ id: brandId }).get('wabas').find({ id: wabaDbId }).value())
})

router.delete('/:brandId/wabas/:wabaDbId', (req, res) => {
  const { brandId, wabaDbId } = req.params
  const brand = db.get('brands').find({ id: brandId }).value()
  if (!brand) return res.status(404).json({ error: 'Marca não encontrada' })
  db.get('brands').find({ id: brandId }).get('wabas').remove({ id: wabaDbId }).write()
  res.json({ success: true })
})

// ── PHONE NUMBERS ────────────────────────────────────────────────────────────

router.get('/:brandId/wabas/:wabaDbId/phones', (req, res) => {
  const { brandId, wabaDbId } = req.params
  const brand = db.get('brands').find({ id: brandId }).value()
  if (!brand) return res.status(404).json({ error: 'Marca não encontrada' })
  const waba = brand.wabas.find(w => w.id === wabaDbId)
  if (!waba) return res.status(404).json({ error: 'WABA não encontrada' })
  res.json(waba.phoneNumbers)
})

router.post('/:brandId/wabas/:wabaDbId/phones', (req, res) => {
  const { brandId, wabaDbId } = req.params
  const { phoneNumberId, label } = req.body
  if (!phoneNumberId || !label) {
    return res.status(400).json({ error: 'phoneNumberId e label são obrigatórios' })
  }
  const brand = db.get('brands').find({ id: brandId }).value()
  if (!brand) return res.status(404).json({ error: 'Marca não encontrada' })
  const waba = brand.wabas.find(w => w.id === wabaDbId)
  if (!waba) return res.status(404).json({ error: 'WABA não encontrada' })
  const phone = { id: uuidv4(), phoneNumberId, label }
  db.get('brands').find({ id: brandId }).get('wabas').find({ id: wabaDbId }).get('phoneNumbers').push(phone).write()
  res.status(201).json(phone)
})

router.put('/:brandId/wabas/:wabaDbId/phones/:phoneId', (req, res) => {
  const { brandId, wabaDbId, phoneId } = req.params
  const updates = {}
  const { phoneNumberId, label } = req.body
  if (phoneNumberId) updates.phoneNumberId = phoneNumberId
  if (label) updates.label = label
  db.get('brands').find({ id: brandId }).get('wabas').find({ id: wabaDbId }).get('phoneNumbers').find({ id: phoneId }).assign(updates).write()
  const updated = db.get('brands').find({ id: brandId }).get('wabas').find({ id: wabaDbId }).get('phoneNumbers').find({ id: phoneId }).value()
  if (!updated) return res.status(404).json({ error: 'Número não encontrado' })
  res.json(updated)
})

router.delete('/:brandId/wabas/:wabaDbId/phones/:phoneId', (req, res) => {
  const { brandId, wabaDbId, phoneId } = req.params
  db.get('brands').find({ id: brandId }).get('wabas').find({ id: wabaDbId }).get('phoneNumbers').remove({ id: phoneId }).write()
  res.json({ success: true })
})

// ── DESTINATION NUMBERS ──────────────────────────────────────────────────────

router.get('/:brandId/destinations', (req, res) => {
  const brand = db.get('brands').find({ id: req.params.brandId }).value()
  if (!brand) return res.status(404).json({ error: 'Marca não encontrada' })
  res.json(brand.destinations ?? [])
})

router.post('/:brandId/destinations', (req, res) => {
  const { brandId } = req.params
  const { number, label } = req.body
  if (!number || !label) return res.status(400).json({ error: 'number e label são obrigatórios' })
  const brand = db.get('brands').find({ id: brandId }).value()
  if (!brand) return res.status(404).json({ error: 'Marca não encontrada' })
  const dest = { id: uuidv4(), number, label }
  if (!brand.destinations) {
    db.get('brands').find({ id: brandId }).set('destinations', [dest]).write()
  } else {
    db.get('brands').find({ id: brandId }).get('destinations').push(dest).write()
  }
  res.status(201).json(dest)
})

router.put('/:brandId/destinations/:destId', (req, res) => {
  const { brandId, destId } = req.params
  const brand = db.get('brands').find({ id: brandId }).value()
  if (!brand) return res.status(404).json({ error: 'Marca não encontrada' })
  const updates = {}
  const { number, label } = req.body
  if (number) updates.number = number
  if (label) updates.label = label
  db.get('brands').find({ id: brandId }).get('destinations').find({ id: destId }).assign(updates).write()
  const updated = db.get('brands').find({ id: brandId }).get('destinations').find({ id: destId }).value()
  if (!updated) return res.status(404).json({ error: 'Destino não encontrado' })
  res.json(updated)
})

router.delete('/:brandId/destinations/:destId', (req, res) => {
  const { brandId, destId } = req.params
  db.get('brands').find({ id: brandId }).get('destinations').remove({ id: destId }).write()
  res.json({ success: true })
})

module.exports = router
