import { Navigate, Route, Routes } from 'react-router-dom'
import LoginScreen from './screens/auth/LoginScreen'
import SignupScreen from './screens/auth/SignupScreen'
import ForgotPasswordScreen from './screens/auth/ForgotPasswordScreen'
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
import { SearchPage } from './screens/search/SearchPage'
import { StoreDetailsPage } from './screens/store/StoreDetailsPage'
import { NotificationsPage } from './screens/notifications/NotificationsPage'
import { FaqPage } from './screens/faq/FaqPage'
import { LegalPage } from './screens/legal/LegalPage'
import { SplashScreen } from './screens/splash/SplashScreen'
import { OnboardingScreen } from './screens/onboarding/OnboardingScreen'
import { FoodPage } from './screens/food/FoodPage'
import PrivateRoute from './components/PrivateRoute'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/splash" replace />} />
      <Route path="/splash" element={<SplashScreen />} />
      <Route path="/onboarding" element={<OnboardingScreen />} />
      <Route path="/login" element={<LoginScreen />} />
      <Route path="/signup" element={<SignupScreen />} />
      <Route path="/forgot-password" element={<ForgotPasswordScreen />} />

      <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
      <Route path="/shop" element={<PrivateRoute><CatalogPage /></PrivateRoute>} />
      <Route path="/categories" element={<PrivateRoute><CatalogPage /></PrivateRoute>} />
      <Route path="/deals" element={<PrivateRoute><CatalogPage /></PrivateRoute>} />
      <Route path="/category/:id" element={<PrivateRoute><CatalogPage /></PrivateRoute>} />
      <Route path="/track" element={<PrivateRoute><TrackOrdersPage /></PrivateRoute>} />
      <Route path="/wishlist" element={<PrivateRoute><WishlistPage /></PrivateRoute>} />
      <Route path="/transactions" element={<PrivateRoute><TransactionsPage /></PrivateRoute>} />
      <Route path="/profile" element={<PrivateRoute><ProfileScreen /></PrivateRoute>} />
      <Route path="/wallet" element={<PrivateRoute><WalletScreen /></PrivateRoute>} />
      <Route path="/cart" element={<PrivateRoute><CartPage /></PrivateRoute>} />
      <Route path="/checkout" element={<PrivateRoute><CheckoutPage /></PrivateRoute>} />
      <Route path="/product/:id" element={<PrivateRoute><ProductDetailsPage /></PrivateRoute>} />
      <Route path="/search" element={<PrivateRoute><SearchPage /></PrivateRoute>} />
      <Route path="/store/:id" element={<PrivateRoute><StoreDetailsPage /></PrivateRoute>} />
      <Route path="/notifications" element={<PrivateRoute><NotificationsPage /></PrivateRoute>} />
      <Route path="/food" element={<PrivateRoute><FoodPage /></PrivateRoute>} />
      <Route path="/faq" element={<PrivateRoute><FaqPage /></PrivateRoute>} />
      <Route path="/terms" element={<PrivateRoute><LegalPage /></PrivateRoute>} />
      <Route path="/privacy" element={<PrivateRoute><LegalPage /></PrivateRoute>} />
    </Routes>
  )
}

export default App
