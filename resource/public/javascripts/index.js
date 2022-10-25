const DOMAIN = "http://localhost:3000";

const State = {
  FETCHING: 1,
  FETCH_FAIL: 2,
  FETCH_SUCCESS: 3,
  NEED_NOT_FETCH: 4,
};

const ErrorType = {
  REQUEST_ERROR: "request_error",
  RESPONSE_ERROR: "reponse_error",
  SYSTEM_ERROR: "system_error",
}

const Message = {
  LOADING: "Loading",
  NOT_IN_CONBAT: "Not in combat"
}

const app = new Vue({
  el: "#app",
  data: {
    message: undefined,
    is_loading: false,
    error: undefined,
    teams: undefined,
  },
});

let latestHash = undefined;
let state = undefined;

/**
 * Stateに応じてビューを更新する
 *
 * @param {State} _state
 * @param {Object} teams
 * @param {Object} error
 */
const updateStatus = (_state, teams = undefined, error = undefined) => {
  state = _state
  switch (_state) {
    case State.FETCHING:
      app.message = Message.LOADING;
      app.is_loading = true;
      break;

    case State.FETCH_FAIL:
      clearInterval(timer);
      app.message = undefined;
      app.is_loading = false;
      app.error = JSON.stringify(error);
      break;

    case State.FETCH_SUCCESS:
      app.message = undefined;
      app.is_loading = false;
      app.teams = teams;
      break;

    case State.NEED_NOT_FETCH:
      app.message = Message.NOT_IN_CONBAT;
      app.is_loading = false;
      break;
  }
};

/**
 * エラーハンドリング
 *
 * @param {Object} axiosError
 */
const handleAxiosError = (axiosError) => {
  if (axiosError.response) {
    updateStatus(State.FETCH_FAIL, undefined, {
      type: ErrorType.RESPONSE_ERROR,
      status: `${axiosError.response.status} ${axiosError.response.statusText}`,
      body: axiosError.response.data,
    });
    return;
  }

  if (axiosError.request) {
    updateStatus(State.FETCH_FAIL, undefined, {
      type: ErrorType.REQUEST_ERROR,
      error: axiosError.request,
    });
    return;
  }

  updateStatus(State.FETCH_FAIL, undefined, {
    type: ErrorType.SYSTEM_ERROR,
    error: axiosError,
  });
};

const looper = async () => {
  if (state === State.FETCHING) {
    return;
  }

  const stateResponse = await axios
    .get(DOMAIN + "/battle/status")
    .catch((error) => handleAxiosError(error));

  if (stateResponse.status === 200) {
    if (stateResponse.data.hash !== latestHash) {
      updateStatus(State.FETCHING);
      const detailResponse = await axios
        .post(DOMAIN + "/battle/detail", stateResponse.data)
        .catch((error) => handleAxiosError(error));
      updateStatus(State.FETCH_SUCCESS, detailResponse.data.teams);
      latestHash = stateResponse.data.hash;
    }
    return;
  }

  if (stateResponse.status === 204) {
    updateStatus(State.NEED_NOT_FETCH);
    return;
  }

  updateStatus(State.FETCH_FAIL, undefined, {
    type: ErrorType.SYSTEM_ERROR,
    status: `${stateResponse.status} ${stateResponse.statusText}`,
    body: stateResponse.data,
  });
};

timer = setInterval(looper, 1000);
