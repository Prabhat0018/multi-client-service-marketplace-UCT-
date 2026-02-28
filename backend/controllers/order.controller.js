const pool = require('../config/db');
const { v4: uuidv4 } = require('uuid');

/**
 * ============================================
 * 🛒 ORDER CONTROLLER
 * ============================================
 * 
 * This handles the checkout and order management flow:
 * 
 * CUSTOMER FLOW:
 * 1. Browse services
 * 2. Create order (book service)
 * 3. Pay for order (Phase 9)
 * 4. Track order status
 * 
 * MERCHANT FLOW:
 * 1. View incoming orders
 * 2. Accept/Reject orders
 * 3. Mark as completed
 * 
 * ORDER STATUS FLOW:
 * pending → confirmed → in_progress → completed
 *              ↓
 *          cancelled
 */

// ============================================
// 📌 CUSTOMER: CREATE ORDER
// ============================================
// Customer books a service
// POST /api/orders
exports.createOrder = async (req, res) => {
  try {
    const user_id = req.user.id;
    const { service_id, notes, scheduled_date } = req.body;

    // Validate required fields
    if (!service_id) {
      return res.status(400).json({ error: 'Service ID is required' });
    }

    // Get service details (and verify it exists)
    const [services] = await pool.query(
      `SELECT s.*, m.business_name, m.merchant_id 
       FROM services s 
       JOIN merchants m ON s.merchant_id = m.merchant_id
       WHERE s.service_id = ? AND s.availability = true`,
      [service_id]
    );

    if (services.length === 0) {
      return res.status(404).json({ error: 'Service not found or unavailable' });
    }

    const service = services[0];
    const order_id = uuidv4();

    // Create the order
    await pool.query(
      `INSERT INTO orders 
       (order_id, user_id, merchant_id, total_amount, payment_status, order_status, service_id, notes, scheduled_date)
       VALUES (?, ?, ?, ?, 'pending', 'pending', ?, ?, ?)`,
      [order_id, user_id, service.merchant_id, service.price, service_id, notes || null, scheduled_date || null]
    );

    res.status(201).json({
      message: 'Order created successfully',
      order: {
        order_id,
        service: {
          title: service.title,
          price: service.price,
          duration: service.duration
        },
        merchant: {
          name: service.business_name,
          id: service.merchant_id
        },
        total_amount: service.price,
        order_status: 'pending',
        payment_status: 'pending',
        scheduled_date
      }
    });

  } catch (err) {
    console.error('Create Order Error:', err);
    res.status(500).json({ error: err.message });
  }
};

// ============================================
// 📌 CUSTOMER: GET MY ORDERS
// ============================================
// Customer views their order history
// GET /api/orders
exports.getMyOrders = async (req, res) => {
  try {
    const user_id = req.user.id;
    const { status } = req.query;

    let query = `
      SELECT o.*, s.title as service_title, s.duration, m.business_name
      FROM orders o
      JOIN services s ON o.service_id = s.service_id
      JOIN merchants m ON o.merchant_id = m.merchant_id
      WHERE o.user_id = ?
    `;
    const params = [user_id];

    if (status) {
      query += ` AND o.order_status = ?`;
      params.push(status);
    }

    query += ` ORDER BY o.created_at DESC`;

    const [orders] = await pool.query(query, params);

    res.json({
      count: orders.length,
      orders
    });

  } catch (err) {
    console.error('Get Orders Error:', err);
    res.status(500).json({ error: err.message });
  }
};

