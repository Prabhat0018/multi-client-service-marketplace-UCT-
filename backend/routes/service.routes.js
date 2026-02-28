const express = require('express');
const router = express.Router();
const protect = require('../middleware/auth.middleware');

const {
  createService,
  getMyServices,
  getServiceById,
  updateService,
  deleteService
} = require('../controllers/service.controller');

/**
 * ============================================
 * 🛣️ MERCHANT SERVICE ROUTES
 * ============================================
 * 
 * All routes here require authentication (JWT token).
 * The `protect` middleware:
 *   1. Checks if Bearer token exists in headers
 *   2. Verifies the token using JWT_SECRET
 *   3. Extracts user info (id, role) and puts it in req.user
 * 
 * FLOW EXAMPLE:
 * -------------
 * 1. Merchant logs in → Gets JWT token
 * 2. Merchant calls POST /api/merchant/services with token in header
 * 3. `protect` middleware validates token and extracts merchant_id
 * 4. Controller uses merchant_id to create service for THIS merchant only
 * 
 * This is how multi-tenant isolation works at the API level!
 */

// ============================================
// 🔒 PROTECTED ROUTES (Merchant must be logged in)
// ============================================

// CREATE - Add a new service
// POST /api/merchant/services
// Body: { title, price, duration?, description?, availability? }
router.post('/', protect, createService);

// READ - Get all services for logged-in merchant
// GET /api/merchant/services
router.get('/', protect, getMyServices);

// READ - Get single service by ID
// GET /api/merchant/services/:id
router.get('/:id', protect, getServiceById);

// UPDATE - Edit a service
// PUT /api/merchant/services/:id
// Body: { title?, price?, duration?, description?, availability? }
router.put('/:id', protect, updateService);

// DELETE - Remove a service
// DELETE /api/merchant/services/:id
router.delete('/:id', protect, deleteService);

module.exports = router;
