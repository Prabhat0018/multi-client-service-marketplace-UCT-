import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import './styles/App.css';

// Components
import Navbar from './components/Navbar';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Services from './pages/Services';
import ServiceDetail from './pages/ServiceDetail';
import Categories from './pages/Categories';

// Customer Pages
import MyOrders from './pages/customer/MyOrders';
import Checkout from './pages/customer/Checkout';
import PaymentSuccess from './pages/customer/PaymentSuccess';

// Merchant Pages
import MerchantLayout from './pages/merchant/MerchantLayout';
import MerchantServices from './pages/merchant/MerchantServices';
import MerchantOrders from './pages/merchant/MerchantOrders';

// Protected Route Components
const ProtectedRoute = ({ children, allowedRole }) => {
  const { isAuthenticated, role } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  if (allowedRole && role !== allowedRole) {
    return <Navigate to="/" />;
  }
  
  return children;
};

function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/services" element={<Services />} />
      <Route path="/services/:id" element={<ServiceDetail />} />
      <Route path="/categories" element={<Categories />} />

      {/* Customer Routes */}
      <Route 
        path="/my-orders" 
        element={
          <ProtectedRoute allowedRole="customer">
            <MyOrders />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/checkout/:orderId" 
        element={
          <ProtectedRoute allowedRole="customer">
            <Checkout />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/payment-success" 
        element={
          <ProtectedRoute allowedRole="customer">
            <PaymentSuccess />
          </ProtectedRoute>
        } 
      />

      {/* Merchant Routes */}
      <Route 
        path="/merchant" 
        element={
          <ProtectedRoute allowedRole="merchant">
            <MerchantLayout />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={null} />
        <Route path="services" element={<MerchantServices />} />
        <Route path="orders" element={<MerchantOrders />} />
      </Route>

      {/* Redirect */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Navbar />
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}

export default App;
