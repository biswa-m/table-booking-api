var mongoose = require('mongoose');

var helpers = require('../helpers/utility');

var Table = mongoose.model('Table');
var Restaurant = mongoose.model('Restaurant');
var getDay = helpers.time.getDay;
var getTime = helpers.time.get;

// Instantiate object to export
var bookingValidator = {};

bookingValidator.businessHours = function(data) {
	var bookingDay = getDay(data.bookingFrom);


	return new Promise(function(resolve, reject) {
		// Check businessHours of the restaurant
		Restaurant.findById(data.restaurant).then(function(restaurant) {

			console.log('Business hours for the day: ', restaurant.businessHours[bookingDay], '\nBooking requested at: ', getTime(data.bookingFrom));
			console.log('Too early to book: ', restaurant.businessHours[bookingDay].start
						> getTime(data.bookingFrom));
			console.log('Too late to book: ', restaurant.businessHours[bookingDay].end
						< getTime(data.bookingFrom));

			if (
				!restaurant
				|| typeof(restaurant.businessHours[bookingDay].start)
						=== 'undefined'
				|| typeof(restaurant.businessHours[bookingDay].end)
						=== 'undefined'
				|| restaurant.businessHours[bookingDay].start
						> getTime(data.bookingFrom)
				|| restaurant.businessHours[bookingDay].end
						< getTime(data.bookingFrom)
			) resolve(false);

			resolve(true);
		}).catch(function(err) {
			console.log('Catched Error: ', err);
			resolve(false);
		});
	});
};

module.exports = bookingValidator;
