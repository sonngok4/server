const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');
dotenv.config();
const debugMiddleware = require('./middlewares/debugMiddleware');


const connectDB = require('./configs/database');

const PORT = process.env.PORT || 3000;
const app = express();

// Connecting DB
connectDB();

// middlewares
app.use(
	cors({
		origin: function (origin, callback) {
			// Allow requests with no origin (like mobile apps or curl)
			if (!origin) {
				return callback(null, true);
			}

			// Allow localhost and Render frontend
			const allowedOrigins = [
				/^http:\/\/localhost:\d+$/, // any localhost with port
				'https://eshop-o8nb.onrender.com', // your frontend domain on Render
				'https://eshop-admin-ld6m.onrender.com'
			];

			const isAllowed = allowedOrigins.some((allowed) =>
				allowed instanceof RegExp ? allowed.test(origin) : allowed === origin
			);

			if (isAllowed) {
				callback(null, true);
			} else {
				callback(new Error('Not allowed by CORS'));
			}
		},
		credentials: true,
		methods: ['GET', 'POST', 'PUT', 'DELETE'],
		allowedHeaders: [
			'Content-Type',
			'Authorization',
			'Accept',
			'x-auth-token',
			'credentials',
		],
	})
);

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.use(cookieParser());
app.use(debugMiddleware);

// IMPORTS FROM OTHER FILES
const authRouter = require('./routes/auth');
const adminRouter = require('./routes/admin');
const productRouter = require('./routes/product');
const userRouter = require('./routes/user');
const uploadRouter = require('./routes/upload');
const ratingRoutes = require('./routes/rating');
const categoryRoutes = require('./routes/category');

// ROUTES
// Public routes
app.use('/api/auth', authRouter);
app.use('/api/products', productRouter);
app.use('/api/categories', categoryRoutes);

// Protected routes
app.use('/api/users', userRouter);
app.use('/api/upload', uploadRouter);
app.use('/api/ratings', ratingRoutes);

// Admin routes (protected)
app.use('/api/admin', adminRouter);

app.get('/', (req, res) => {
	res.send('Hello World');
});

//CREATING AN API
app.listen(PORT, '0.0.0.0', () => {
	console.log(`Listening at PORT ${PORT}`);
});
