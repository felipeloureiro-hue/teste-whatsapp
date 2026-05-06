const express = require('express')
const router = express.Router()
const db = require('../db')

router.get('/', (_req, res) => {
  res.json(db.get('settings').value())
})

router.put('/', (req, res) => {
  const { appId, accessToken } = req.body
  const updates = {}
  if (appId !== undefined) updates.appId = appId
  if (accessToken !== undefined) updates.accessToken = accessToken
  db.set('settings', { ...db.get('settings').value(), ...updates }).write()
  res.json(db.get('settings').value())
})

module.exports = router
