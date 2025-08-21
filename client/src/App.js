import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [enquiryForm, setEnquiryForm] = useState({ name: '', email: '', message: '', phone: '' });
  const [enquiryStatus, setEnquiryStatus] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [popularPackages, setPopularPackages] = useState([]);
  const [currentView, setCurrentView] = useState('search'); // search, admin, analytics
  const [adminData, setAdminData] = useState({ enquiries: [], analytics: [] });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchSuggestions();
    fetchPopularPackages();
  }, []);

  const fetchSuggestions = async () => {
    try {
      const response = await fetch('/search/suggestions');
      const data = await response.json();
      setSuggestions(data);
    } catch (error) {
      console.error('Failed to fetch suggestions:', error);
    }
  };

  const fetchPopularPackages = async () => {
    try {
      const response = await fetch('/packages/popular');
      const data = await response.json();
      setPopularPackages(data);
    } catch (error) {
      console.error('Failed to fetch popular packages:', error);
    }
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/search/concern=${encodeURIComponent(searchTerm)}`);
      const data = await response.json();
      setSearchResults(data);
      setShowSuggestions(false);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setSearchTerm(suggestion);
    setShowSuggestions(false);
    setTimeout(() => handleSearch(), 100);
  };

  const handleEnquiry = async (packageId) => {
    setSelectedPackage(packageId);
    setEnquiryForm({ name: '', email: '', message: '', phone: '' });
    setEnquiryStatus('');
  };

  const fetchAdminData = async () => {
    try {
      const [enquiriesRes, analyticsRes] = await Promise.all([
        fetch('/admin/enquiries'),
        fetch('/admin/analytics')
      ]);
      const enquiries = await enquiriesRes.json();
      const analytics = await analyticsRes.json();
      setAdminData({ enquiries, analytics });
    } catch (error) {
      console.error('Failed to fetch admin data:', error);
    }
  };

  const updateEnquiryStatus = async (enquiryId, status) => {
    try {
      await fetch(`/admin/enquiries/${enquiryId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      fetchAdminData();
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const submitEnquiry = async (e) => {
    e.preventDefault();
    
    try {
      const response = await fetch('/enquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          package_id: selectedPackage,
          user_name: enquiryForm.name,
          user_email: enquiryForm.email,
          message: enquiryForm.message,
          phone: enquiryForm.phone
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        setEnquiryStatus(result.message);
        setSelectedPackage(null);
        setEnquiryForm({ name: '', email: '', message: '', phone: '' });
        fetchPopularPackages(); // Refresh popular packages
      } else {
        const error = await response.json();
        setEnquiryStatus(error.error || 'Failed to submit enquiry');
      }
    } catch (error) {
      setEnquiryStatus('Error submitting enquiry');
    }
  };

  return (
    <div className="App">
      <header>
        <h1>Cosma Beauty</h1>
        <p>Find the perfect treatment for your skin concerns</p>
        <nav className="nav-tabs">
          <button 
            className={currentView === 'search' ? 'active' : ''}
            onClick={() => setCurrentView('search')}
          >
            Search
          </button>
          <button 
            className={currentView === 'admin' ? 'active' : ''}
            onClick={() => { setCurrentView('admin'); fetchAdminData(); }}
          >
            Admin Dashboard
          </button>
        </nav>
      </header>

      <main>
        {currentView === 'search' && (
          <>
            <div className="search-section">
              <div className="search-container">
                <input
                  type="text"
                  placeholder="Enter your skin/hair concern..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setShowSuggestions(e.target.value.length > 0);
                  }}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  onFocus={() => setShowSuggestions(searchTerm.length > 0)}
                />
                <button onClick={handleSearch} disabled={loading}>
                  {loading ? '⏳' : 'Search'}
                </button>
                {showSuggestions && (
                  <div className="suggestions">
                    {suggestions
                      .filter(s => s.toLowerCase().includes(searchTerm.toLowerCase()))
                      .map((suggestion, idx) => (
                        <div 
                          key={idx} 
                          className="suggestion-item"
                          onClick={() => handleSuggestionClick(suggestion)}
                        >
                          {suggestion}
                        </div>
                      ))
                    }
                  </div>
                )}
              </div>
            </div>

            {!searchResults && popularPackages.length > 0 && (
              <div className="popular-section">
                <h2>🔥 Popular Packages</h2>
                <div className="packages">
                  {popularPackages.map(pkg => (
                    <div key={pkg.id} className="package-card popular">
                      <div className="popularity-badge">{pkg.enquiry_count} enquiries</div>
                      <h4>{pkg.package_name}</h4>
                      <p><strong>Clinic:</strong> {pkg.clinic_name}</p>
                      <p><strong>Treatment:</strong> {pkg.treatment_name}</p>
                      <p><strong>Price:</strong> ${pkg.price}</p>
                      <button onClick={() => handleEnquiry(pkg.id)}>
                        Enquire Now
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {currentView === 'search' && searchResults && (
          <div className="results-section">
            {searchResults.concern ? (
              <>
                <h2>Results for: {searchResults.concern.name}</h2>
                
                <div className="treatments">
                  <h3>Available Treatments</h3>
                  {searchResults.treatments.map(treatment => (
                    <div key={treatment.id} className="treatment-card">
                      {treatment.name}
                    </div>
                  ))}
                </div>

                <div className="packages">
                  <h3>Treatment Packages</h3>
                  {searchResults.packages.map(pkg => (
                    <div key={pkg.id} className="package-card">
                      <h4>{pkg.package_name}</h4>
                      <p><strong>Clinic:</strong> {pkg.clinic_name}</p>
                      <p><strong>Treatment:</strong> {pkg.treatment_name}</p>
                      <p><strong>Price:</strong> ${pkg.price}</p>
                      <button onClick={() => handleEnquiry(pkg.id)}>
                        Enquire Now
                      </button>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="no-results">
                <p>No results found for "{searchTerm}"</p>
                <p>Try searching for: {suggestions.join(', ')}</p>
              </div>
            )}
          </div>
        )}

        {currentView === 'admin' && (
          <div className="admin-section">
            <div className="admin-tabs">
              <h2>📊 Admin Dashboard</h2>
              
              <div className="admin-stats">
                <div className="stat-card">
                  <h3>{adminData.enquiries.length}</h3>
                  <p>Total Enquiries</p>
                </div>
                <div className="stat-card">
                  <h3>{adminData.enquiries.filter(e => e.status === 'pending').length}</h3>
                  <p>Pending</p>
                </div>
                <div className="stat-card">
                  <h3>{adminData.analytics.length}</h3>
                  <p>Search Terms</p>
                </div>
              </div>

              <div className="admin-content">
                <div className="enquiries-list">
                  <h3>Recent Enquiries</h3>
                  {adminData.enquiries.map(enquiry => (
                    <div key={enquiry.id} className="enquiry-item">
                      <div className="enquiry-header">
                        <strong>{enquiry.user_name}</strong>
                        <span className={`status ${enquiry.status}`}>{enquiry.status}</span>
                      </div>
                      <p><strong>Package:</strong> {enquiry.package_name} - {enquiry.clinic_name}</p>
                      <p><strong>Email:</strong> {enquiry.user_email}</p>
                      {enquiry.phone && <p><strong>Phone:</strong> {enquiry.phone}</p>}
                      <p><strong>Message:</strong> {enquiry.message}</p>
                      <p><strong>Price:</strong> ${enquiry.price}</p>
                      <div className="enquiry-actions">
                        <select 
                          value={enquiry.status} 
                          onChange={(e) => updateEnquiryStatus(enquiry.id, e.target.value)}
                        >
                          <option value="pending">Pending</option>
                          <option value="contacted">Contacted</option>
                          <option value="completed">Completed</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="analytics-list">
                  <h3>Search Analytics</h3>
                  {adminData.analytics.map((item, idx) => (
                    <div key={idx} className="analytics-item">
                      <strong>{item.search_term}</strong>
                      <span>{item.search_count} searches</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {selectedPackage && (
          <div className="enquiry-modal">
            <div className="modal-content">
              <h3>Submit Enquiry</h3>
              <form onSubmit={submitEnquiry}>
                <input
                  type="text"
                  placeholder="Your Name"
                  value={enquiryForm.name}
                  onChange={(e) => setEnquiryForm({...enquiryForm, name: e.target.value})}
                  required
                />
                <input
                  type="email"
                  placeholder="Your Email"
                  value={enquiryForm.email}
                  onChange={(e) => setEnquiryForm({...enquiryForm, email: e.target.value})}
                  required
                />
                <input
                  type="tel"
                  placeholder="Your Phone (Optional)"
                  value={enquiryForm.phone}
                  onChange={(e) => setEnquiryForm({...enquiryForm, phone: e.target.value})}
                />
                <textarea
                  placeholder="Your Message"
                  value={enquiryForm.message}
                  onChange={(e) => setEnquiryForm({...enquiryForm, message: e.target.value})}
                  required
                />
                <div className="modal-buttons">
                  <button type="submit">Submit</button>
                  <button type="button" onClick={() => setSelectedPackage(null)}>Cancel</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {enquiryStatus && (
          <div className="status-message">
            {enquiryStatus}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;