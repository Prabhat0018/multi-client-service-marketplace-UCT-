import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { publicAPI, customerAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const ServiceDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, isCustomer } = useAuth();
  
  const [service, setService] = useState(null);
  const [merchant, setMerchant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [bookingData, setBookingData] = useState({
    scheduled_date: '',
    address: '',
    notes: ''
  });

  useEffect(() => {
    const fetchServiceAndMerchant = async () => {
      try {
        // Get all services and find the one we need
        const servRes = await publicAPI.getServices();
        const foundService = (servRes.data.services || []).find(s => s.id === id);
        
        if (foundService) {
          setService(foundService);
          
          // Get merchant details
          try {
            const merchRes = await publicAPI.getMerchantById(foundService.merchant_id);
            setMerchant(merchRes.data.merchant);
          } catch (err) {
            console.error('Failed to fetch merchant');
          }
        }
      } catch (err) {
        console.error('Failed to fetch service');
      } finally {
        setLoading(false);
      }
    };
    fetchServiceAndMerchant();
  }, [id]);

  const handleBookingChange = (e) => {
    setBookingData({ ...bookingData, [e.target.name]: e.target.value });
  };

  const handleBookService = async (e) => {
    e.preventDefault();
    
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (!isCustomer()) {
      setError('Only customers can book services');
      return;
    }

    if (!bookingData.scheduled_date) {
      setError('Please select a date');
      return;
    }

    setBooking(true);
    setError('');
    setSuccess('');

    try {
      await customerAPI.createOrder({
        service_id: service.id,
        merchant_id: service.merchant_id,
        scheduled_date: bookingData.scheduled_date,
        address: bookingData.address,
        notes: bookingData.notes
      });

      setSuccess('Service booked successfully! Redirecting to your orders...');
      setTimeout(() => {
        navigate('/my-orders');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to book service');
    } finally {
      setBooking(false);
    }
  };

  if (loading) {
    return <div className="page"><div className="container"><div className="loading">Loading service...</div></div></div>;
  }

  if (!service) {
    return (
      <div className="page">
        <div className="container">
          <div className="empty-state">
            <h3>Service not found</h3>
            <p>This service may have been removed</p>
            <button className="btn btn-primary mt-2" onClick={() => navigate('/services')}>
              Browse Services
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Get minimum date (today)
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="page">
      <div className="container">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '30px' }}>
          {/* Service Details */}
          <div>
            <span className="badge badge-confirmed mb-2" style={{ display: 'inline-block' }}>
              {service.category_name || 'Service'}
            </span>
            <h1 style={{ marginBottom: '20px' }}>{service.title}</h1>
            
            <div className="card mb-3">
              <div className="card-body">
                <h3 style={{ marginBottom: '15px' }}>About this service</h3>
                <p style={{ color: 'var(--gray-700)', lineHeight: '1.7' }}>
                  {service.description}
                </p>
                
                <div style={{ marginTop: '20px', display: 'flex', gap: '30px' }}>
                  <div>
                    <span className="text-muted">Duration</span>
                    <p style={{ fontWeight: '600', fontSize: '1.1rem' }}>{service.duration} minutes</p>
                  </div>
                  <div>
                    <span className="text-muted">Price</span>
                    <p style={{ fontWeight: '600', fontSize: '1.1rem', color: 'var(--primary)' }}>₹{service.price}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Merchant Info */}
            {merchant && (
              <div className="card">
                <div className="card-body">
                  <h3 style={{ marginBottom: '15px' }}>Service Provider</h3>
                  <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                    <div style={{ 
                      width: '60px', 
                      height: '60px', 
                      background: 'var(--primary)', 
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: '1.5rem',
                      fontWeight: 'bold'
                    }}>
                      {merchant.business_name?.charAt(0) || 'M'}
                    </div>
                    <div>
                      <h4>{merchant.business_name}</h4>
                      <p className="text-muted" style={{ fontSize: '0.9rem' }}>
                        {merchant.address || 'Professional Service Provider'}
                      </p>
                    </div>
                  </div>
                  {merchant.description && (
                    <p style={{ marginTop: '15px', color: 'var(--gray-600)' }}>
                      {merchant.description}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Booking Form */}
          <div>
            <div className="card" style={{ position: 'sticky', top: '90px' }}>
              <div className="card-body">
                <h3 style={{ marginBottom: '20px' }}>Book This Service</h3>
                
                {error && <div className="alert alert-error">{error}</div>}
                {success && <div className="alert alert-success">{success}</div>}

                <form onSubmit={handleBookService}>
                  <div className="form-group">
                    <label>Select Date *</label>
                    <input
                      type="date"
                      name="scheduled_date"
                      className="form-control"
                      value={bookingData.scheduled_date}
                      onChange={handleBookingChange}
                      min={today}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Service Address</label>
                    <input
                      type="text"
                      name="address"
                      className="form-control"
                      placeholder="Where do you need the service?"
                      value={bookingData.address}
                      onChange={handleBookingChange}
                    />
                  </div>

                  <div className="form-group">
                    <label>Additional Notes</label>
                    <textarea
                      name="notes"
                      className="form-control"
                      placeholder="Any special requirements?"
                      value={bookingData.notes}
                      onChange={handleBookingChange}
                      rows={3}
                    />
                  </div>

                  <div style={{ 
                    borderTop: '1px solid var(--gray-200)', 
                    paddingTop: '20px',
                    marginTop: '10px'
                  }}>
                    <div className="flex flex-between flex-center mb-2">
                      <span>Service Price</span>
                      <span style={{ fontWeight: '600' }}>₹{service.price}</span>
                    </div>
                    <div className="flex flex-between flex-center mb-2">
                      <span className="text-muted" style={{ fontSize: '0.9rem' }}>Duration</span>
                      <span className="text-muted" style={{ fontSize: '0.9rem' }}>{service.duration} mins</span>
                    </div>
                  </div>

                  {isAuthenticated && isCustomer() ? (
                    <button 
                      type="submit" 
                      className="btn btn-primary btn-lg" 
                      style={{ width: '100%', marginTop: '15px' }}
                      disabled={booking}
                    >
                      {booking ? 'Booking...' : 'Book Now'}
                    </button>
                  ) : (
                    <button 
                      type="button" 
                      className="btn btn-primary btn-lg" 
                      style={{ width: '100%', marginTop: '15px' }}
                      onClick={() => navigate('/login')}
                    >
                      Login to Book
                    </button>
                  )}
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServiceDetail;
