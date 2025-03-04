const express = require('express');
const testRouter = express.Router();

// Route GET đơn giản
testRouter.get('/api/test', (req, res) => {
	res.json({ success: true, message: 'API GET test successful' });
});

// Route POST với body
testRouter.post('/api/test', (req, res) => {
	res.json({
		success: true,
		message: 'API POST test successful',
		receivedData: req.body,
	});
});

// Route GET với query parameters
testRouter.get('/api/search', (req, res) => {
	res.json({
		success: true,
		message: 'Search API test',
		searchParams: req.query,
	});
});

// Route để test các status code khác nhau
testRouter.get('/api/error', (req, res) => {
	res.status(500).json({
		success: false,
		message: 'Error test successful',
	});
});

module.exports = testRouter;
