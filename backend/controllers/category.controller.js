const pool = require('../config/db');
const { v4: uuidv4 } = require('uuid');

/**
 * ============================================
 * 📂 CATEGORY CONTROLLER
 * ============================================
 * 
 * Categories organize merchants and services.
 * Examples: Home Services, Beauty, Pet Care, etc.
 * 
 * Customers use categories to discover services.
 * Merchants select a category when signing up.
 */

// ============================================
// 📌 GET ALL CATEGORIES
// ============================================
// Public - Anyone can view categories
// GET /api/categories
exports.getAllCategories = async (req, res) => {
  try {
    const [categories] = await pool.query(
      `SELECT c.*, 
              COUNT(DISTINCT m.merchant_id) as merchant_count,
              COUNT(DISTINCT s.service_id) as service_count
       FROM categories c
       LEFT JOIN merchants m ON c.category_id = m.category_id AND m.status = 'approved'
       LEFT JOIN services s ON m.merchant_id = s.merchant_id AND s.availability = true
       GROUP BY c.category_id
       ORDER BY c.category_name`
    );

    res.json({
      count: categories.length,
      categories
    });

  } catch (err) {
    console.error('Get Categories Error:', err);
    res.status(500).json({ error: err.message });
  }
};

// ============================================
// 📌 GET SINGLE CATEGORY WITH SERVICES
// ============================================
// Get category details with all services in it
// GET /api/categories/:id
exports.getCategoryById = async (req, res) => {
  try {
    const { id } = req.params;

    // Get category info
    const [categories] = await pool.query(
      `SELECT * FROM categories WHERE category_id = ?`,
      [id]
    );

    if (categories.length === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }

    // Get all services in this category
    const [services] = await pool.query(
      `SELECT s.*, m.business_name, m.rating as merchant_rating
       FROM services s
       JOIN merchants m ON s.merchant_id = m.merchant_id
       WHERE m.category_id = ? AND s.availability = true AND m.status = 'approved'
       ORDER BY m.rating DESC`,
      [id]
    );

    // Get merchants in this category
    const [merchants] = await pool.query(
      `SELECT merchant_id, business_name, description, rating, created_at
       FROM merchants 
       WHERE category_id = ? AND status = 'approved'
       ORDER BY rating DESC`,
      [id]
    );

    res.json({
      category: categories[0],
      merchants: {
        count: merchants.length,
        data: merchants
      },
      services: {
        count: services.length,
        data: services
      }
    });

  } catch (err) {
    console.error('Get Category Error:', err);
    res.status(500).json({ error: err.message });
  }
};

// ============================================
// 📌 ADMIN: CREATE CATEGORY
// ============================================
// Only admin can create categories (future: add admin middleware)
// POST /api/categories
exports.createCategory = async (req, res) => {
  try {
    const { category_name } = req.body;

    if (!category_name) {
      return res.status(400).json({ error: 'Category name is required' });
    }

    const category_id = uuidv4();

    await pool.query(
      `INSERT INTO categories (category_id, category_name) VALUES (?, ?)`,
      [category_id, category_name]
    );

    res.status(201).json({
      message: 'Category created successfully',
      category: { category_id, category_name }
    });

  } catch (err) {
    console.error('Create Category Error:', err);
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Category already exists' });
    }
    res.status(500).json({ error: err.message });
  }
};
