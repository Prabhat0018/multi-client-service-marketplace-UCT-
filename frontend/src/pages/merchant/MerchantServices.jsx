import React, { useState, useEffect } from 'react';
import { merchantAPI } from '../../services/api';

const MerchantServices = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    duration: ''
  });

  const fetchServices = async () => {
    try {
      const res = await merchantAPI.getServices();
      setServices(res.data.services || []);
    } catch (err) {
      console.error('Failed to fetch services');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const openAddModal = () => {
    setEditingService(null);
    setFormData({ title: '', description: '', price: '', duration: '' });
    setShowModal(true);
  };

  const openEditModal = (service) => {
    setEditingService(service);
    setFormData({
      title: service.title,
      description: service.description || '',
      price: service.price,
      duration: service.duration
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingService(null);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      if (editingService) {
        await merchantAPI.updateService(editingService.id, formData);
      } else {
        await merchantAPI.createService(formData);
      }
      closeModal();
      fetchServices();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save service');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (serviceId) => {
    if (!window.confirm('Are you sure you want to delete this service?')) return;

    try {
      await merchantAPI.deleteService(serviceId);
      fetchServices();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete service');
    }
  };

  return (
    <div>
      <div className="flex flex-between flex-center mb-3">
        <h2>My Services</h2>
        <button className="btn btn-primary" onClick={openAddModal}>
          + Add Service
        </button>
      </div>

      {loading ? (
        <div className="loading">Loading services...</div>
      ) : services.length === 0 ? (
        <div className="empty-state">
          <h3>No services yet</h3>
          <p>Create your first service to start receiving orders</p>
          <button className="btn btn-primary mt-2" onClick={openAddModal}>
            Add Your First Service
          </button>
        </div>
      ) : (
        <div className="grid grid-3">
          {services.map(service => (
            <div className="card" key={service.id}>
              <div className="card-body">
                <div className="flex flex-between flex-center mb-1">
                  <span className={`badge ${service.is_active !== 0 ? 'badge-completed' : 'badge-cancelled'}`}>
                    {service.is_active !== 0 ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <h3 className="card-title">{service.title}</h3>
                <p className="card-text" style={{ 
                  display: '-webkit-box', 
                  WebkitLineClamp: 2, 
                  WebkitBoxOrient: 'vertical', 
                  overflow: 'hidden',
                  marginBottom: '15px'
                }}>
                  {service.description}
                </p>
                <div className="flex flex-between flex-center mb-2">
                  <span style={{ fontWeight: '600', color: 'var(--primary)' }}>₹{service.price}</span>
                  <span className="text-muted">{service.duration} mins</span>
                </div>
                <div className="flex gap-1">
                  <button className="btn btn-secondary btn-sm" onClick={() => openEditModal(service)}>
                    Edit
                  </button>
                  <button className="btn btn-danger btn-sm" onClick={() => handleDelete(service.id)}>
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingService ? 'Edit Service' : 'Add New Service'}</h3>
              <button className="btn btn-secondary btn-sm" onClick={closeModal}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {error && <div className="alert alert-error">{error}</div>}
                
                <div className="form-group">
                  <label>Service Title *</label>
                  <input
                    type="text"
                    name="title"
                    className="form-control"
                    placeholder="e.g., Home Deep Cleaning"
                    value={formData.title}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    name="description"
                    className="form-control"
                    placeholder="Describe your service..."
                    value={formData.description}
                    onChange={handleChange}
                    rows={3}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                  <div className="form-group">
                    <label>Price (₹) *</label>
                    <input
                      type="number"
                      name="price"
                      className="form-control"
                      placeholder="500"
                      value={formData.price}
                      onChange={handleChange}
                      required
                      min="1"
                    />
                  </div>

                  <div className="form-group">
                    <label>Duration (minutes) *</label>
                    <input
                      type="number"
                      name="duration"
                      className="form-control"
                      placeholder="60"
                      value={formData.duration}
                      onChange={handleChange}
                      required
                      min="1"
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={closeModal}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : (editingService ? 'Update Service' : 'Add Service')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MerchantServices;
