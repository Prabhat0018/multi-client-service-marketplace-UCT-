import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { publicAPI } from '../services/api';

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const categoryIcons = ['🔧', '🧹', '⚡', '🎨', '💇', '📦', '🚗', '💻', '🏠', '🛠️', '📱', '🌿'];

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await publicAPI.getCategories();
        setCategories(res.data.categories || []);
      } catch (err) {
        console.error('Failed to fetch categories');
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, []);

  return (
    <div className="page">
      <div className="container">
        <h1 style={{ marginBottom: '10px' }}>Service Categories</h1>
        <p className="text-muted mb-3">Browse all service categories</p>

        {loading ? (
          <div className="loading">Loading categories...</div>
        ) : categories.length === 0 ? (
          <div className="empty-state">
            <h3>No categories available</h3>
            <p>Categories will be added soon</p>
          </div>
        ) : (
          <div className="grid grid-4">
            {categories.map((category, index) => (
              <Link to={`/services?category=${category.id}`} key={category.id}>
                <div className="card category-card">
                  <div className="category-icon">
                    {categoryIcons[index % categoryIcons.length]}
                  </div>
                  <h3>{category.name}</h3>
                  <p>{category.description || 'Professional services'}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Categories;
