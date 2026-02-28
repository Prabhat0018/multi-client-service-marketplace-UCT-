import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { publicAPI } from '../services/api';

const Services = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await publicAPI.getCategories();
        setCategories(res.data.categories || []);
      } catch (err) {
        console.error('Failed to fetch categories');
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    const fetchServices = async () => {
      setLoading(true);
      try {
        const params = {};
        const search = searchParams.get('search');
        const category = searchParams.get('category');
        
        if (search) params.search = search;
        if (category) params.category_id = category;

        let response;
        if (search) {
          response = await publicAPI.search(search);
          setServices(response.data.services || []);
        } else {
          response = await publicAPI.getServices(params);
          setServices(response.data.services || []);
        }
      } catch (err) {
        console.error('Failed to fetch services');
        setServices([]);
      } finally {
        setLoading(false);
      }
    };
    fetchServices();
  }, [searchParams]);

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchQuery) params.set('search', searchQuery);
    if (selectedCategory) params.set('category', selectedCategory);
    setSearchParams(params);
  };

  const handleCategoryFilter = (categoryId) => {
    setSelectedCategory(categoryId);
    const params = new URLSearchParams();
    if (searchQuery) params.set('search', searchQuery);
    if (categoryId) params.set('category', categoryId);
    setSearchParams(params);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('');
    setSearchParams({});
  };

  return (
    <div className="page">
      <div className="container">
        <h1 style={{ marginBottom: '30px' }}>Browse Services</h1>

        {/* Search & Filter */}
        <div className="card" style={{ marginBottom: '30px' }}>
          <div className="card-body">
            <form onSubmit={handleSearch} className="flex gap-2" style={{ flexWrap: 'wrap' }}>
              <input
                type="text"
                className="form-control"
                placeholder="Search services..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ flex: 1, minWidth: '200px' }}
              />
              <select 
                className="form-control"
                value={selectedCategory}
                onChange={(e) => handleCategoryFilter(e.target.value)}
                style={{ width: 'auto', minWidth: '150px' }}
              >
                <option value="">All Categories</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
              <button type="submit" className="btn btn-primary">Search</button>
              {(searchQuery || selectedCategory) && (
                <button type="button" className="btn btn-secondary" onClick={clearFilters}>
                  Clear
                </button>
              )}
            </form>
          </div>
        </div>

        {/* Results */}
        {loading ? (
          <div className="loading">Loading services...</div>
        ) : services.length === 0 ? (
          <div className="empty-state">
            <h3>No services found</h3>
            <p>Try adjusting your search or filters</p>
            <button className="btn btn-primary mt-2" onClick={clearFilters}>
              View All Services
            </button>
          </div>
        ) : (
          <>
            <p className="text-muted mb-2">{services.length} service(s) found</p>
            <div className="grid grid-3">
              {services.map(service => (
                <Link to={`/services/${service.id}`} key={service.id}>
                  <div className="card service-card">
                    <div className="card-body">
                      <span className="badge badge-confirmed" style={{ marginBottom: '10px', display: 'inline-block' }}>
                        {service.category_name || 'Service'}
                      </span>
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
                      <div style={{ marginBottom: '10px' }}>
                        <span className="text-muted" style={{ fontSize: '0.85rem' }}>
                          Duration: {service.duration} mins
                        </span>
                      </div>
                      <div className="flex flex-between flex-center">
                        <span className="price">₹{service.price}</span>
                        <span className="merchant">{service.merchant_name || 'Professional'}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Services;
