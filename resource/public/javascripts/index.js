/* eslint-disable no-undef */

// ##### Change port if you want #####
const PORT = 3000;
const FETCH_INTERVAL_MS = 1000;
// ###################################
const DOMAIN = "http://localhost:" + PORT;

const app = new Vue({
  el: "#app",
  data: {
    message: undefined,
    error: undefined,
    teams: undefined,
  },
});

let isFetching = false;
let latestHash = undefined;

const Status = {
  NEED_NOT_FETCH: 1,
  FETCHING: 2,
  FETCH_FAIL: 3,
  FETCH_SUCCESS: 4,
};

/**
 * 状態に応じてViewと変数を更新する
 *
 * @param {Status} status
 * @param {Object} teams
 * @param {Array} error
 */
const updateStatus = (status, teams = undefined, error = undefined) => {
  switch (status) {
    case Status.NEED_NOT_FETCH:
      app.message = "In non-combat";
      break;

    case Status.FETCHING:
      isFetching = true;
      app.message = "Loading...";
      break;

    case Status.FETCH_FAIL:
      isFetching = false;
      isFirstFetch = false;
      app.message = undefined;
      app.error =
        "Failed to display data. Please reload page." + JSON.stringify(error);
      break;

    case Status.FETCH_SUCCESS:
      isFetching = false;
      isFirstFetch = false;
      app.message = undefined;
      app.teams = teams;
      break;

    default:
      break;
  }
};

/**
 * エラーハンドリング
 *
 * @param {Array} error
 */
const handleError = (error) => {
  clearInterval(timer);
  updateStatus(Status.FETCH_FAIL, undefined, error);
};

const looper = async () => {
  if (isFetching) {
    return;
  }

  const stateResponse = await axios
    .get(DOMAIN + "/battle/status")
    .catch((error) => {
      handleError(error);
    });

  switch (stateResponse.status) {
    case 200:
      if (stateResponse.data.hash !== latestHash) {
        updateStatus(Status.FETCHING);
        const detailResponse = await axios
          .post(DOMAIN + "/battle/detail", stateResponse.data)
          .catch((error) => handleError(error));
        updateStatus(Status.FETCH_SUCCESS, detailResponse.data.teams);
        latestHash = stateResponse.data.hash;
      }
      break;
    case 204:
      updateStatus(Status.NEED_NOT_FETCH);
      break;
    default:
      const error = JSON.parse({
        error: "system error",
      });
      handleError(error);
      break;
  }
};

timer = setInterval(looper, FETCH_INTERVAL_MS);
