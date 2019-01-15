var mongoose = require('mongoose');

var helpers = require('../helpers/utility');

var Table = mongoose.model('Table');
var Restaurant = mongoose.model('Restaurant');
var getDay = helpers.time.getDay;
var getTime = helpers.time.get;

// Instantiate object to export
var bookingValidator = {};

// Function to validate no of persons during schema building
bookingValidator.noOfPersons = function(value, respond) {
	if (!value) respond(false, 'There must be atleast one person');

	var tableIds = this.tables;
	var restaurant = this.restaurant;

	// Go through each table of tables array
	Table.find({'_id': {$in: this.tables}})
	.then(function(tables) {
		// check provided table ids are valid
		if (tables.length !== tableIds.length)
			respond(false, 'validation fail, invalid table');

		// Iterate throgh table array to calculate total capacity
		var totalCapacity = 0;
		tables.forEach(function(table) {
			if (JSON.stringify(restaurant) !== JSON.stringify(table.restaurant))
				respond(false, 'validation fail, invalid table or restaurant');

			totalCapacity += table.capacity;
		});
		if (value > totalCapacity) respond(false);

		respond(true);
	}).catch(function(err){
		console.log(err);
		respond(false, 'validation fail');
	});
};

// function to validate restaurat during schema building
bookingValidator.restaurant =  function(value, respond) {
	Restaurant.findById(value).then(function(restaurant) {
		if (!restaurant) respond(false);

		respond(true);
	}).catch(function(err){
		console.log(err);
		respond(false);
	});
};

bookingValidator.bookingTime = function() {
	var data = this;
	return new Promise(async function(resolve, reject) {
		// should be greater then current time - possible processing time offset
		// maximum booking period 24 hr = 86400000 mSec
		// minimum booking period 0.5 hr = 1800000 mSec
		if (
			data.bookingFrom.getTime() < (Date.now() - 60000) // offset = 1 min
			|| data.bookingTo.getTime() < data.bookingFrom.getTime() + 1800000
			|| data.bookingTo.getTime() > data.bookingFrom.getTime() + 86400000
		) resolve(false);

		console.log('Bookings times are well formated');

		if (!(await bookingValidator.businessHours(data))) {
			console.log('Restaurant will be closed');
			resolve(false, 'Restaurant will be closed');
		};

		resolve(true);
	});
};

bookingValidator.businessHours = function(data) {
	var dayFrom = getDay(data.bookingFrom);
	var dayTo = getDay(data.bookingTo);

	return new Promise(function(resolve, reject) {
		// Check businessHoures of the restaurant
		Restaurant.findById(data.restaurant).then(function(restaurant) {

			console.log(!restaurant);
			console.log(typeof(restaurant.businessHours[dayFrom].start)
				=== 'undefined');
			console.log(typeof(restaurant.businessHours[dayFrom].end)
				=== 'undefined');
			console.log(restaurant.businessHours[dayFrom].start
				> getTime(data.bookingFrom));
			console.log(restaurant.businessHours[dayTo].end
				< getTime(data.bookingTo));
			console.log(
				(dayFrom != dayTo) // midnight booking
				&& (restaurant.businessHours[dayFrom].end != 2400)
				&& (restaurant.businessHours[dayTo].end != 0000)
			);

			if (
				!restaurant
				|| typeof(restaurant.businessHours[dayFrom].start)
						=== 'undefined'
				|| typeof(restaurant.businessHours[dayFrom].end)
						=== 'undefined'
				|| restaurant.businessHours[dayFrom].start
						> getTime(data.bookingFrom)
				|| restaurant.businessHours[dayTo].end
						< getTime(data.bookingTo)
				|| (
					(dayFrom != dayTo) // midnight booking
					&& (restaurant.businessHours[dayFrom].end != 2400)
					&& (restaurant.businessHours[dayTo].end != 0000)
				)
			) resolve(false);

			resolve(true);
		}).catch(function(err) {
			console.log('Catched Error: ', err);
			resolve(false);
		});
	});
};

module.exports = bookingValidator;
