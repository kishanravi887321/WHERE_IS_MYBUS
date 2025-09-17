import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isLoading: false,
}

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginStart: (state) => {
      state.isLoading = true
    },
    loginSuccess: (state, action) => {
      state.isLoading = false
      state.user = action.payload.user
      state.accessToken = action.payload.accessToken
      state.isAuthenticated = true
    },
    loginFailure: (state) => {
      state.isLoading = false
      state.user = null
      state.accessToken = null
      state.isAuthenticated = false
    },
    logout: (state) => {
      state.user = null
      state.accessToken = null
      state.isAuthenticated = false
      state.isLoading = false
    },
    setAuthFromStorage: (state, action) => {
      state.user = action.payload.user
      state.accessToken = action.payload.accessToken
      state.isAuthenticated = true
    }
  },
})

// Export actions
export const { 
  loginStart, 
  loginSuccess, 
  loginFailure, 
  logout, 
  setAuthFromStorage 
} = authSlice.actions

// Export reducer
export default authSlice.reducer