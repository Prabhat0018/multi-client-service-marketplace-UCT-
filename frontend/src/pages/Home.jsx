import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { publicAPI } from '../services/api';

const Home = () => {
  const [categories, setCategories] = useState([]);
  const [services, setServices] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [catRes, servRes] = await Promise.all([
          publicAPI.getCategories(),
          publicAPI.getServices({ limit: 8 })
        ]);
        setCategories(catRes.data.categories || []);
        setServices(servRes.data.services || []);
      } catch (err) {
        console.error('Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/services?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  const categoryIcons = ['🔧', '🧹', '⚡', '🎨', '💇', '📦', '🚗', '💻'];

  return (
    <div>
      {/* Hero Section */}
      <section className="hero">
        <div className="container">
          <h1>Find Trusted Local Services</h1>
          <p>Book skilled professionals for home services, repairs, beauty, and more. Quality service at your doorstep.</p>
          
          <form className="search-box" onSubmit={handleSearch}>
            <input
              type="text"
              placeholder="What service do you need?"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button type="submit" className="btn btn-success btn-lg">
              Search
            </button>
          </form>
        </div>
      </section>

      {/* Categories Section */}
      <section className="page">
        <div className="container">
          <div className="flex flex-between flex-center mb-3">
            <h2>Popular Categories</h2>
            <Link to="/categories" className="text-primary">View All</Link>
          </div>

          {loading ? (
            <div className="loading">Loading categories...</div>
          ) : (
            <div className="grid grid-4">
              {categories.slice(0, 8).map((category, index) => (
                <Link to={`/services?category=${category.id}`} key={category.id}>
                  <div className="card category-card">
                    <div className="category-icon">
                      {categoryIcons[index % categoryIcons.length]}
                    </div>
                    <h3>{category.name}</h3>
                    <p>{category.description || 'Quality services'}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Featured Services Section */}
      <section style={{ background: '#fff', padding: '60px 0' }}>
        <div className="container">
          <div className="flex flex-between flex-center mb-3">
            <h2>Featured Services</h2>
            <Link to="/services" className="text-primary">View All</Link>
          </div>

          {loading ? (
            <div className="loading">Loading services...</div>
          ) : services.length === 0 ? (
            <div className="empty-state">
              <h3>No services available yet</h3>
              <p>Check back soon for amazing services!</p>
            </div>
          ) : (
            <div className="grid grid-4">
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
                        overflow: 'hidden' 
                      }}>
                        {service.description}
                      </p>
                      <div className="flex flex-between flex-center mt-2">
                        <span className="price">₹{service.price}</span>
                        <span className="merchant">{service.merchant_name || 'Professional'}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section style={{ background: 'var(--gray-100)', padding: '60px 0', textAlign: 'center' }}>
        <div className="container">
          <h2 style={{ marginBottom: '15px' }}>Are you a service provider?</h2>
          <p style={{ color: 'var(--gray-500)', marginBottom: '25px' }}>
            Join thousands of professionals earning on ServiceHub
          </p>
          <Link to="/register" className="btn btn-primary btn-lg">
            Become a Merchant
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Home;
