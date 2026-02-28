import React, { useState, useEffect } from 'react';
import { merchantAPI } from '../../services/api';

const MerchantOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [updatingId, setUpdatingId] = useState(null);

  const fetchOrders = async () => {
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      const res = await merchantAPI.getOrders(params);
      setOrders(res.data.orders || []);
    } catch (err) {
      console.error('Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  const handleStatusUpdate = async (orderId, newStatus) => {
    setUpdatingId(orderId);
    try {
      await merchantAPI.updateOrderStatus(orderId, newStatus);
      fetchOrders();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update status');
    } finally {
      setUpdatingId(null);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      pending: 'badge-pending',
      confirmed: 'badge-confirmed',
      in_progress: 'badge-in_progress',
      completed: 'badge-completed',
      cancelled: 'badge-cancelled'
    };
    return statusMap[status] || 'badge-pending';
  };

  const getNextStatus = (currentStatus) => {
    const flow = {
      pending: 'confirmed',
      confirmed: 'in_progress',
      in_progress: 'completed'
    };
    return flow[currentStatus] || null;
  };

  const getNextStatusLabel = (currentStatus) => {
    const labels = {
      pending: 'Confirm',
      confirmed: 'Start Work',
      in_progress: 'Mark Complete'
    };
    return labels[currentStatus] || null;
  };

  return (
    <div>
      <div className="flex flex-between flex-center mb-3">
        <h2>Orders</h2>
        <select 
          className="form-control" 
          style={{ width: 'auto' }}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All Orders</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {loading ? (
        <div className="loading">Loading orders...</div>
      ) : orders.length === 0 ? (
        <div className="empty-state">
          <h3>No orders found</h3>
          <p>{statusFilter ? 'Try changing the filter' : 'Orders from customers will appear here'}</p>
        </div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Service</th>
                <th>Customer</th>
                <th>Scheduled</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(order => (
                <tr key={order.id}>
                  <td>
                    <span style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
                      #{order.id.slice(0, 8)}
                    </span>
                  </td>
                  <td>
                    <strong>{order.service_title || '-'}</strong>
                  </td>
                  <td>
                    <div>{order.customer_name || 'Customer'}</div>
                    {order.notes && (
                      <small className="text-muted" style={{ display: 'block' }}>
                        Note: {order.notes}
                      </small>
                    )}
                  </td>
                  <td>{order.scheduled_date ? formatDate(order.scheduled_date) : '-'}</td>
                  <td style={{ fontWeight: '600' }}>₹{order.total_amount}</td>
                  <td>
                    <span className={`badge ${getStatusBadge(order.status)}`}>
                      {order.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td>
                    {getNextStatus(order.status) && (
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => handleStatusUpdate(order.id, getNextStatus(order.status))}
                        disabled={updatingId === order.id}
                      >
                        {updatingId === order.id ? '...' : getNextStatusLabel(order.status)}
                      </button>
                    )}
                    {order.status === 'completed' && (
                      <span className="text-success" style={{ fontSize: '0.85rem' }}>✓ Done</span>
                    )}
                    {order.status === 'cancelled' && (
                      <span className="text-danger" style={{ fontSize: '0.85rem' }}>Cancelled</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default MerchantOrders;
