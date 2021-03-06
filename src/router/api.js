'use strict'

const FetchDataManager = require('../domain/FetchManager')
const WoWsFileRepository = require('../repository/WoWsFileRepository')
const WoWsAPIClient = require('../infrastructure/WoWsAPIClient')
const WoWsAPIRepository = require('../repository/WoWsAPIRepository')
const WoWsDataShaper = require('../domain/WoWsDataShaper')
const WoWsScrapeRepository = require('../repository/WoWsScrapeRepository')

const express = require('express')
const router = express.Router()

const wowsFileRepository = new WoWsFileRepository()
const fetchManager = new FetchDataManager(
  new WoWsAPIRepository(
    wowsFileRepository,
    new WoWsAPIClient()
  ),
  new WoWsDataShaper(),
  new WoWsScrapeRepository(
    wowsFileRepository
  )
)

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
    res.status(400).json({ error: 'tempArenaInfo is not json format' })
    return
  }

  const data = await fetchManager.fetch(tempArenaInfo).catch((error) => {
    res.status(500).json({ error: error.message })
  })

  res.status(200).json({ players: data })
})

module.exports = router
