import { configureStore } from '@reduxjs/toolkit'
import appReducer from './slices/appSlice'

export const store = configureStore({
  reducer: {
    app: appReducer,
    // Add more slice reducers here
    // Example: auth: authSlice,
  },
})

export default store