require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config();

// Import routes
const n8nQuoteRoutes = require('./routes/n8nQuoteRoutes');
const authRoutes = require('./routes/auth');
const jobRoutes = require('./routes/jobRoutes');
const parseProjectDocRoutes = require('./routes/parseprojectdoc');
const aiRoutes = require('./routes/aiRoutes');
const adminRoutes = require('./routes/adminRoutes'); // Add this line
const estimateRoutes = require('./routes/estimateRoutes'); // Add this line
const integrationRoutes = require('./routes/integrationRoutes');

// Initialize app
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '5mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '5mb' }));

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, '../frontend/public')));

// API Routes
app.use('/api/n8n-quote', n8nQuoteRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/parse-project-doc', parseProjectDocRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/admin', adminRoutes); // Add this line
app.use('/api/estimates', estimateRoutes); // Add this line
app.use('/api/integrations', integrationRoutes);

// Serve individual n8n quote results
app.get('/n8n-quote-result/:id', async (req, res) => {
  try {
    const { id } = req.params;
    // Serve the same n8n-quote.html file but with the result ID
    // The frontend JavaScript can then fetch the specific chat data
    res.sendFile(path.join(__dirname, '../frontend/public/n8n-quote.html'));
  } catch (error) {
    console.error('Error serving n8n quote result:', error);
    res.status(404).send('Quote result not found');
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Server is running' });
});

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/intakeai')
  .then(() => {
    console.log('Connected to MongoDB');

    // Start server
    app.listen(PORT, '0.0.0.0', () => { // Changed from default binding to explicit 0.0.0.0
      console.log(`Server running on port ${PORT}`);
      // Removed the redundant standalone endpoint message
    });
  })
  .catch((error) => {
    console.error('MongoDB connection error:', error);
  });