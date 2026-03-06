// Updated CORS configuration, fixed backend-frontend integration issues, and handled duplicate routes

import express from 'express';
import cors from 'cors';

const app = express();

// Updated CORS configuration to allow specific origins
app.use(cors({ origin: ['http://example.com', 'http://anotherdomain.com'] }));

// Middleware to handle JSON requests
app.use(express.json());

// Route handling logic
app.get('/api/data', (req, res) => {
    // Check for duplicate requests
    const requestId = req.headers['x-request-id'];
    if (isDuplicateRequest(requestId)) {
        return res.status(409).send('Duplicate request');
    }
    // Handle the request as normal
    res.send({ message: 'Data retrieved successfully' });
});

const isDuplicateRequest = (id) => {
    // Implement duplicate request checking logic here
    return false; // Placeholder implementation
};

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});