import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { MantineProvider } from '@mantine/core'
import '@mantine/core/styles.css'
import '@mantine/dates/styles.css'
import { store } from './store/index.js'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Provider store={store}>
      <MantineProvider 
        theme={{
          colors: {
            yellow: ['#FFF9E6', '#FFF3CC', '#FFECB3', '#FFE599', '#FFDE80', '#FFD666', '#FFCF4D', '#FFC900', '#E6B500', '#CCA000'],
            orange: ['#FFF4E6', '#FFEBCC', '#FFE1B3', '#FFD799', '#FFCC80', '#FFC266', '#FFB84D', '#FF9B00', '#E68B00', '#CC7A00'],
          },
          primaryColor: 'orange',
        }}
      >
        <App />
      </MantineProvider>
    </Provider>
  </StrictMode>,
)
