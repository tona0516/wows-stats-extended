/* eslint-disable no-undef */

// ##### Change port if you want #####
const PORT = 3000
// ###################################
const DOMAIN = 'http://localhost:' + PORT

const app = new Vue({
  el: '#app',
  data: {
    message: null,
    error: null,
    players: {}
  }
})

const FETCH_INTERVAL_MS = 1000
let isFetching = false
let latestTempArenaInfo = null

const Status = {
  NEED_NOT_FETCH: 1,
  FETCHING: 2,
  FETCH_FAIL: 3,
  FETCH_SUCCESS: 4
}

/**
 * JSONをリクエストする
 *
 * @param {String} url
 */
const requestJSON = (url, method = 'GET', headers = null, body = null) => {
  return new Promise((resolve, reject) => {
    try {
      const xhr = new XMLHttpRequest()
      xhr.open(method, url)
      if (headers !== null) {
        for (const [key, value] of Object.entries(headers)) {
          xhr.setRequestHeader(key, value)
        }
      }
      xhr.addEventListener('load', (event) => {
        const statusCode = event.target.status
        const responseBody = JSON.parse(event.target.responseText)

        resolve({ statusCode: statusCode, responseBody: responseBody })
      })
      xhr.send(body)
    } catch (error) {
      reject(error)
    }
  })
}

/**
 * tempArenaInfo.jsonを取得する
 */
const fetchTempArenaInfo = () => {
  return new Promise((resolve, reject) => {
    requestJSON(DOMAIN + '/api/temp_arena_info').then(result => {
      if (result.statusCode === 200) {
        resolve(result.responseBody)
      } else {
        reject(result.responseBody.error)
      }
    })
  })
}

/**
 * tempArenaInfoに基づいて戦闘データを取得すうr
 *
 * @param {JSON} tempArenaInfo
 */
const fetchBattle = (tempArenaInfo) => {
  return new Promise((resolve, reject) => {
    const headers = { 'Content-Type': 'application/json' }
    requestJSON(DOMAIN + '/api/fetch_battle', 'POST', headers, tempArenaInfo).then(result => {
      if (result.statusCode === 200) {
        resolve(result.responseBody.players)
      } else {
        reject(result.responseBody.error)
      }
    })
  })
}

/**
 * 状態に応じてViewと変数を更新する
 *
 * @param {Status} status
 * @param {Array} players
 * @param {Array} error
 */
const updateStatus = (status, players = null, error = null) => {
  switch (status) {
    case Status.NEED_NOT_FETCH:
      app.message = '現在戦闘中ではありません。戦闘開始時に自動更新します。'
      break

    case Status.FETCHING:
      isFetching = true
      app.message = '読み込み中...'
      break

    case Status.FETCH_FAIL:
      isFetching = false
      isFirstFetch = false
      app.message = null
      app.error = '読み込みに失敗しました。もう一度お試しください: ' + JSON.stringify(error)
      break

    case Status.FETCH_SUCCESS:
      isFetching = false
      isFirstFetch = false
      app.message = null
      app.players = players
      break

    default:
      break
  }
}

/**
 * エラーハンドリング
 *
 * @param {Array} error
 */
const handleError = (error) => {
  clearInterval(timer)
  updateStatus(Status.FETCH_FAIL, null, error)
}

const looper = async () => {
  if (isFetching) {
    return
  }

  const tempArenaInfo = await fetchTempArenaInfo().catch((error) => handleError(error))
  if (!Object.keys(tempArenaInfo).length) {
    updateStatus(Status.NEED_NOT_FETCH, null, null)
    return
  }

  if (tempArenaInfo !== latestTempArenaInfo) {
    updateStatus(Status.FETCHING, null, null)
    const players = await fetchBattle(tempArenaInfo).catch((error) => handleError(error))
    updateStatus(Status.FETCH_SUCCESS, players, null)
    latestTempArenaInfo = tempArenaInfo
  }
}

timer = setInterval(looper, FETCH_INTERVAL_MS)
