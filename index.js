//MongoDB
//username : akr2803
//pwd      : rajput?283

// IMPORTS FROM PACKAGES
const express = require('express');
const mongoose = require('mongoose');

// IMPORTS FROM OTHER FILES
const authRouter = require('./routes/auth');
const adminRouter = require('./routes/admin');
const productRouter = require('./routes/product');
const userRouter = require('./routes/user');
const debugMiddleware = require('./middlewares/debugMiddleware');
const ConnectDB = require('./configs/database');
const testRouter = require('./routes/test');

const PORT = process.env.PORT || 3000;
const app = express();
// const DB =
//     "mongodb+srv://akr2803:123@ecommerceapplication.ibqdbpv.mongodb.net/?retryWrites=true&w=majority";
// const DB =
//     "mongodb://akr2803:123@ac-ieqge19-shard-00-00.ibqdbpv.mongodb.net:27017,ac-ieqge19-shard-00-01.ibqdbpv.mongodb.net:27017,ac-ieqge19-shard-00-02.ibqdbpv.mongodb.net:27017/?ssl=true&replicaSet=atlas-d74wfg-shard-0&authSource=admin&retryWrites=true&w=majority";
const DB =
	'mongodb+srv://ngoson2k40501:JBsvT5bMBwvqDBU@cluster0.tu8h4.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
// middleware
// CLIENT -> middleware -> SERVER -> CLIENT
app.use(
	cors({
		origin: '*', // For development. In production, specify domains
		methods: ['GET', 'POST'],
		allowedHeaders: ['Content-Type', 'Accept', 'x-auth-token'],
	}),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(debugMiddleware);

// routing
app.use(testRouter);
app.use(authRouter);
app.use(adminRouter);
app.use(productRouter);
app.use(userRouter);

// Connecting DB
// mongoose
// 	.connect(DB)
// 	.then(() => {
// 		console.log('DB Connected Successfully');
// 	})
// 	.catch(e => console.log(e));
ConnectDB();

//CREATING AN API
app.listen(PORT, '0.0.0.0', () => {
	console.log(`Listening at PORT ${PORT}`);
});

// GET, PUT, POST, DELETE, UPDATE -> CRUD
