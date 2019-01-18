// Dependencies
var express = require('express');
var	mongoose = require('mongoose');
var bodyParser = require('body-parser');

var config = require('./config');

// Database models
var RestaurantOwner = require('./models/RestaurantOwner');
var Customer = require('./models/Customer');
var Restaurant = require('./models/Restaurant');
var Table = require('./models/Table');
var Booking = require('./models/Booking');

var app = express();

// Middlewares
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));

// Connect database
mongoose.connect(config.mongodb.URL, config.mongodb.option)
.then(function() {
	console.log('\x1b[32m%s\x1b[0m', 'Database Connection Established!');
	app.emit('databaseReady');
})
.catch(function(err) {
	console.log('\x1b[31m%s\x1b[0m', 'Error in Database Connection!');
	console.log(err);
});

// API endpoints
app.use(require('./routes'));

// Catch 404 and forward to error handler
app.use(function(req, res, next) {
	var err = new Error('Not found');
	err.status = 404;
	next(err);
});

// Error handlers
if (config.envName === 'staging') {
	app.use(function(err, req, res, next) {
		console.log(err.stack);

		res.status(err.status || ((err.name == 'ValidationError') ? 400 : 500));
		res.json({
			'errors': {
				message: err.message,
				error: err
			}
		});
	});
} else {
	app.use(function(err, req, res, next) {
		res.status(err.status || (err.name == 'ValidationError') ? 400 : 500);
		res.json({
			'errors': {
				'message': err.message,
				'error':{}
			}
		});
	});
}

// Start the server when database ready
app.on('databaseReady', function() {
	var server = app.listen(config.port, function(err, a) {
		console.log('\x1b[32m%s\x1b[0m', 'Listening on port ' + server.address().port + ' in ' + config.envName + ' mode');
	}).on('error',function(err){
		console.log('\x1b[31m%s\x1b[0m', 'Error occured while creating server');
		console.log(err);
	});
});
