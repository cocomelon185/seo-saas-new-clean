import React from 'react'
import { ViteReactSSG } from 'vite-react-ssg/single-page'
import App from './App'

export const createRoot = ViteReactSSG(<App />)
