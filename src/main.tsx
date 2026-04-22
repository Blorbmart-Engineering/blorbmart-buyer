import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.tsx'
import { CartProvider } from './contexts/CartContext.tsx'
import './lib/firebase'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <CartProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </CartProvider>
  </StrictMode>
)
