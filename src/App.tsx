import { Navigate, Route, Routes } from 'react-router-dom'
import LoginScreen from './screens/auth/LoginScreen'
import SignupScreen from './screens/auth/SignupScreen'
import Dashboard from './screens/dashboard/Dashboard'
import ProfileScreen from './screens/profile/ProfileScreen'
import WalletScreen from './screens/wallet/WalletScreen'
import { ProductDetailsPage } from './screens/product/ProductDetailsPage'
import { TransactionsPage } from './screens/transactions/TransactionsPage'
import { WishlistPage } from './screens/wishlist/WishlistPage'
import { CartPage } from './screens/cart/CartPage'
import { CheckoutPage } from './screens/checkout/CheckoutPage'
import { CatalogPage } from './screens/catalog/CatalogPage'
import { TrackOrdersPage } from './screens/orders/TrackOrdersPage'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/login" element={<LoginScreen />} />
      <Route path="/signup" element={<SignupScreen />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/shop" element={<CatalogPage />} />
      <Route path="/categories" element={<CatalogPage />} />
      <Route path="/deals" element={<CatalogPage />} />
      <Route path="/category/:id" element={<CatalogPage />} />
      <Route path="/track" element={<TrackOrdersPage />} />
      <Route path="/wishlist" element={<WishlistPage />} />
      <Route path="/transactions" element={<TransactionsPage />} />
      <Route path="/profile" element={<ProfileScreen />} />
      <Route path="/wallet" element={<WalletScreen />} />
      <Route path="/cart" element={<CartPage />} />
      <Route path="/checkout" element={<CheckoutPage />} />
      <Route path="/product/:id" element={<ProductDetailsPage />} />
    </Routes>
  )
}

export default App
