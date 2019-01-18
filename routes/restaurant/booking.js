var mongoose = require('mongoose');
var router = require('express').Router();

var auth = require('../../helpers/auth');
var throwError = require('../../helpers/throwError');

var Restaurant = mongoose.model('Restaurant');
var Customer = mongoose.model('Customer');
var Booking = mongoose.model('Booking');

/* 
 * Get booking by booking id
 * permission - restaurant owner
 * required data - Authentication token
 */ 
router.get('/:restaurantId/:bookingId', auth.required, function(req, res, next) {
	// if regEx of params do not match procceed to next function
	var regExObjectId = /^[a-f\d]{24}$/i;
	if (!regExObjectId.test(req.params.restaurantId)) return next();
	if (!regExObjectId.test(req.params.bookingId)) return next();

	// Authorize if user is the admin of the restaurant
	Restaurant.findOne({
		_id: req.params.restaurantId,
		admin: req.user.id
	}).then(function(restaurant) {
		if (!restaurant) res.sendStatus(401);

		Booking.findById(req.params.bookingId).then(function(booking) {
			// Unauthorize if the booking restaurant is different
			if (!booking || booking.restaurant != req.params.restaurantId)
				return res.sendStatus(401);

			return res.json({booking: booking.toAuthUserJSON()});
		}).catch(next);
	}).catch(next);
});

/*
 * Change booking status - confirm booking/ cancel booking
 * permission - restaurant owner
 * required data - Authentication token, bookingStatus
 */
router.put('/:restaurantId/:bookingId/status', auth.required, function(req, res, next) {
	// if regEx of params do not match procceed to next function
	var regExObjectId = /^[a-f\d]{24}$/i;
	if (!regExObjectId.test(req.params.restaurantId)) return next();
	if (!regExObjectId.test(req.params.bookingId)) return next();

	// Authorize if user is the admin of the restaurant
	Restaurant.findOne({
		_id: req.params.restaurantId,
		admin: req.user.id
	}).then(function(restaurant) {
		if (!restaurant) res.sendStatus(401);

		Booking.findById(req.params.bookingId).then(function(booking) {
			// Unauthorize if the booking restaurant is different
			if (!booking || booking.restaurant != req.params.restaurantId)
				return res.sendStatus(401);

			if (!req.body.booking || !req.body.booking.bookingStatus)
				return res.sendStatus(400);

			booking.bookingStatus = req.body.booking.bookingStatus;

			booking.save().then(function(updatedBooking) {
				return res.json({booking: updatedBooking.toAuthUserJSON()});
			}).catch(next);
		}).catch(next);
	}).catch(next);
});

module.exports = router;
