// debugMiddleware.js

const debugMiddleware = (req, res, next) => {
	// Log request thông tin
	console.log('Request Method:', req.method);
	console.log('Request URL:', req.url);
	console.log('Request Headers:', req.headers);

	// Log body (nếu có)
	if (req.body && Object.keys(req.body).length > 0) {
		console.log('Request Body:', req.body);
	}

	// Log query parameters (nếu có)
	if (Object.keys(req.query).length > 0) {
		console.log('Request Query:', req.query);
	}

	// Ghi lại thời gian bắt đầu xử lý request
	const start = Date.now();

	// Intercepting response để log sau khi response được gửi
	const oldSend = res.send;
	res.send = function(data) {
		// Log response status và thời gian xử lý
		console.log('Response Status:', res.statusCode);
		console.log('Response Time:', Date.now() - start, 'ms');

		// Log nội dung của response nếu cần
		console.log('Response Body:', data);

		// Gọi lại phương thức send() ban đầu để trả về response
		oldSend.apply(res, arguments);
	};

	// Tiếp tục xử lý request
	next();
};

module.exports = debugMiddleware;
