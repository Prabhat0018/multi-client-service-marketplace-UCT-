const pool = require('../config/db');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const generateToken = require('../utils/generateToken');

exports.userSignup = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email and password are required' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user_id = uuidv4();

    await pool.query(
      `INSERT INTO users (user_id,name,email,password,phone)
       VALUES (?,?,?,?,?)`,
      [user_id, name, email, hashedPassword, phone]
    );

    res.json({
      message: 'User registered',
      token: generateToken(user_id, 'customer')
    });

  } catch (err) {
    console.error('Signup Error:', err);
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Email already exists' });
    }
    res.status(500).json({ error: err.message });
  }
};

exports.merchantSignup = async (req, res) => {
  try {
    const {
      business_name,
      email,
      password,
      category_id,
      description
    } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);
    const merchant_id = uuidv4();

    await pool.query(
      `INSERT INTO merchants
       (merchant_id,business_name,email,password,category_id,description)
       VALUES (?,?,?,?,?,?)`,
      [merchant_id, business_name, email,
       hashedPassword, category_id, description]
    );

    res.json({
      message: 'Merchant registered',
      token: generateToken(merchant_id, 'merchant')
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.userLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const [rows] = await pool.query(
      'SELECT * FROM users WHERE email=?',
      [email]
    );

    if (rows.length === 0)
      return res.status(400).json({ message: 'User not found' });

    const user = rows[0];

    const match = await bcrypt.compare(password, user.password);

    if (!match)
      return res.status(400).json({ message: 'Wrong password' });

    res.json({
      message: 'Login success',
      token: generateToken(user.user_id, 'customer')
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.merchantLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const [rows] = await pool.query(
      'SELECT * FROM merchants WHERE email=?',
      [email]
    );

    if (rows.length === 0)
      return res.status(400).json({ message: 'Merchant not found' });

    const merchant = rows[0];

    const match = await bcrypt.compare(password, merchant.password);

    if (!match)
      return res.status(400).json({ message: 'Wrong password' });

    res.json({
      message: 'Login success',
      token: generateToken(merchant.merchant_id, 'merchant')
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};