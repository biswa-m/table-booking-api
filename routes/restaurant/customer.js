var mongoose = require('mongoose');
var router = require('express').Router();

var auth = require('../../helpers/auth');

var Customer = mongoose.model('Customer');
var Booking = mongoose.model('Booking');
var Restaurant = mongoose.model('Restaurant');

/*
 * Read customer data by customer id / email / phone no
 * permission: restaurant owner, if the customer(s) have booking in his/her restaurant(s)
 * required data: Authentication token
 * optional data on query string: id, email, phone (Atleast one is required)
 */
router.get('/:restaurantId/customer', auth.required, function(req, res, next) {
	// if regEx of params do not match procceed to next function
	var regExObjectId = /^[a-f\d]{24}$/i;
	if (!regExObjectId.test(req.params.restaurantId)) return next();

	// Authorize if user is the admin of the restaurant
	Restaurant.findOne({
		_id: req.params.restaurantId,
		admin: req.user.id
	}).then(function(restaurant) {
		if (!restaurant) return res.sendStatus(401);

		// Create the database query object depending upon parameter passed
		let query = {};
		if (req.query.phone) query.phone = req.query.phone;
		if (req.query.email) query.email = req.query.email;
		if (req.query.id) query._id = req.query.id;

		if (!Object.keys(query).length) return res.sendStatus(400);

		// Find customer using phone no provided
		Customer.findOne(query).then(function(customer) {
			if (!customer) return res.sendStatus(404);

			// Authorize only if the customer has booking in that restaurant
			Booking.find({
				restaurant: req.params.restaurantId,
				customer: customer._id
			}).then(function(bookings) {
				if (!bookings.length) return res.sendStatus(401);

				return res.json({customer: customer.getUserJSON()})
			}).catch(next);
		}).catch(next);
	}).catch(next);
});

module.exports = router;
