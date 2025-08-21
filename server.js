const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'client/build')));

// Database setup
const db = new sqlite3.Database(':memory:');

// Initialize database with tables and seed data
db.serialize(() => {
  // Create tables
  db.run(`CREATE TABLE concerns (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL
  )`);

  db.run(`CREATE TABLE treatments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL
  )`);

  db.run(`CREATE TABLE concern_treatments (
    concern_id INTEGER,
    treatment_id INTEGER,
    FOREIGN KEY (concern_id) REFERENCES concerns(id),
    FOREIGN KEY (treatment_id) REFERENCES treatments(id)
  )`);

  db.run(`CREATE TABLE packages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    clinic_name TEXT NOT NULL,
    package_name TEXT NOT NULL,
    treatment_id INTEGER,
    price REAL NOT NULL,
    FOREIGN KEY (treatment_id) REFERENCES treatments(id)
  )`);

  db.run(`CREATE TABLE enquiries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    package_id INTEGER,
    user_name TEXT NOT NULL,
    user_email TEXT NOT NULL,
    message TEXT NOT NULL,
    phone TEXT,
    status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (package_id) REFERENCES packages(id)
  )`);

  db.run(`CREATE TABLE search_analytics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    search_term TEXT NOT NULL,
    results_count INTEGER,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Seed data
  const concerns = ['acne scars', 'dark circles', 'double chin'];
  const treatments = ['Microneedling', 'Chemical Peel', 'Laser Resurfacing', 'Under-eye Filler', 'PRP Under-eye', 'HIFU', 'Kybella'];

  concerns.forEach(concern => {
    db.run("INSERT INTO concerns (name) VALUES (?)", [concern]);
  });

  treatments.forEach(treatment => {
    db.run("INSERT INTO treatments (name) VALUES (?)", [treatment]);
  });

  // Map concerns to treatments
  const concernTreatmentMap = [
    [1, 1], [1, 2], [1, 3], // acne scars -> Microneedling, Chemical Peel, Laser Resurfacing
    [2, 4], [2, 5], // dark circles -> Under-eye Filler, PRP Under-eye
    [3, 6], [3, 7]  // double chin -> HIFU, Kybella
  ];

  concernTreatmentMap.forEach(([concernId, treatmentId]) => {
    db.run("INSERT INTO concern_treatments (concern_id, treatment_id) VALUES (?, ?)", [concernId, treatmentId]);
  });

  // Sample packages
  const packages = [
    ['SkinCare Clinic', 'Advanced Microneedling Package', 1, 299.99],
    ['Beauty Center', 'Chemical Peel Special', 2, 199.99],
    ['Laser Clinic', 'Laser Resurfacing Premium', 3, 599.99],
    ['Eye Care Spa', 'Under-eye Filler Treatment', 4, 449.99],
    ['Rejuvenation Center', 'PRP Under-eye Therapy', 5, 349.99],
    ['Body Sculpt Clinic', 'HIFU Double Chin Treatment', 6, 799.99],
    ['Aesthetic Center', 'Kybella Injection Package', 7, 899.99],
    ['Premium Skin Clinic', 'Deluxe Microneedling', 1, 399.99]
  ];

  packages.forEach(pkg => {
    db.run("INSERT INTO packages (clinic_name, package_name, treatment_id, price) VALUES (?, ?, ?, ?)", pkg);
  });
});

// API Routes
const apiPrefix = process.env.NODE_ENV === 'production' ? '/api' : '';

// GET /search/suggestions -> returns search suggestions
app.get('/search/suggestions', (req, res) => {
  db.all("SELECT name FROM concerns ORDER BY name", (err, concerns) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(concerns.map(c => c.name));
  });
});

// GET /search/concern=<text> -> returns concern, matched treatments, and packages
app.get('/search/concern=:concernText', (req, res) => {
  const concernText = req.params.concernText.toLowerCase();
  
  db.get("SELECT * FROM concerns WHERE LOWER(name) LIKE ?", [`%${concernText}%`], (err, concern) => {
    if (err) return res.status(500).json({ error: err.message });
    
    // Log search analytics
    const resultsCount = concern ? 1 : 0;
    db.run("INSERT INTO search_analytics (search_term, results_count) VALUES (?, ?)", [concernText, resultsCount]);
    
    if (!concern) return res.json({ concern: null, treatments: [], packages: [] });

    db.all(`
      SELECT t.* FROM treatments t
      JOIN concern_treatments ct ON t.id = ct.treatment_id
      WHERE ct.concern_id = ?
    `, [concern.id], (err, treatments) => {
      if (err) return res.status(500).json({ error: err.message });

      const treatmentIds = treatments.map(t => t.id);
      if (treatmentIds.length === 0) {
        return res.json({ concern, treatments: [], packages: [] });
      }

      const placeholders = treatmentIds.map(() => '?').join(',');
      db.all(`
        SELECT p.*, t.name as treatment_name FROM packages p
        JOIN treatments t ON p.treatment_id = t.id
        WHERE p.treatment_id IN (${placeholders})
        ORDER BY p.price ASC
      `, treatmentIds, (err, packages) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ concern, treatments, packages });
      });
    });
  });
});

// POST /enquiries -> saves enquiry
app.post('/enquiries', (req, res) => {
  const { package_id, user_name, user_email, message, phone } = req.body;
  
  if (!package_id || !user_name || !user_email || !message) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(user_email)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }

  db.run(
    "INSERT INTO enquiries (package_id, user_name, user_email, message, phone) VALUES (?, ?, ?, ?, ?)",
    [package_id, user_name, user_email, message, phone],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      
      // Send confirmation email (simulated)
      console.log(`📧 Email sent to ${user_email}: Thank you for your enquiry!`);
      
      res.json({ id: this.lastID, message: 'Enquiry submitted successfully! Confirmation email sent.' });
    }
  );
});

// GET /admin/enquiries -> list all enquiries (bonus)
app.get('/admin/enquiries', (req, res) => {
  db.all(`
    SELECT e.*, p.package_name, p.clinic_name, p.price
    FROM enquiries e
    JOIN packages p ON e.package_id = p.id
    ORDER BY e.created_at DESC
  `, (err, enquiries) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(enquiries);
  });
});

// GET /admin/analytics -> search analytics dashboard
app.get('/admin/analytics', (req, res) => {
  db.all(`
    SELECT search_term, COUNT(*) as search_count, 
           AVG(results_count) as avg_results,
           DATE(timestamp) as date
    FROM search_analytics 
    GROUP BY search_term, DATE(timestamp)
    ORDER BY search_count DESC
    LIMIT 20
  `, (err, analytics) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(analytics);
  });
});

// PUT /admin/enquiries/:id -> update enquiry status
app.put('/admin/enquiries/:id', (req, res) => {
  const { status } = req.body;
  const enquiryId = req.params.id;
  
  db.run(
    "UPDATE enquiries SET status = ? WHERE id = ?",
    [status, enquiryId],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'Status updated successfully' });
    }
  );
});

// GET /packages/popular -> most enquired packages
app.get('/packages/popular', (req, res) => {
  db.all(`
    SELECT p.*, COUNT(e.id) as enquiry_count, t.name as treatment_name
    FROM packages p
    LEFT JOIN enquiries e ON p.id = e.package_id
    JOIN treatments t ON p.treatment_id = t.id
    GROUP BY p.id
    ORDER BY enquiry_count DESC, p.price ASC
    LIMIT 6
  `, (err, packages) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(packages);
  });
});

// Serve React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});