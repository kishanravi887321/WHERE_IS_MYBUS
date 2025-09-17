import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  // Add your initial state here
  // Example: user: null, isLoading: false
}

export const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    // Add your reducers here
    // Example:
    // setUser: (state, action) => {
    //   state.user = action.payload
    // },
  },
})

// Export actions
export const { } = appSlice.actions

// Export reducer
export default appSlice.reducer