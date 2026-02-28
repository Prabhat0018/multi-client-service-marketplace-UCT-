const express = require('express');
const router = express.Router();
const protect = require('../middleware/auth.middleware');

const {
  getMerchantOrders,
  updateOrderStatus,
  getMerchantOrderStats
} = require('../controllers/order.controller');

/**
 * ============================================
 * 📦 MERCHANT ORDER ROUTES
 * ============================================
 * 
 * All routes require merchant authentication.
 * 
 * MERCHANT ORDER MANAGEMENT:
 * 1. View incoming orders
 * 2. Confirm/Accept orders
 * 3. Mark as in progress
 * 4. Complete orders
 * 5. View stats/earnings
 */

// ============================================
// 🔒 PROTECTED ROUTES (Merchant must be logged in)
// ============================================

// GET - Dashboard stats
// GET /api/merchant/orders/stats
router.get('/stats', protect, getMerchantOrderStats);

// GET - All orders for this merchant
// GET /api/merchant/orders
// Query: ?status=pending|confirmed|in_progress|completed|cancelled
router.get('/', protect, getMerchantOrders);

// PUT - Update order status
// PUT /api/merchant/orders/:id/status
// Body: { status: 'confirmed' | 'in_progress' | 'completed' | 'cancelled' }
router.put('/:id/status', protect, updateOrderStatus);

module.exports = router;
