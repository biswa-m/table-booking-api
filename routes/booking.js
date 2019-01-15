var mongoose = require('mongoose');
var router = require('express').Router();

var auth = require('../helpers/auth');

var Booking = mongoose.model('Booking');
var Customer = mongoose.model('Customer');

router.post('/', auth.required, function(req, res, next) {
	Customer.findById(req.user.id).then(function(customer) {
		if (!customer) return res.sendStatus(401);

		if (!req.body.booking) return res.sendStatus(400);

		var booking = new Booking;
		booking.customer = req.user.id;
		booking.restaurant = req.body.booking.restaurant;
		booking.tables = req.body.booking.tables;
		booking.noOfPersons = req.body.booking.noOfPersons;
		booking.bookingFrom = req.body.booking.bookingFrom;
		booking.bookingTo = req.body.booking.bookingTo;

		booking.save().then(function() {
			console.log('Database Updated');
			return res.json({booking: booking.toUserJSON});
		}).catch(next);
	}).catch(next);
});

module.exports = router;
