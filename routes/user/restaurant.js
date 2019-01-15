var mongoose = require('mongoose');
var router = require('express').Router();

var auth = require('../../helpers/auth');

var RestaurantOwner = mongoose.model('RestaurantOwner');
var Restaurant = mongoose.model('Restaurant');
var Customer = mongoose.model('Customer');
var Booking = mongoose.model('Booking');

/*
 * Restaurant owner login
 * required data: email, password
 */
router.post('/restaurant/login', function(req, res, next) {
	if (!req.body.user) {
		return res.sendStatus(400);
	}
	if (!req.body.user.email) {
	    return res.status(422).json({errors: {email: "can't be blank"}});
	}
	if (!req.body.user.password) {
	    return res.status(422).json({errors: {password: "can't be blank"}});
	}

	RestaurantOwner.findOne({'email': req.body.user.email}).then(function(user) {
		if (!user) return res.status(401).json({errors: 'Wrong email or password'});
		if (!user.validPassword(req.body.user.password)) {
			return res.status(401).json({errors: 'Wrong email or password'});
		};
		
		return res.json({user: user.toAuthJSON()});
	}).catch(next);
});

/*
 * Read customer data by phone no
 * permission: restaurant owner, if the customer(s) have booking in his/her restaurant(s)
 * required data: Authentication token
 */
router.get('/:phone', auth.required, function(req, res, next) {
	// if the params is not a phone no procceed to next function
	var regExPhone = /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/im;
	if (!regExPhone.test(req.params.phone)) return next();

	// Authorize if user is an admin of restaurant(s)
	Restaurant.find({admin: req.user.id}).then(function(restaurants) {
		if (!restaurants.length) return res.sendStatus(401);

		// Find customer using phone no provided
		Customer.find({phone: req.params.phone}).then(function(customers) {
			if (!customers.length) return res.sendStatus(401);

			// Find the customer(s) with booking(s) in the restaurant(s) of the user
			Booking.find({
				restaurant: {$in: restaurants.map(a => a._id)},
				customer: {$in: customers.map(a => a._id)}
			}).then(function(bookings) {
				if (!bookings.length) return res.sendStatus(401);

				// The var 'customers' contains all the customer with matched phone no
				// Respond only those customer details whose has booking in the restaurant(s)
				let customerDetails = [];

				let bookingCustomerIds = bookings.map(a => JSON.stringify(a.customer));

				customers.forEach(function(customer) {
					if (bookingCustomerIds.indexOf(JSON.stringify(customer._id)) >= 0) {
						customerDetails.push(customer.getUserJSON());
					}
				});

				return res.json({customers: customerDetails})
			}).catch(next);
		}).catch(next);
	}).catch(next);
});

module.exports = router;
