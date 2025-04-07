//MongoDB
//username : akr2803
//pwd      : rajput?283

// IMPORTS FROM PACKAGES
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');
dotenv.config();
const debugMiddleware = require('./middlewares/debugMiddleware');

// IMPORTS FROM OTHER FILES
const authRouter = require('./routes/auth');
const adminRouter = require('./routes/admin');
const productRouter = require('./routes/product');
const userRouter = require('./routes/user');


const PORT = process.env.PORT || 3000;
const app = express();
// const DB = 'mongodb://localhost:27017/eshop_db'; // local db

// middleware
// CLIENT -> middleware -> SERVER -> CLIENT

app.use(
	cors({
		origin: function(origin, callback) {
			// Allow requests with no origin (like mobile apps or curl requests)
			if (!origin) {
				return callback(null, true);
			}

			// Allow specific origins
			const allowedOrigins = [
				'http://localhost:53492', // Dev web
				'http://localhost:3000', // Thêm các origin khác nếu cần
				// Thêm domain production của bạn khi deploy
			];

			if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
				callback(null, true);
			} else {
				callback(new Error('Not allowed by CORS'));
			}
		},
		credentials: true, // Bật credentials
		methods: ['GET', 'POST', 'PUT', 'DELETE'],
		allowedHeaders: [
			'Content-Type',
			'Authorization',
			'Accept',
			'x-auth-token',
			'credentials',
		],
	}),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(debugMiddleware);

app.use('/api/auth', authRouter);
app.use('/api/admin', adminRouter);
app.use('/api/products', productRouter);
app.use('/api/users', userRouter);
// app.use('/api/cart', cartRouter);
// app.use('/api/orders', orderRouter);
// Connecting DB
mongoose
	.connect(`${process.env.MONGODB_URI}`, {
		useNewUrlParser: true,
		useUnifiedTopology: true,
	})
	.then(conn => {
		console.log(`MongoDB Connected: ${conn.connection.host}`);
	})
	.catch(error => {
		console.error(`Error connecting to MongoDB: ${error.message}`);
		console.log(`${process.env.MONGODB_URI}`);
		
	});

app.get('/', (req, res) => {
	res.send('Hello World');
});
//CREATING AN API
app.listen(PORT, '0.0.0.0', () => {
	console.log(`Listening at PORT ${PORT}`);
});

// GET, PUT, POST, DELETE, UPDATE -> CRUD
