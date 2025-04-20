const express = require('express');
const jwt = require('jsonwebtoken');
const authRouter = express.Router();
const bcryptjs = require('bcryptjs');
const User = require('../models/user');
const { validateSignupData, validateLoginData } = require('../validators/authValidator');
const { sendSuccess, sendError } = require('../utils/responseUtils');
require('dotenv').config();

//SignUp route
authRouter.post('/register', async (req, res) => {

	try {
		const { name, email, password } = req.body;
		const validationResult = validateSignupData(email, password, name);
		if (!validationResult.isValid) {
			return sendError(res, validationResult.message, 400);
		}

		const existingUser = await User.findOne({ email });

		if (existingUser) {
			return res
				.status(400)
				.json({ msg: 'User with same email already exists' });
		}

		const hashedPassWord = await bcryptjs.hash(password, 10);

		const user = new User({
			name,
			email,
			password: hashedPassWord,
		});

		await user.save();
		return sendSuccess(res, { user: { id: user._id, email, name } }, 'User registered successfully', 201);
	} catch (e) {
		return sendError(res, { error: `Error in registering user : ${e.message}` }, 500);
	}
});

//SignIn route
authRouter.post('/login', async (req, res) => {
	try {
		const { email, password } = req.body;

		const validationResult = validateLoginData(email, password);
		if (!validationResult.isValid) {
			return sendError(res, validationResult.message, 400);
		}

		const user = await User.findOne({ email });

		if (!user) {
			return sendError(res, 'Invalid credentials! User not found!', 400);
		}

		const isMatch = await bcryptjs.compare(password, user.password);
		if (!isMatch) {
			return sendError(res, 'Invalid credentials', 400);
		}

		const accessToken = jwt.sign(
			{ userId: user._id, email: user.email },
			process.env.JWT_SECRET,
			{ expiresIn: '1h' }
		);

		const refreshToken = jwt.sign(
			{ userId: user._id, email: user.email },
			process.env.JWT_SECRET,
			{ expiresIn: '7d' }
		);

		return sendSuccess(
			res,
			{ accessToken, refreshToken, user },
			'Đăng nhập thành công'
		);
	} catch (e) {
		return sendError(res, { error: `Error in logging in user : ${e.message}` }, 500);
	}
});

module.exports = authRouter;
