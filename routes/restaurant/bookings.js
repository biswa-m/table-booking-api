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
 * - phone, email, customerId, bookingStatus, before, after
 * TODO - sortBy, pageNo
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

		var query = {restaurant: req.params.restaurantId};

		// Check optional parameters to apply search filter

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

		Booking.find(query)
		.populate('tables', 'tableIdentifier')
		.then(function(bookings) {
			res.json({bookings: bookings});
		}).catch(next);
	}).catch(next);
});

module.exports = router;
