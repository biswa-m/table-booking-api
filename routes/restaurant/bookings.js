var mongoose = require('mongoose');
var router = require('express').Router();

var auth = require('../../helpers/auth');
var throwError = require('../../helpers/throwError');

var Restaurant = mongoose.model('Restaurant');
var Customer = mongoose.model('Customer');
var Booking = mongoose.model('Booking');

/* Get bookings of a restaurant
 * permission - restaurant owner
 * required data - Authentication token
 * optional data on query string
 * - phone, email, customerId, bookingStatus, table, before, after
 * - skip (type: int, skip n results), limit(type: int, show only n rusult)
 * - sortby (type: array of array, ex: [['bookingFrom', -1], ['bookingStatus', 1]])
 */
router.get('/:restaurantId', auth.required, function(req, res, next) {
	// if regEx of params do not match procceed to next function
	var regExObjectId = /^[a-f\d]{24}$/i;
	if (!regExObjectId.test(req.params.restaurantId)) return next();

	// Authorize if user is the admin of the restaurant
	Restaurant.findOne({
		_id: req.params.restaurantId,
		admin: req.user.id
	}).then(async function(restaurant) {
		if (!restaurant) throwError.unauthorized();

		// Initialize object for database query
		var query = {restaurant: req.params.restaurantId};

		// Check optional parameters to apply search filter
		// if customer id present donot look for email and phone
		// else if email and/or phone is present obtain customer id from email and/or phone
		if (req.query.customerId) {
			query.customer = req.query.customerId;
		} else if (req.query.phone || req.query.email) {
			let customerQuery = {};

			if (req.query.phone) customerQuery.phone = req.query.phone;
			if (req.query.email) customerQuery.email = req.query.email;

			await Customer.findOne(customerQuery).then(function(customer) {
				if (!customer) query.customer = null;
				else query.customer = customer._id;
			}).catch(next);
		}

		// filter alloted table if table id is present
		if (req.query.table) {
			if (!regExObjectId.test(req.query.table))
				throwError.validationError('Invalid table id');
			query.tables = req.query.table;
		}

		// Filter booking status
		if (req.query.bookingStatus)
			query.bookingStatus = req.query.bookingStatus;

		// Filter booking time
		if (req.query.before) {
			query.bookingFrom = {};
			query.bookingFrom.$lt = req.query.before;
		}
		if (req.query.after) {
			query.bookingFrom = query.bookingFrom ? query.bookingFrom : {};
			query.bookingFrom.$gt = req.query.after;
		}

		// Initialize object for database query options
		var option = {};

		// Starting row
		option.skip = (parseInt(req.query.skip)) ? parseInt(req.query.skip) : 0;

		// No of rows
		option.limit = (parseInt(req.query.limit)) ? parseInt(req.query.limit) : 25;

		// Default sort
		let sort = [];

		// Validate userdata for sorting
		if (typeof(req.query.sortby) == 'object' && req.query.sortby instanceof Array) {
			req.query.sortby.forEach(function(pair) {
				if (typeof(pair) == 'object' && pair instanceof Array) {

					pair[0] = (typeof(pair[0]) == 'string'
							&& ['bookingFrom', 'bookingStatus', 'noOfPersons']
							.indexOf(pair[0]) != -1)
						? pair[0]
						: false;

					pair[1] = pair[1] == -1 ? -1 : 1;

					// If valid key value pair
					if (pair[0]) {
						sort.push(pair);
					}
				}
			});
		}

		// If no valid argument for sorting, assign default
		sort = sort.length ? sort : [['bookingFrom', 1]];

		console.log(query)
		console.log(option)
		console.log(sort)

		Booking.find(query, null, option)
		.sort(sort)
		.populate('tables', 'tableIdentifier')
		.then(function(bookings) {
			Booking.countDocuments(query).then(function(count) {
				console.log(count);
				res.json({bookings: bookings, count: count});
			}).catch(next);
		}).catch(next);
	}).catch(next);
});

module.exports = router;
