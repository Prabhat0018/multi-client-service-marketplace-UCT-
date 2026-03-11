const express = require('express');
const router = express.Router();

const {
  getAllServices,
  getPublicServiceById
} = require('../controllers/service.controller');

const {
  getAllCategories,
  getCategoryById,
  createCategory
} = require('../controllers/category.controller');

const {
  getAllMerchants,
  getMerchantProfile,
  getMerchantServices,
  globalSearch
} = require('../controllers/merchant.public.controller');

const {
  getServiceReviews,
  getMerchantReviews
} = require('../controllers/review.controller');

/**
 * ============================================
 * 🌐 PUBLIC ROUTES (Customer Marketplace)
 * ============================================
 * 
 * No authentication required!
 * Customers can browse without logging in.
 * 
 * This is the "storefront" of your marketplace.
 */

// ============================================
// 🔍 SEARCH
// ============================================
// Unified search across services and merchants
// GET /api/search?q=keyword
router.get('/search', globalSearch);

// ============================================
// 📂 CATEGORIES
// ============================================
// GET /api/categories - List all categories
router.get('/categories', getAllCategories);

// GET /api/categories/:id - Category with its services & merchants
router.get('/categories/:id', getCategoryById);

// POST /api/categories - Create category (admin only - add middleware later)
router.post('/categories', createCategory);

// ============================================
// 🏪 MERCHANTS
// ============================================
// GET /api/merchants - Browse all merchants
// Query: ?category=xxx&search=xxx&sortBy=rating|newest|services
router.get('/merchants', getAllMerchants);

// GET /api/merchants/:id - View merchant profile
router.get('/merchants/:id', getMerchantProfile);

// GET /api/merchants/:id/services - View merchant's services
router.get('/merchants/:id/services', getMerchantServices);

// ============================================
// 📦 SERVICES
// ============================================
// GET /api/services - Browse all services
// Query: ?category=xxx&search=xxx&minPrice=0&maxPrice=100
router.get('/services', getAllServices);

// GET /api/services/:id - View service details
router.get('/services/:id', getPublicServiceById);

// GET /api/services/:id/reviews - View service reviews
router.get('/services/:id/reviews', getServiceReviews);

// GET /api/merchants/:id/reviews - View merchant reviews
router.get('/merchants/:id/reviews', getMerchantReviews);

module.exports = router;
