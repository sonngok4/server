const mongoose = require('mongoose');

const ConnectDB = () => {
	mongoose
		.connect(
			'mongodb+srv://akr2803:123@ecommerceapplication.ibqdbpv.mongodb.net/?retryWrites=true&w=majority',
		)
		.then(conn => {
			console.log(`MongoDB Connected: ${conn.connection.host}`);
		})
		.catch(error => {
			console.error(`Error connecting to MongoDB: ${error.message}`);
		});
};

module.exports = ConnectDB;

//mongodb+srv://ngoson2k40501:JBsvT5bMBwvqDBU@cluster0.tu8h4.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
