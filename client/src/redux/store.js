import { configureStore } from '@reduxjs/toolkit'
import userSlice from "./userslice"
export default configureStore({
 reducer:{

    user:userSlice
    

  },
})