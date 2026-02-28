import React, { useState, useEffect } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { merchantAPI } from '../../services/api';

const MerchantLayout = () => {
  const location = useLocation();
  const [stats, setStats] = useState({ total: 0, pending: 0, completed: 0, revenue: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await merchantAPI.getOrderStats();
        setStats(res.data.stats || { total: 0, pending: 0, completed: 0, revenue: 0 });
      } catch (err) {
        console.error('Failed to fetch stats');
      }
    };
    fetchStats();
  }, []);

  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <div className="dashboard">
      {/* Sidebar */}
      <aside className="sidebar">
        <div style={{ padding: '20px', borderBottom: '1px solid var(--gray-200)', marginBottom: '10px' }}>
          <h3 style={{ fontSize: '1.1rem' }}>Merchant Panel</h3>
        </div>
        <nav className="sidebar-nav">
          <Link to="/merchant/dashboard" className={isActive('/merchant/dashboard') ? 'active' : ''}>
            📊 Dashboard
          </Link>
          <Link to="/merchant/services" className={isActive('/merchant/services') ? 'active' : ''}>
            🛠️ My Services
          </Link>
          <Link to="/merchant/orders" className={isActive('/merchant/orders') ? 'active' : ''}>
            📦 Orders
          </Link>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="dashboard-content">
        {/* Only show stats on main dashboard */}
        {location.pathname === '/merchant/dashboard' && (
          <>
            <h2 style={{ marginBottom: '25px' }}>Dashboard Overview</h2>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-value">{stats.total}</div>
                <div className="stat-label">Total Orders</div>
              </div>
              <div className="stat-card">
                <div className="stat-value" style={{ color: 'var(--warning)' }}>{stats.pending}</div>
                <div className="stat-label">Pending</div>
              </div>
              <div className="stat-card">
                <div className="stat-value" style={{ color: 'var(--secondary)' }}>{stats.completed}</div>
                <div className="stat-label">Completed</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">₹{stats.revenue || 0}</div>
                <div className="stat-label">Total Revenue</div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="card mb-3">
              <div className="card-body">
                <h3 style={{ marginBottom: '15px' }}>Quick Actions</h3>
                <div className="flex gap-2">
                  <Link to="/merchant/services" className="btn btn-primary">
                    Manage Services
                  </Link>
                  <Link to="/merchant/orders" className="btn btn-secondary">
                    View Orders
                  </Link>
                </div>
              </div>
            </div>
          </>
        )}

        <Outlet />
      </main>
    </div>
  );
};

export default MerchantLayout;
