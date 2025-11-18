import { call, put, takeLatest } from 'redux-saga/effects';
import axios from 'axios';
import { loginRequest, loginSuccess, loginFailure } from '../slices/authSlice';
import { SagaIterator } from 'redux-saga';
import { loginApi } from '../../services/authService';

function* handleLogin(action: ReturnType<typeof loginRequest>): SagaIterator {
  try {
    const { email, password } = action.payload;

    const res = yield call(loginApi, {
      email,
      password,
    });

    const { token, user } = res.data;
    const userWithToken = { ...user, token };
    console.log(userWithToken);

    localStorage.setItem('user', JSON.stringify(userWithToken));
    yield put(loginSuccess(userWithToken));
  } catch (error: any) {
    yield put(loginFailure(error.response?.data?.message || 'Tài khoản hoặc mật khẩu không đúng'));
  }
}

export default function* authSaga() {
  yield takeLatest(loginRequest.type, handleLogin);
}
