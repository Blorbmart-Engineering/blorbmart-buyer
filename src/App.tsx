import { Navigate, Route, Routes } from 'react-router-dom'
import LoginScreen from './screens/auth/LoginScreen'
import SignupScreen from './screens/auth/SignupScreen'
import Dashboard from './screens/dashboard/Dashboard'
import ProfileScreen from './screens/profile/ProfileScreen'
import WalletScreen from './screens/wallet/WalletScreen'
import { ProductDetailsPage } from './screens/product/ProductDetailsPage'
import { TransactionsPage } from './screens/transactions/TransactionsPage'
import { WishlistPage } from './screens/wishlist/WishlistPage'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/login" element={<LoginScreen />} />
      <Route path="/signup" element={<SignupScreen />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/wishlist" element={<WishlistPage />} />
      <Route path="/transactions" element={<TransactionsPage />} />
      <Route path="/profile" element={<ProfileScreen />} />
      <Route path="/wallet" element={<WalletScreen />} />
      <Route path="/product/:id" element={<ProductDetailsPage />} />
    </Routes>
  )
}

export default App
