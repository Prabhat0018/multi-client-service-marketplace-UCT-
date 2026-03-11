const pool = require('../config/db');
const { v4: uuidv4 } = require('uuid');

/**
 * ============================================
 * ⭐ REVIEW CONTROLLER
 * ============================================
 * 
 * Handles customer reviews for completed services.
 * Reviews can only be created for completed orders.
 */

// ============================================
// 📌 CREATE REVIEW
// ============================================
// Customer creates a review for a completed order
// POST /api/orders/:id/review
exports.createReview = async (req, res) => {
  try {
    const user_id = req.user.id;
    const { id: order_id } = req.params;
    const { rating, comment } = req.body;

    // Validate rating
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    // Verify order exists, belongs to user, and is completed
    const [orders] = await pool.query(
      `SELECT o.*, s.service_id, m.merchant_id
       FROM orders o
       JOIN services s ON o.service_id = s.service_id
       JOIN merchants m ON o.merchant_id = m.merchant_id
       WHERE o.order_id = ? AND o.user_id = ?`,
      [order_id, user_id]
    );

    if (orders.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const order = orders[0];

    if (order.order_status !== 'completed') {
      return res.status(400).json({ error: 'Can only review completed orders' });
    }

    // Check if review already exists
    const [existingReview] = await pool.query(
      `SELECT * FROM reviews WHERE order_id = ?`,
      [order_id]
    );

    if (existingReview.length > 0) {
      return res.status(400).json({ error: 'You have already reviewed this order' });
    }

    const review_id = uuidv4();

    // Create the review
    await pool.query(
      `INSERT INTO reviews (review_id, order_id, rating, comment)
       VALUES (?, ?, ?, ?)`,
      [review_id, order_id, rating, comment || null]
    );

    // Update merchant average rating
    const [ratingResult] = await pool.query(
      `SELECT AVG(r.rating) as avg_rating
       FROM reviews r
       JOIN orders o ON r.order_id = o.order_id
       WHERE o.merchant_id = ?`,
      [order.merchant_id]
    );

    const avgRating = ratingResult[0].avg_rating || 0;

    await pool.query(
      `UPDATE merchants SET rating = ? WHERE merchant_id = ?`,
      [avgRating, order.merchant_id]
    );

    res.status(201).json({
      message: 'Review submitted successfully',
      review: {
        review_id,
        rating,
        comment,
        created_at: new Date()
      }
    });

  } catch (err) {
    console.error('Create Review Error:', err);
    res.status(500).json({ error: err.message });
  }
};

// ============================================
// 📌 GET SERVICE REVIEWS
// ============================================
// Get all reviews for a service (public)
// GET /api/services/:id/reviews
exports.getServiceReviews = async (req, res) => {
  try {
    const { id: service_id } = req.params;

    const [reviews] = await pool.query(
      `SELECT r.*, u.name as user_name
       FROM reviews r
       JOIN orders o ON r.order_id = o.order_id
       JOIN users u ON o.user_id = u.user_id
       WHERE o.service_id = ?
       ORDER BY r.created_at DESC`,
      [service_id]
    );

    // Calculate rating distribution
    const [statsResult] = await pool.query(
      `SELECT 
        COUNT(*) as total,
        AVG(r.rating) as average,
        SUM(CASE WHEN r.rating = 5 THEN 1 ELSE 0 END) as five,
        SUM(CASE WHEN r.rating = 4 THEN 1 ELSE 0 END) as four,
        SUM(CASE WHEN r.rating = 3 THEN 1 ELSE 0 END) as three,
        SUM(CASE WHEN r.rating = 2 THEN 1 ELSE 0 END) as two,
        SUM(CASE WHEN r.rating = 1 THEN 1 ELSE 0 END) as one
       FROM reviews r
       JOIN orders o ON r.order_id = o.order_id
       WHERE o.service_id = ?`,
      [service_id]
    );

    const stats = {
      total: statsResult[0].total || 0,
      average: statsResult[0].average || 0,
      distribution: {
        5: statsResult[0].five || 0,
        4: statsResult[0].four || 0,
        3: statsResult[0].three || 0,
        2: statsResult[0].two || 0,
        1: statsResult[0].one || 0
      }
    };

    res.json({
      reviews,
      stats
    });

  } catch (err) {
    console.error('Get Reviews Error:', err);
    res.status(500).json({ error: err.message });
  }
};

// ============================================
// 📌 GET MERCHANT REVIEWS
// ============================================
// Get all reviews for a merchant (public)
// GET /api/merchants/:id/reviews
exports.getMerchantReviews = async (req, res) => {
  try {
    const { id: merchant_id } = req.params;

    const [reviews] = await pool.query(
      `SELECT r.*, u.name as user_name, s.title as service_title
       FROM reviews r
       JOIN orders o ON r.order_id = o.order_id
       JOIN users u ON o.user_id = u.user_id
       JOIN services s ON o.service_id = s.service_id
       WHERE o.merchant_id = ?
       ORDER BY r.created_at DESC`,
      [merchant_id]
    );

    res.json({ reviews });

  } catch (err) {
    console.error('Get Merchant Reviews Error:', err);
    res.status(500).json({ error: err.message });
  }
};
