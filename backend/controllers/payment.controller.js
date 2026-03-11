const pool = require('../config/db');
const { v4: uuidv4 } = require('uuid');

/**
 * ============================================
 * 💳 PAYMENT CONTROLLER
 * ============================================
 * 
 * Handles payment processing for orders.
 * Currently supports simulated payments (for demo).
 * Can be extended to integrate with Stripe, Razorpay, etc.
 */

// ============================================
// 📌 PROCESS PAYMENT
// ============================================
// Customer pays for an order
// POST /api/orders/:id/pay
exports.processPayment = async (req, res) => {
  try {
    const user_id = req.user.id;
    const { id: order_id } = req.params;
    const { payment_method } = req.body;

    // Verify order exists and belongs to user
    const [orders] = await pool.query(
      `SELECT o.*, s.title as service_title, m.business_name
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

    // Check if already paid
    if (order.payment_status === 'paid') {
      return res.status(400).json({ error: 'Order is already paid' });
    }

    // Check if order is cancelled
    if (order.order_status === 'cancelled') {
      return res.status(400).json({ error: 'Cannot pay for a cancelled order' });
    }

    const payment_id = uuidv4();
    const transaction_id = `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Simulate payment processing
    // In production, integrate with Stripe/Razorpay here
    const paymentSuccess = true; // Simulated success

    if (paymentSuccess) {
      // Create payment record
      await pool.query(
        `INSERT INTO payments (payment_id, order_id, payment_gateway, transaction_id, payment_status, amount)
         VALUES (?, ?, ?, ?, 'completed', ?)`,
        [payment_id, order_id, payment_method || 'card', transaction_id, order.total_amount]
      );

      // Update order status
      await pool.query(
        `UPDATE orders SET payment_status = 'paid', order_status = 'confirmed' WHERE order_id = ?`,
        [order_id]
      );

      res.json({
        success: true,
        message: 'Payment successful',
        order: {
          order_id,
          service_title: order.service_title,
          business_name: order.business_name,
          total_amount: order.total_amount,
          payment_status: 'paid',
          order_status: 'confirmed',
          scheduled_date: order.scheduled_date,
          transaction_id
        }
      });
    } else {
      res.status(400).json({ 
        success: false, 
        error: 'Payment failed. Please try again.' 
      });
    }

  } catch (err) {
    console.error('Payment Error:', err);
    res.status(500).json({ error: err.message });
  }
};

// ============================================
// 📌 GET PAYMENT DETAILS
// ============================================
// Get payment info for an order
// GET /api/orders/:id/payment
exports.getPaymentDetails = async (req, res) => {
  try {
    const user_id = req.user.id;
    const { id: order_id } = req.params;

    const [payments] = await pool.query(
      `SELECT p.*, o.total_amount, o.order_status
       FROM payments p
       JOIN orders o ON p.order_id = o.order_id
       WHERE p.order_id = ? AND o.user_id = ?`,
      [order_id, user_id]
    );

    if (payments.length === 0) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    res.json({ payment: payments[0] });

  } catch (err) {
    console.error('Get Payment Error:', err);
    res.status(500).json({ error: err.message });
  }
};
