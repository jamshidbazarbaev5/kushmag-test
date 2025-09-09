import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { BrowserRouter } from 'react-router-dom'
import { LanguageProvider } from './core/context/LanguageContext.tsx'
import './i18n.ts'

const container = document.getElementById('root')!
const root = createRoot(container)

async function initApp() {
  // Ensure i18n is initialized before rendering
  await import('./i18n')
  
  root.render(
    <StrictMode>
      <LanguageProvider>
        <BrowserRouter basename="/app">
          <App />
        </BrowserRouter>
      </LanguageProvider>
    </StrictMode>
  )
}

initApp()
