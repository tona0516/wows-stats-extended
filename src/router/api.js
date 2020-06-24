'use strict'

const FetchDataManager = require('../domain/FetchManager')
const WoWsFileRepository = require('../repository/WoWsFileRepository')
const WoWsAPIClient = require('../infrastructure/WoWsAPIClient')
const WoWsAPIRepository = require('../repository/WoWsAPIRepository')
const WoWsDataShaper = require('../domain/WoWsDataShaper')

const express = require('express')
const router = express.Router()

const wowsFileRepository = new WoWsFileRepository()
const wowsAPIClient = new WoWsAPIClient()
const wowsAPIRepository = new WoWsAPIRepository(wowsFileRepository, wowsAPIClient)
const wowsDataShaper = new WoWsDataShaper()
const fetchManager = new FetchDataManager(wowsAPIRepository, wowsDataShaper)

router.get('/temp_arena_info', (req, res, next) => {
  let tempArenaInfo
  try {
    tempArenaInfo = wowsFileRepository.readTempArenaInfo()
  } catch (error) {
    res.status(500).json({ error: 'failed to read tempArenaInfo.json' })
    return
  }

  if (!tempArenaInfo) {
    res.status(200).json({})
    return
  }

  res.status(200).json(tempArenaInfo)
})

router.post('/fetch_battle', async (req, res, next) => {
  const tempArenaInfo = req.body
  if (!tempArenaInfo) {
    res.status(400).json({ error: 'request body is not json format' })
    return
  }

  const data = await fetchManager.fetch(tempArenaInfo).catch((error) => {
    res.status(500).json({ error: error.message })
  })

  res.status(200).json({ players: data })
})

module.exports = router
