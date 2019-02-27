var mongoose = require('mongoose');

var Table = mongoose.model('Table');
var Booking = mongoose.model('Booking');
var Restaurant = mongoose.model('Restaurant');

var config = require('../../config');
var utility = require('../utility');

// Check availability of a table at one instance
var checkAvailability = function(tableId, restaurant, date, next) {
	console.log('Checking the availability of table ', tableId);
	return new Promise(async function(resolve,reject){
		// Find the restaurant is open or close at that time
		await Restaurant.findById(restaurant, 'businessHours')
		.then(function(data) {
			let businessHours = (data.businessHours[utility.time.getDay(date)]);
			let time = utility.time.get(date);

			if (time < businessHours.start || time > businessHours.end) {
				// Restaurant is closed, hence table unavailable
				console.log('Restaurant close');
				resolve(false);
			} else {
				// Restaurant is open
				// Search bookings for occupied tables
				Booking.find({
					restaurant: restaurant,
					bookingFrom: {
						$gt: date - config.defaultBookingDuration,
						$lt: date + config.defaultBookingDuration
					}
				}, 'tables')
				.then(function(bookings) {
					if (bookings.map(x => JSON.parse(JSON.stringify(x.tables[0]))).includes(tableId))
						resolve(false);
					else
						resolve(true);
				}).catch(next);

			}
		}).catch(next);
	});
}

module.exports = checkAvailability;