// ============================================
// 📌 CUSTOMER: GET SINGLE ORDER
// ============================================
// GET /api/orders/:id
exports.getOrderById = async (req, res) => {
  try {
    const user_id = req.user.id;
    const { id } = req.params;

    const [orders] = await pool.query(
      `SELECT o.*, s.title as service_title, s.duration, s.description as service_description,
              m.business_name, m.email as merchant_email
       FROM orders o
       JOIN services s ON o.service_id = s.service_id
       JOIN merchants m ON o.merchant_id = m.merchant_id
       WHERE o.order_id = ? AND o.user_id = ?`,
      [id, user_id]
    );

    if (orders.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json(orders[0]);

  } catch (err) {
    console.error('Get Order Error:', err);
    res.status(500).json({ error: err.message });
  }
};

// ============================================
// 📌 CUSTOMER: CANCEL ORDER
// ============================================
// Customer can cancel pending orders
// PUT /api/orders/:id/cancel
exports.cancelOrder = async (req, res) => {
  try {
    const user_id = req.user.id;
    const { id } = req.params;

    // Check if order exists and belongs to user
    const [orders] = await pool.query(
      `SELECT * FROM orders WHERE order_id = ? AND user_id = ?`,
      [id, user_id]
    );

    if (orders.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Can only cancel pending orders
    if (orders[0].order_status !== 'pending') {
      return res.status(400).json({ 
        error: 'Cannot cancel order. Only pending orders can be cancelled.' 
      });
    }

    // Cancel the order
    await pool.query(
      `UPDATE orders SET order_status = 'cancelled' WHERE order_id = ?`,
      [id]
    );

    res.json({ message: 'Order cancelled successfully' });

  } catch (err) {
    console.error('Cancel Order Error:', err);
    res.status(500).json({ error: err.message });
  }
};

// ============================================
// 📌 MERCHANT: GET MY ORDERS
// ============================================
// Merchant views orders for their services
// GET /api/merchant/orders
exports.getMerchantOrders = async (req, res) => {
  try {
    const merchant_id = req.user.id;
    const { status } = req.query;

    let query = `
      SELECT o.*, s.title as service_title, s.duration, u.name as customer_name, u.phone as customer_phone
      FROM orders o
      JOIN services s ON o.service_id = s.service_id
      JOIN users u ON o.user_id = u.user_id
      WHERE o.merchant_id = ?
    `;
    const params = [merchant_id];

    if (status) {
      query += ` AND o.order_status = ?`;
      params.push(status);
    }

    query += ` ORDER BY o.created_at DESC`;

    const [orders] = await pool.query(query, params);

    res.json({
      count: orders.length,
      orders
    });

  } catch (err) {
    console.error('Get Merchant Orders Error:', err);
    res.status(500).json({ error: err.message });
  }
};

// ============================================
// 📌 MERCHANT: UPDATE ORDER STATUS
// ============================================
// Merchant confirms, starts, or completes orders
// PUT /api/merchant/orders/:id/status
exports.updateOrderStatus = async (req, res) => {
  try {
    const merchant_id = req.user.id;
    const { id } = req.params;
    const { status } = req.body;

    // Validate status
    const validStatuses = ['confirmed', 'in_progress', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        error: 'Invalid status. Must be: confirmed, in_progress, completed, or cancelled' 
      });
    }

    // Check if order exists and belongs to this merchant
    const [orders] = await pool.query(
      `SELECT * FROM orders WHERE order_id = ? AND merchant_id = ?`,
      [id, merchant_id]
    );

    if (orders.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const currentStatus = orders[0].order_status;

    // Define valid status transitions
    const validTransitions = {
      'pending': ['confirmed', 'cancelled'],
      'confirmed': ['in_progress', 'cancelled'],
      'in_progress': ['completed'],
      'completed': [],
      'cancelled': []
    };

    if (!validTransitions[currentStatus]?.includes(status)) {
      return res.status(400).json({ 
        error: `Cannot change status from '${currentStatus}' to '${status}'` 
      });
    }

    // Update order status
    await pool.query(
      `UPDATE orders SET order_status = ? WHERE order_id = ?`,
      [status, id]
    );

    res.json({ 
      message: `Order ${status}`,
      order_id: id,
      previous_status: currentStatus,
      new_status: status
    });

  } catch (err) {
    console.error('Update Order Status Error:', err);
    res.status(500).json({ error: err.message });
  }
};

// ============================================
// 📌 MERCHANT: GET ORDER STATS
// ============================================
// Quick dashboard stats for merchant
// GET /api/merchant/orders/stats
exports.getMerchantOrderStats = async (req, res) => {
  try {
    const merchant_id = req.user.id;

    const [stats] = await pool.query(
      `SELECT 
        COUNT(*) as total_orders,
        SUM(CASE WHEN order_status = 'pending' THEN 1 ELSE 0 END) as pending_orders,
        SUM(CASE WHEN order_status = 'confirmed' THEN 1 ELSE 0 END) as confirmed_orders,
        SUM(CASE WHEN order_status = 'in_progress' THEN 1 ELSE 0 END) as in_progress_orders,
        SUM(CASE WHEN order_status = 'completed' THEN 1 ELSE 0 END) as completed_orders,
        SUM(CASE WHEN order_status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_orders,
        SUM(CASE WHEN order_status = 'completed' THEN total_amount ELSE 0 END) as total_earnings
       FROM orders WHERE merchant_id = ?`,
      [merchant_id]
    );

    res.json(stats[0]);

  } catch (err) {
    console.error('Get Order Stats Error:', err);
    res.status(500).json({ error: err.message });
  }
};
