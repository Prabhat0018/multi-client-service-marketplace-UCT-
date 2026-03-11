import React from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';

const PaymentSuccess = () => {
  const location = useLocation();
  const navigate = useNavigate(); // eslint-disable-line no-unused-vars
  const order = location.state?.order;

  if (!order) {
    return (
      <div className="page">
        <div className="container" style={{ maxWidth: '600px', textAlign: 'center' }}>
          <div className="card">
            <div className="card-body" style={{ padding: '40px' }}>
              <h2>No Order Found</h2>
              <p className="text-muted mt-2">Please check your orders page.</p>
              <Link to="/my-orders" className="btn btn-primary mt-3">
                View My Orders
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="container" style={{ maxWidth: '600px', textAlign: 'center' }}>
        <div className="card">
          <div className="card-body" style={{ padding: '50px 40px' }}>
            {/* Success Icon */}
            <div style={{ 
              width: '80px', 
              height: '80px', 
              background: 'var(--secondary)', 
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 25px',
              fontSize: '2.5rem'
            }}>
              ✓
            </div>

            <h1 style={{ color: 'var(--secondary)', marginBottom: '10px' }}>
              Payment Successful!
            </h1>
            <p className="text-muted" style={{ fontSize: '1.1rem' }}>
              Your booking has been confirmed
            </p>

            {/* Order Details */}
            <div style={{ 
              background: 'var(--gray-50)', 
              borderRadius: 'var(--radius)',
              padding: '25px',
              marginTop: '30px',
              textAlign: 'left'
            }}>
              <h3 style={{ marginBottom: '15px', fontSize: '1rem' }}>Booking Details</h3>
              
              <div className="summary-row">
                <span className="text-muted">Order ID</span>
                <span style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
                  {order.order_id?.slice(0, 8)}...
                </span>
              </div>
              
              <div className="summary-row">
                <span className="text-muted">Service</span>
                <span>{order.service_title}</span>
              </div>
              
              <div className="summary-row">
                <span className="text-muted">Provider</span>
                <span>{order.business_name}</span>
              </div>

              {order.scheduled_date && (
                <div className="summary-row">
                  <span className="text-muted">Scheduled</span>
                  <span>{new Date(order.scheduled_date).toLocaleDateString()}</span>
                </div>
              )}
              
              <div className="summary-row" style={{ 
                borderTop: '1px solid var(--gray-200)',
                paddingTop: '15px',
                marginTop: '15px',
                fontWeight: '600'
              }}>
                <span>Amount Paid</span>
                <span style={{ color: 'var(--primary)' }}>₹{order.total_amount}</span>
              </div>
            </div>

            {/* Status Badge */}
            <div style={{ marginTop: '25px' }}>
              <span className="badge badge-confirmed" style={{ fontSize: '0.9rem', padding: '8px 16px' }}>
                {order.order_status === 'confirmed' ? '✓ Booking Confirmed' : 'Pending Confirmation'}
              </span>
            </div>

            <p className="text-muted mt-3" style={{ fontSize: '0.9rem' }}>
              The service provider will contact you soon to confirm the appointment.
            </p>

            {/* Actions */}
            <div style={{ marginTop: '30px', display: 'flex', gap: '15px', justifyContent: 'center' }}>
              <Link to="/my-orders" className="btn btn-primary">
                View My Orders
              </Link>
              <Link to="/services" className="btn btn-secondary">
                Browse More Services
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;
