import React, { useState, useEffect } from 'react';
import { publicAPI, customerAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

// Star Rating Component
export const StarRating = ({ rating, onRate, size = 'medium', readonly = true }) => {
  const [hovered, setHovered] = useState(0);
  
  const sizes = {
    small: '1rem',
    medium: '1.2rem',
    large: '1.5rem'
  };

  return (
    <div className="star-rating">
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          className={`star ${star <= (hovered || rating) ? 'filled' : ''} ${!readonly ? 'clickable' : ''}`}
          style={{ fontSize: sizes[size] }}
          onClick={() => !readonly && onRate && onRate(star)}
          onMouseEnter={() => !readonly && setHovered(star)}
          onMouseLeave={() => !readonly && setHovered(0)}
        >
          ★
        </span>
      ))}
    </div>
  );
};

// Review Form Component
export const ReviewForm = ({ orderId, onReviewSubmitted }) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (rating === 0) {
      setError('Please select a rating');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      await customerAPI.createReview(orderId, { rating, comment });
      setRating(0);
      setComment('');
      if (onReviewSubmitted) onReviewSubmitted();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="review-form">
      <h4 style={{ marginBottom: '15px' }}>Write a Review</h4>
      
      {error && <div className="alert alert-error mb-2">{error}</div>}
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Your Rating</label>
          <StarRating rating={rating} onRate={setRating} readonly={false} size="large" />
        </div>
        
        <div className="form-group">
          <label>Your Review (optional)</label>
          <textarea
            className="form-control"
            placeholder="Share your experience with this service..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
          />
        </div>
        
        <button 
          type="submit" 
          className="btn btn-primary"
          disabled={submitting || rating === 0}
        >
          {submitting ? 'Submitting...' : 'Submit Review'}
        </button>
      </form>
    </div>
  );
};

// Single Review Card Component
export const ReviewCard = ({ review }) => {
  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="review-card">
      <div className="review-header">
        <div className="reviewer-info">
          <div className="reviewer-avatar">
            {review.user_name?.charAt(0) || 'U'}
          </div>
          <div>
            <strong>{review.user_name || 'Anonymous'}</strong>
            <div className="review-date">{formatDate(review.created_at)}</div>
          </div>
        </div>
        <StarRating rating={review.rating} size="small" />
      </div>
      {review.comment && (
        <p style={{ color: 'var(--gray-700)', lineHeight: '1.6' }}>
          {review.comment}
        </p>
      )}
    </div>
  );
};

// Reviews List Component (for Service Detail page)
const Reviews = ({ serviceId, merchantId }) => {
  const { isAuthenticated, isCustomer } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState({ average: 0, total: 0, distribution: {} });
  const [loading, setLoading] = useState(true);
  const [userCompletedOrder, setUserCompletedOrder] = useState(null);

  useEffect(() => {
    fetchReviews();
    if (isAuthenticated && isCustomer()) {
      checkUserOrder();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serviceId, merchantId]);

  const fetchReviews = async () => {
    try {
      const res = await publicAPI.getServiceReviews(serviceId);
      setReviews(res.data.reviews || []);
      setStats(res.data.stats || { average: 0, total: 0, distribution: {} });
    } catch (err) {
      console.error('Failed to fetch reviews');
    } finally {
      setLoading(false);
    }
  };

  const checkUserOrder = async () => {
    try {
      const res = await customerAPI.getMyOrders('completed');
      const completedOrder = res.data.orders?.find(
        o => o.service_id === serviceId && !o.has_review
      );
      setUserCompletedOrder(completedOrder);
    } catch (err) {
      console.error('Failed to check user orders');
    }
  };

  const handleReviewSubmitted = () => {
    fetchReviews();
    setUserCompletedOrder(null);
  };

  if (loading) {
    return <div className="loading">Loading reviews...</div>;
  }

  return (
    <div className="reviews-section">
      <h3 style={{ marginBottom: '20px' }}>Reviews & Ratings</h3>

      {/* Rating Summary */}
      {stats.total > 0 && (
        <div className="rating-summary">
          <div style={{ textAlign: 'center' }}>
            <div className="rating-big">{stats.average.toFixed(1)}</div>
            <StarRating rating={Math.round(stats.average)} size="small" />
            <div className="text-muted" style={{ marginTop: '5px' }}>
              {stats.total} review{stats.total !== 1 ? 's' : ''}
            </div>
          </div>
          <div className="rating-bars">
            {[5, 4, 3, 2, 1].map((star) => (
              <div key={star} className="rating-bar">
                <span>{star}</span>
                <div className="rating-bar-fill">
                  <span style={{ 
                    width: `${stats.total > 0 ? ((stats.distribution[star] || 0) / stats.total) * 100 : 0}%` 
                  }} />
                </div>
                <span className="text-muted">{stats.distribution[star] || 0}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Review Form (only for authenticated customers with completed orders) */}
      {userCompletedOrder && (
        <ReviewForm 
          orderId={userCompletedOrder.order_id} 
          onReviewSubmitted={handleReviewSubmitted}
        />
      )}

      {/* Reviews List */}
      {reviews.length > 0 ? (
        <div className="card">
          {reviews.map((review) => (
            <ReviewCard key={review.review_id} review={review} />
          ))}
        </div>
      ) : (
        <div className="empty-state" style={{ padding: '40px' }}>
          <p className="text-muted">No reviews yet. Be the first to review!</p>
        </div>
      )}
    </div>
  );
};

export default Reviews;
