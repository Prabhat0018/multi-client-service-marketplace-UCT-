const express = require('express');
const router = express.Router();
const protect = require('../middleware/auth.middleware');

const {
  createOrder,
  getMyOrders,
  getOrderById,
  cancelOrder
} = require('../controllers/order.controller');

/**
 * ============================================
 * 🛒 CUSTOMER ORDER ROUTES
 * ============================================
 * 
 * All routes require customer authentication.
 * 
 * ORDER FLOW:
 * 1. Customer browses services (public routes)
 * 2. Customer logs in
 * 3. Customer creates order for a service
 * 4. Customer tracks order status
 * 5. Customer can cancel pending orders
 */

// ============================================
// 🔒 PROTECTED ROUTES (Customer must be logged in)
// ============================================

// CREATE - Book a service
// POST /api/orders
// Body: { service_id, notes?, scheduled_date? }
router.post('/', protect, createOrder);

// READ - Get all my orders
// GET /api/orders
// Query: ?status=pending|confirmed|completed|cancelled
router.get('/', protect, getMyOrders);

// READ - Get single order
// GET /api/orders/:id
router.get('/:id', protect, getOrderById);

// UPDATE - Cancel order
// PUT /api/orders/:id/cancel
router.put('/:id/cancel', protect, cancelOrder);

module.exports = router;
