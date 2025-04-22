const jwt = require('jsonwebtoken');
const User = require('../models/user');
const dotenv = require('dotenv');
dotenv.config();

const admin = async (req, res, next) => {
	try {
		const authHeader = req.headers.authorization;
		const token = authHeader && authHeader.split(' ')[1];
		if (!token) {
			return res.status(401).json({ msg: 'No auth token, access denied' });
		}
		const verified = jwt.verify(token, process.env.JWT_SECRET);
		if (!verified) {
			return res.status(401).json({
				msg: 'Token verification failed, authorization denied.',
			});
		}
		
		const decoded = jwt.decode(token);
		const id = decoded.userId;
		console.log(`id: ${id}`);
		

		const user = await User.findById(id);
		console.log(`user role: ${user}`);
		

		if (user.role == 'user' || user.role == 'seller') {
			return res.status(401).json({
				msg: 'Unauthorized access, you might not be an admin',
			});
		}

		req.user = verified.id;
		req.token = token;
		next();
	} catch (e) {
		return res.status(500).json({ error: e.message });
	}
};

module.exports = admin;
