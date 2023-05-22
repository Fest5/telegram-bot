const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3000;

// Helmet middleware for enhancing security
app.use(helmet());

// Enable Cross-Origin Resource Sharing (CORS)
app.use(cors());

// Rate limiting to protect against brute force and DoS attacks
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
});
//app.use(limiter);

// Body parser middleware for handling JSON and URL-encoded data
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// Example route to demonstrate secure API endpoint
app.get('/api/secure', (req, res) => {
  res.json({ message: 'This is a secure API endpoint.' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Internal Server Error');
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
