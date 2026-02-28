const pool = require('../config/db');

/**
 * ============================================
 * 🏪 MERCHANT PUBLIC CONTROLLER
 * ============================================
 * 
 * These are PUBLIC endpoints for customers to:
 * - Browse merchants
 * - View merchant profiles
 * - See merchant's services
 * 
 * No authentication required - anyone can browse!
 */

// ============================================
// 📌 GET ALL MERCHANTS
// ============================================
// Customers browse all approved merchants
// GET /api/merchants
exports.getAllMerchants = async (req, res) => {
  try {
    const { category, search, sortBy } = req.query;

    let query = `
      SELECT m.merchant_id, m.business_name, m.description, m.rating, m.created_at,
             c.category_name, c.category_id,
             COUNT(s.service_id) as service_count
      FROM merchants m
      LEFT JOIN categories c ON m.category_id = c.category_id
      LEFT JOIN services s ON m.merchant_id = s.merchant_id AND s.availability = true
      WHERE m.status = 'approved'
    `;
    const params = [];

    // Filter by category
    if (category) {
      query += ` AND m.category_id = ?`;
      params.push(category);
    }

    // Search by business name or description
    if (search) {
      query += ` AND (m.business_name LIKE ? OR m.description LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }

    query += ` GROUP BY m.merchant_id`;

    // Sort options
    if (sortBy === 'rating') {
      query += ` ORDER BY m.rating DESC`;
    } else if (sortBy === 'newest') {
      query += ` ORDER BY m.created_at DESC`;
    } else if (sortBy === 'services') {
      query += ` ORDER BY service_count DESC`;
    } else {
      query += ` ORDER BY m.rating DESC, m.business_name`;
    }

    const [merchants] = await pool.query(query, params);

    res.json({
      count: merchants.length,
      merchants
    });

  } catch (err) {
    console.error('Get Merchants Error:', err);
    res.status(500).json({ error: err.message });
  }
};

// ============================================
// 📌 GET MERCHANT PROFILE
// ============================================
// View a single merchant's full profile with their services
// GET /api/merchants/:id
exports.getMerchantProfile = async (req, res) => {
  try {
    const { id } = req.params;

    // Get merchant details
    const [merchants] = await pool.query(
      `SELECT m.merchant_id, m.business_name, m.description, m.rating, m.created_at,
              c.category_name, c.category_id
       FROM merchants m
       LEFT JOIN categories c ON m.category_id = c.category_id
       WHERE m.merchant_id = ? AND m.status = 'approved'`,
      [id]
    );

    if (merchants.length === 0) {
      return res.status(404).json({ error: 'Merchant not found' });
    }

    // Get merchant's services
    const [services] = await pool.query(
      `SELECT service_id, title, price, duration, description, availability
       FROM services 
       WHERE merchant_id = ? AND availability = true
       ORDER BY title`,
      [id]
    );

    // Get merchant's reviews (from completed orders)
    const [reviews] = await pool.query(
      `SELECT r.review_id, r.rating, r.comment, r.created_at, u.name as customer_name
       FROM reviews r
       JOIN orders o ON r.order_id = o.order_id
       JOIN users u ON o.user_id = u.user_id
       WHERE o.merchant_id = ?
       ORDER BY r.created_at DESC
       LIMIT 10`,
      [id]
    );

    res.json({
      merchant: merchants[0],
      services: {
        count: services.length,
        data: services
      },
      reviews: {
        count: reviews.length,
        data: reviews
      }
    });

  } catch (err) {
    console.error('Get Merchant Profile Error:', err);
    res.status(500).json({ error: err.message });
  }
};

// ============================================
// 📌 GET MERCHANT'S SERVICES
// ============================================
// Get all services offered by a specific merchant
// GET /api/merchants/:id/services
exports.getMerchantServices = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if merchant exists and is approved
    const [merchant] = await pool.query(
      `SELECT business_name FROM merchants WHERE merchant_id = ? AND status = 'approved'`,
      [id]
    );

    if (merchant.length === 0) {
      return res.status(404).json({ error: 'Merchant not found' });
    }

    // Get services
    const [services] = await pool.query(
      `SELECT * FROM services WHERE merchant_id = ? AND availability = true ORDER BY price`,
      [id]
    );

    res.json({
      merchant: merchant[0].business_name,
      count: services.length,
      services
    });

  } catch (err) {
    console.error('Get Merchant Services Error:', err);
    res.status(500).json({ error: err.message });
  }
};

// ============================================
// 📌 SEARCH EVERYTHING
// ============================================
// Unified search across services and merchants
// GET /api/search?q=keyword
exports.globalSearch = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.trim().length < 2) {
      return res.status(400).json({ error: 'Search query must be at least 2 characters' });
    }

    const searchTerm = `%${q}%`;

    // Search services
    const [services] = await pool.query(
      `SELECT s.*, m.business_name, c.category_name
       FROM services s
       JOIN merchants m ON s.merchant_id = m.merchant_id
       LEFT JOIN categories c ON m.category_id = c.category_id
       WHERE (s.title LIKE ? OR s.description LIKE ?) 
         AND s.availability = true AND m.status = 'approved'
       ORDER BY m.rating DESC
       LIMIT 10`,
      [searchTerm, searchTerm]
    );

    // Search merchants
    const [merchants] = await pool.query(
      `SELECT m.merchant_id, m.business_name, m.description, m.rating, c.category_name
       FROM merchants m
       LEFT JOIN categories c ON m.category_id = c.category_id
       WHERE (m.business_name LIKE ? OR m.description LIKE ?) AND m.status = 'approved'
       ORDER BY m.rating DESC
       LIMIT 10`,
      [searchTerm, searchTerm]
    );

    res.json({
      query: q,
      results: {
        services: {
          count: services.length,
          data: services
        },
        merchants: {
          count: merchants.length,
          data: merchants
        }
      }
    });

  } catch (err) {
    console.error('Search Error:', err);
    res.status(500).json({ error: err.message });
  }
};
