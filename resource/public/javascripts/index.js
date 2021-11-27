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
  FETCHING: 1,
  FETCH_FAIL: 2,
  FETCH_SUCCESS: 3,
  NEED_NOT_FETCH: 4,
};

/**
 * 状態に応じてViewと変数を更新する
 *
 * @param {Status} status
 * @param {Object} teams
 * @param {Object} error
 */
const updateStatus = (status, teams = undefined, error = undefined) => {
  switch (status) {
    case Status.FETCHING:
      isFetching = true;
      app.message = "Loading...";
      break;

    case Status.FETCH_FAIL:
      isFetching = false;
      app.message = undefined;
      app.error = JSON.stringify(error);
      break;

    case Status.FETCH_SUCCESS:
      isFetching = false;
      app.message = undefined;
      app.teams = teams;
      break;

    case Status.NEED_NOT_FETCH:
      app.message = "In non-combat";
      break;
  }
};

/**
 * エラーハンドリング
 *
 * @param {Object} axiosError
 */
const handleError = (axiosError) => {
  clearInterval(timer);
  if (axiosError.response) {
    updateStatus(Status.FETCH_FAIL, undefined, {
      type: "response_error",
      status: `${axiosError.response.status} ${axiosError.response.statusText}`,
      body: axiosError.response.data,
    });
    return;
  }

  if (axiosError.request) {
    updateStatus(Status.FETCH_FAIL, undefined, {
      type: "request_error",
      error: axiosError.request,
    });
    return;
  }

  updateStatus(Status.FETCH_FAIL, undefined, {
    type: "other",
    error: axiosError,
  });
};

const looper = async () => {
  if (isFetching) {
    return;
  }

  const stateResponse = await axios
    .get(DOMAIN + "/battle/status")
    .catch((error) => handleError(error));

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
