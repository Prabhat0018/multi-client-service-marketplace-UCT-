const pool = require('../config/db');
const { v4: uuidv4 } = require('uuid');

/**
 * ============================================
 * 📦 SERVICE CONTROLLER
 * ============================================
 * 
 * This controller handles all service-related operations.
 * 
 * KEY CONCEPT: Multi-Tenant Isolation
 * ------------------------------------
 * Every query filters by `merchant_id` from the JWT token.
 * This ensures merchants can ONLY access their own services.
 * 
 * Example: If Merchant A has services [S1, S2] and Merchant B has [S3, S4],
 * When Merchant A calls GET /services, they only see [S1, S2].
 * 
 * This is the core of multi-tenant architecture!
 */

// ============================================
// 📌 CREATE SERVICE
// ============================================
// Merchant adds a new service to their profile
// POST /api/merchant/services
exports.createService = async (req, res) => {
  try {
    // 1️⃣ Get merchant_id from JWT token (set by auth middleware)
    const merchant_id = req.user.id;
    
    // 2️⃣ Get service details from request body
    const { title, price, duration, description, availability } = req.body;

    // 3️⃣ Validate required fields
    if (!title || !price) {
      return res.status(400).json({ 
        error: 'Title and price are required' 
      });
    }

    // 4️⃣ Generate unique ID for this service
    const service_id = uuidv4();

    // 5️⃣ Insert into database
    // Notice: merchant_id comes from JWT, NOT from user input
    // This prevents a merchant from creating services for another merchant
    await pool.query(
      `INSERT INTO services 
       (service_id, merchant_id, title, price, duration, description, availability)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [service_id, merchant_id, title, price, duration || null, description || null, availability !== false]
    );

    // 6️⃣ Return success response
    res.status(201).json({
      message: 'Service created successfully',
      service: {
        service_id,
        merchant_id,
        title,
        price,
        duration,
        description,
        availability: availability !== false
      }
    });

  } catch (err) {
    console.error('Create Service Error:', err);
    res.status(500).json({ error: err.message });
  }
};

// ============================================
// 📌 GET ALL SERVICES (for this merchant)
// ============================================
// Merchant views their own services
// GET /api/merchant/services
exports.getMyServices = async (req, res) => {
  try {
    // 1️⃣ Get merchant_id from JWT
    const merchant_id = req.user.id;

    // 2️⃣ Query ONLY services belonging to this merchant
    // This is multi-tenant isolation in action!
    const [services] = await pool.query(
      `SELECT * FROM services WHERE merchant_id = ? ORDER BY title`,
      [merchant_id]
    );

    // 3️⃣ Return the services
    res.json({
      count: services.length,
      services
    });

  } catch (err) {
    console.error('Get Services Error:', err);
    res.status(500).json({ error: err.message });
  }
};

// ============================================
// 📌 GET SINGLE SERVICE
// ============================================
// Merchant views one specific service
// GET /api/merchant/services/:id
exports.getServiceById = async (req, res) => {
  try {
    const merchant_id = req.user.id;
    const { id } = req.params;

    // Query with BOTH service_id AND merchant_id
    // This prevents merchant from viewing another merchant's service
    const [services] = await pool.query(
      `SELECT * FROM services WHERE service_id = ? AND merchant_id = ?`,
      [id, merchant_id]
    );

    if (services.length === 0) {
      return res.status(404).json({ error: 'Service not found' });
    }

    res.json(services[0]);

  } catch (err) {
    console.error('Get Service Error:', err);
    res.status(500).json({ error: err.message });
  }
};

// ============================================
// 📌 UPDATE SERVICE
// ============================================
// Merchant edits their service
// PUT /api/merchant/services/:id
exports.updateService = async (req, res) => {
  try {
    const merchant_id = req.user.id;
    const { id } = req.params;
    const { title, price, duration, description, availability } = req.body;

    // 1️⃣ First check if service exists and belongs to this merchant
    const [existing] = await pool.query(
      `SELECT * FROM services WHERE service_id = ? AND merchant_id = ?`,
      [id, merchant_id]
    );

    if (existing.length === 0) {
      return res.status(404).json({ error: 'Service not found' });
    }

    // 2️⃣ Update the service
    // Using COALESCE-like logic: if new value provided, use it; else keep old
    await pool.query(
      `UPDATE services 
       SET title = ?, price = ?, duration = ?, description = ?, availability = ?
       WHERE service_id = ? AND merchant_id = ?`,
      [
        title || existing[0].title,
        price || existing[0].price,
        duration !== undefined ? duration : existing[0].duration,
        description !== undefined ? description : existing[0].description,
        availability !== undefined ? availability : existing[0].availability,
        id,
        merchant_id
      ]
    );

    // 3️⃣ Fetch updated service
    const [updated] = await pool.query(
      `SELECT * FROM services WHERE service_id = ?`,
      [id]
    );

    res.json({
      message: 'Service updated successfully',
      service: updated[0]
    });

  } catch (err) {
    console.error('Update Service Error:', err);
    res.status(500).json({ error: err.message });
  }
};

// ============================================
// 📌 DELETE SERVICE
// ============================================
// Merchant removes their service
// DELETE /api/merchant/services/:id
exports.deleteService = async (req, res) => {
  try {
    const merchant_id = req.user.id;
    const { id } = req.params;

    // 1️⃣ Check if service exists and belongs to this merchant
    const [existing] = await pool.query(
      `SELECT * FROM services WHERE service_id = ? AND merchant_id = ?`,
      [id, merchant_id]
    );

    if (existing.length === 0) {
      return res.status(404).json({ error: 'Service not found' });
    }

    // 2️⃣ Delete the service
    await pool.query(
      `DELETE FROM services WHERE service_id = ? AND merchant_id = ?`,
      [id, merchant_id]
    );

    res.json({
      message: 'Service deleted successfully',
      deleted: existing[0]
    });

  } catch (err) {
    console.error('Delete Service Error:', err);
    res.status(500).json({ error: err.message });
  }
};

// ============================================
// 📌 PUBLIC: GET ALL SERVICES (for customers)
// ============================================
// Customers browse all available services
// GET /api/services (no auth required)
exports.getAllServices = async (req, res) => {
  try {
    // Optional filters from query params
    const { category, search, minPrice, maxPrice } = req.query;

    let query = `
      SELECT s.*, m.business_name, m.rating as merchant_rating, c.category_name
      FROM services s
      JOIN merchants m ON s.merchant_id = m.merchant_id
      LEFT JOIN categories c ON m.category_id = c.category_id
      WHERE s.availability = true AND m.status = 'approved'
    `;
    const params = [];

    // Add filters if provided
    if (category) {
      query += ` AND c.category_id = ?`;
      params.push(category);
    }

    if (search) {
      query += ` AND (s.title LIKE ? OR s.description LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }

    if (minPrice) {
      query += ` AND s.price >= ?`;
      params.push(minPrice);
    }

    if (maxPrice) {
      query += ` AND s.price <= ?`;
      params.push(maxPrice);
    }

    query += ` ORDER BY m.rating DESC, s.title`;

    const [services] = await pool.query(query, params);

    res.json({
      count: services.length,
      services
    });

  } catch (err) {
    console.error('Get All Services Error:', err);
    res.status(500).json({ error: err.message });
  }
};

// ============================================
// 📌 PUBLIC: GET SERVICE DETAILS
// ============================================
// Customer views a specific service
// GET /api/services/:id
exports.getPublicServiceById = async (req, res) => {
  try {
    const { id } = req.params;

    const [services] = await pool.query(
      `SELECT s.*, m.business_name, m.rating as merchant_rating, m.description as merchant_description, c.category_name
       FROM services s
       JOIN merchants m ON s.merchant_id = m.merchant_id
       LEFT JOIN categories c ON m.category_id = c.category_id
       WHERE s.service_id = ?`,
      [id]
    );

    if (services.length === 0) {
      return res.status(404).json({ error: 'Service not found' });
    }

    res.json(services[0]);

  } catch (err) {
    console.error('Get Public Service Error:', err);
    res.status(500).json({ error: err.message });
  }
};
