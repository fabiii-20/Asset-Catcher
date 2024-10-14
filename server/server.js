const express = require('express');
const cors = require('cors'); // Add CORS support
const cdnRoutes = require('./routes/cdnRoutes');

const app = express();

// Middleware
app.use(express.json()); // Parse JSON request bodies
// Use CORS middleware
app.use(cors({
    origin: 'http://localhost:5173', // Allow requests from the Vite frontend
  }));

// Routes
app.use('/api', cdnRoutes);


// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
