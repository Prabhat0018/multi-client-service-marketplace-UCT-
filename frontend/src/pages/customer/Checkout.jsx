import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { customerAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const Checkout = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, isCustomer } = useAuth();
  
  const [order, setOrder] = useState(location.state?.order || null);
  const [loading, setLoading] = useState(!location.state?.order);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('card');
  
  // Payment form states
  const [cardDetails, setCardDetails] = useState({
    cardNumber: '',
    expiry: '',
    cvv: '',
    name: ''
  });
  const [upiId, setUpiId] = useState('');
  const [selectedBank, setSelectedBank] = useState('');

  const banks = [
    { id: 'sbi', name: 'State Bank of India' },
    { id: 'hdfc', name: 'HDFC Bank' },
    { id: 'icici', name: 'ICICI Bank' },
    { id: 'axis', name: 'Axis Bank' },
    { id: 'kotak', name: 'Kotak Mahindra Bank' },
    { id: 'pnb', name: 'Punjab National Bank' }
  ];

  const handleCardChange = (e) => {
    const { name, value } = e.target;
    
    // Format card number with spaces
    if (name === 'cardNumber') {
      const formatted = value.replace(/\s/g, '').replace(/(\d{4})/g, '$1 ').trim();
      setCardDetails({ ...cardDetails, [name]: formatted.slice(0, 19) });
      return;
    }
    
    // Format expiry date
    if (name === 'expiry') {
      const cleaned = value.replace(/\D/g, '');
      if (cleaned.length >= 2) {
        setCardDetails({ ...cardDetails, [name]: cleaned.slice(0, 2) + '/' + cleaned.slice(2, 4) });
      } else {
        setCardDetails({ ...cardDetails, [name]: cleaned });
      }
      return;
    }
    
    setCardDetails({ ...cardDetails, [name]: value });
  };

  useEffect(() => {
    if (!isAuthenticated || !isCustomer()) {
      navigate('/login');
      return;
    }

    if (!order && orderId) {
      fetchOrder();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId, isAuthenticated]);

  const fetchOrder = async () => {
    try {
      const res = await customerAPI.getOrderById(orderId);
      setOrder(res.data.order);
    } catch (err) {
      setError('Order not found');
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    setError('');

    // Validate payment method inputs
    if (paymentMethod === 'card') {
      if (!cardDetails.cardNumber || cardDetails.cardNumber.replace(/\s/g, '').length < 16) {
        setError('Please enter a valid card number');
        return;
      }
      if (!cardDetails.expiry || cardDetails.expiry.length < 5) {
        setError('Please enter a valid expiry date');
        return;
      }
      if (!cardDetails.cvv || cardDetails.cvv.length < 3) {
        setError('Please enter a valid CVV');
        return;
      }
      if (!cardDetails.name) {
        setError('Please enter cardholder name');
        return;
      }
    }

    if (paymentMethod === 'upi') {
      if (!upiId || !upiId.includes('@')) {
        setError('Please enter a valid UPI ID (e.g., name@upi)');
        return;
      }
    }

    if (paymentMethod === 'netbanking') {
      if (!selectedBank) {
        setError('Please select a bank');
        return;
      }
    }

    setProcessing(true);

    try {
      // Process payment
      const res = await customerAPI.processPayment(order.order_id, {
        payment_method: paymentMethod
      });

      if (res.data.success) {
        navigate('/payment-success', { 
          state: { order: res.data.order }
        });
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Payment failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="page">
        <div className="container">
          <div className="loading">Loading order details...</div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="page">
        <div className="container">
          <div className="empty-state">
            <h3>Order not found</h3>
            <button className="btn btn-primary mt-2" onClick={() => navigate('/services')}>
              Browse Services
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="container" style={{ maxWidth: '900px' }}>
        <h1 style={{ marginBottom: '30px' }}>Checkout</h1>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '30px' }}>
          {/* Payment Form */}
          <div>
            <div className="card mb-3">
              <div className="card-body">
                <h3 style={{ marginBottom: '20px' }}>Payment Method</h3>
                
                {error && <div className="alert alert-error mb-3">{error}</div>}

                <div className="payment-options">
                  <label className={`payment-option ${paymentMethod === 'card' ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      name="payment"
                      value="card"
                      checked={paymentMethod === 'card'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                    />
                    <div className="payment-option-content">
                      <span className="payment-icon">💳</span>
                      <div>
                        <strong>Credit/Debit Card</strong>
                        <p className="text-muted" style={{ fontSize: '0.85rem' }}>
                          Pay securely with your card
                        </p>
                      </div>
                    </div>
                  </label>

                  <label className={`payment-option ${paymentMethod === 'upi' ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      name="payment"
                      value="upi"
                      checked={paymentMethod === 'upi'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                    />
                    <div className="payment-option-content">
                      <span className="payment-icon">📱</span>
                      <div>
                        <strong>UPI</strong>
                        <p className="text-muted" style={{ fontSize: '0.85rem' }}>
                          Pay using UPI apps like Google Pay, PhonePe
                        </p>
                      </div>
                    </div>
                  </label>

                  <label className={`payment-option ${paymentMethod === 'netbanking' ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      name="payment"
                      value="netbanking"
                      checked={paymentMethod === 'netbanking'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                    />
                    <div className="payment-option-content">
                      <span className="payment-icon">🏦</span>
                      <div>
                        <strong>Net Banking</strong>
                        <p className="text-muted" style={{ fontSize: '0.85rem' }}>
                          Pay directly from your bank account
                        </p>
                      </div>
                    </div>
                  </label>

                  <label className={`payment-option ${paymentMethod === 'cod' ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      name="payment"
                      value="cod"
                      checked={paymentMethod === 'cod'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                    />
                    <div className="payment-option-content">
                      <span className="payment-icon">💵</span>
                      <div>
                        <strong>Pay After Service</strong>
                        <p className="text-muted" style={{ fontSize: '0.85rem' }}>
                          Pay in cash after service completion
                        </p>
                      </div>
                    </div>
                  </label>
                </div>

                {paymentMethod === 'card' && (
                  <div className="card-form mt-3">
                    <div className="form-group">
                      <label>Card Number</label>
                      <input
                        type="text"
                        name="cardNumber"
                        className="form-control"
                        placeholder="1234 5678 9012 3456"
                        value={cardDetails.cardNumber}
                        onChange={handleCardChange}
                        maxLength="19"
                      />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                      <div className="form-group">
                        <label>Expiry Date</label>
                        <input
                          type="text"
                          name="expiry"
                          className="form-control"
                          placeholder="MM/YY"
                          value={cardDetails.expiry}
                          onChange={handleCardChange}
                          maxLength="5"
                        />
                      </div>
                      <div className="form-group">
                        <label>CVV</label>
                        <input
                          type="password"
                          name="cvv"
                          className="form-control"
                          placeholder="•••"
                          value={cardDetails.cvv}
                          onChange={handleCardChange}
                          maxLength="4"
                        />
                      </div>
                    </div>
                    <div className="form-group">
                      <label>Cardholder Name</label>
                      <input
                        type="text"
                        name="name"
                        className="form-control"
                        placeholder="Name on card"
                        value={cardDetails.name}
                        onChange={handleCardChange}
                      />
                    </div>
                  </div>
                )}

                {paymentMethod === 'upi' && (
                  <div className="upi-form mt-3">
                    <div className="form-group">
                      <label>UPI ID</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="yourname@upi"
                        value={upiId}
                        onChange={(e) => setUpiId(e.target.value)}
                      />
                    </div>
                    <p className="text-muted" style={{ fontSize: '0.85rem', marginTop: '10px' }}>
                      You will receive a payment request on your UPI app
                    </p>
                  </div>
                )}

                {paymentMethod === 'netbanking' && (
                  <div className="netbanking-form mt-3">
                    <div className="form-group">
                      <label>Select Your Bank</label>
                      <select 
                        className="form-control"
                        value={selectedBank}
                        onChange={(e) => setSelectedBank(e.target.value)}
                      >
                        <option value="">-- Select Bank --</option>
                        {banks.map(bank => (
                          <option key={bank.id} value={bank.id}>{bank.name}</option>
                        ))}
                      </select>
                    </div>
                    <p className="text-muted" style={{ fontSize: '0.85rem', marginTop: '10px' }}>
                      You will be redirected to your bank's secure payment page
                    </p>
                  </div>
                )}

                {paymentMethod === 'cod' && (
                  <div className="cod-info mt-3" style={{ padding: '15px', background: 'var(--gray-50)', borderRadius: 'var(--radius)' }}>
                    <p style={{ marginBottom: '10px' }}>
                      <strong>Pay After Service</strong>
                    </p>
                    <p className="text-muted" style={{ fontSize: '0.85rem' }}>
                      Pay the service provider in cash after the service is completed. 
                      Please have the exact amount (₹{order.total_amount}) ready.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div>
            <div className="card" style={{ position: 'sticky', top: '90px' }}>
              <div className="card-body">
                <h3 style={{ marginBottom: '20px' }}>Order Summary</h3>
                
                <div className="order-summary-item">
                  <div>
                    <strong>{order.service_title || order.service?.title}</strong>
                    <p className="text-muted" style={{ fontSize: '0.85rem' }}>
                      {order.business_name || order.merchant?.name}
                    </p>
                  </div>
                </div>

                {order.scheduled_date && (
                  <div className="summary-row">
                    <span className="text-muted">Scheduled Date</span>
                    <span>{new Date(order.scheduled_date).toLocaleDateString()}</span>
                  </div>
                )}

                <div style={{ 
                  borderTop: '1px solid var(--gray-200)', 
                  marginTop: '15px',
                  paddingTop: '15px'
                }}>
                  <div className="summary-row">
                    <span>Service Price</span>
                    <span>₹{order.total_amount}</span>
                  </div>
                  <div className="summary-row">
                    <span className="text-muted">Platform Fee</span>
                    <span className="text-muted">₹0</span>
                  </div>
                </div>

                <div style={{ 
                  borderTop: '2px solid var(--gray-300)', 
                  marginTop: '15px',
                  paddingTop: '15px'
                }}>
                  <div className="summary-row" style={{ fontWeight: '600', fontSize: '1.1rem' }}>
                    <span>Total</span>
                    <span style={{ color: 'var(--primary)' }}>₹{order.total_amount}</span>
                  </div>
                </div>

                <button
                  className="btn btn-primary btn-lg"
                  style={{ width: '100%', marginTop: '20px' }}
                  onClick={handlePayment}
                  disabled={processing}
                >
                  {processing ? 'Processing...' : `Pay ₹${order.total_amount}`}
                </button>

                <p className="text-muted text-center mt-2" style={{ fontSize: '0.8rem' }}>
                  🔒 Secure payment powered by SSL encryption
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
