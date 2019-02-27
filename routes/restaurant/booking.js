var mongoose = require('mongoose');
var router = require('express').Router();

var auth = require('../../helpers/auth');
var throwError = require('../../helpers/throwError');
var bookingValidator = require('../../helpers/bookingValidator');
var findAvailableTable = require('../../helpers/table/findAvailableTable');
var checkAvailability = require('../../helpers/table/checkAvailability');
var config = require('../../config');

var Restaurant = mongoose.model('Restaurant');
var Customer = mongoose.model('Customer');
var Booking = mongoose.model('Booking');
var Table = mongoose.model('Table');

/* 
 * Get booking by booking id
 * permission - restaurant owner
 * required data - Authentication token
 */ 
router.get('/:restaurantId/:bookingId', auth.required, function(req, res, next) {
	console.log('Getting booking..');
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

			return res.json({booking: booking.toRestauranteurJSON()});
		}).catch(next);
	}).catch(next);
});

/* 
 * Update booking
 * permission - restaurant owner
 * required data - Authentication token
 * optional data - noOfPersons, bookingFrom, bookingStatus 
 * TODO - tables, add customer's additional contact info
 */ 
router.put('/:restaurantId/:bookingId', auth.required, function(req, res, next) {
	console.log('\nProcessing updation request: ');
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

			var payload = req.body.booking;
			if (!payload) return res.sendStatus(400);

			// Validate input
			var regExObjectId = /^[a-f\d]{24}$/i;
			if (!(payload.noOfPersons = parseInt(payload.noOfPersons))
				|| payload.noOfPersons <= 0)
				throwError.validationError();

			if (new Date(parseInt(payload.bookingFrom)) == 'Invalid Date')
				throwError.validationError();

			payload.bookingFrom = (parseInt(payload.bookingFrom));
			if (payload.bookingFrom < Date.now())
				throwError.validationError();

			// Add restaurant id and booking id to payload
			payload.restaurant = booking.restaurant;
			payload.id = booking._id;
			console.log(payload);

			// Validate booking time with business hours
			bookingValidator.businessHours(payload).then(function(valid) {
				if (!valid) throwError.validationError('Restaurant will be closed at that time');

				findAvailableTable(payload, next).then(function(table) {
					console.log(table);

					// Update database
					booking.noOfPersons = payload.noOfPersons;
					booking.bookingFrom = payload.bookingFrom;
					booking.tables = table;

					booking.save()
					.then(function() {
						Booking.populate(booking, {path: 'tables'}).then(function() {
							return res.json({booking: booking.toRestauranteurJSON()});
						});
					}).catch(next);
				}).catch(next);
			}).catch(next);
		}).catch(next);
	}).catch(next);
});

/* 
 * Create new booking
 * permission - restaurant owner
 * required data - Authentication token, user: {phone}, booking: {bookingFrom, noOfPersons}
 * optional data
 *	-	user: {name, email} (optional data required in case of new customer)
 *	-	table (type: ObjectId)
 */ 
router.post('/:restaurantId', auth.required, function(req, res, next) {
	console.log('\nProcessing booking request: ');
	// if regEx of params do not match procceed to next function
	var regExObjectId = /^[a-f\d]{24}$/i;
	if (!regExObjectId.test(req.params.restaurantId)) return next();

	// Authorize if user is the admin of the restaurant
	Restaurant.findOne({
		_id: req.params.restaurantId,
		admin: req.user.id
	}).then(function(restaurant) {
		if (!restaurant) res.sendStatus(401);

		// Obtain customer id by phone or email
		let customerQuery = {};
		if (req.body.user && req.body.user.phone) customerQuery.phone = req.body.user.phone;
		else if (req.body.user && req.body.user.email) customerQuery.email = req.body.user.email;
		else throwError.validationError('Kindly provide phone number or email');

		console.log(customerQuery);
		Customer.findOne(customerQuery).then(function(customer) {
			// If phone or email is not present in customer database
			if (!customer) throwError.userNotFound();

			let payload = req.body.booking;

			// Validate input
			if (!payload
				|| !(payload.noOfPersons = parseInt(payload.noOfPersons))
				|| req.body.booking.noOfPersons <= 0)
				throwError.validationError();

			if (new Date(parseInt(payload.bookingFrom)) == 'Invalid Date')
				throwError.validationError('Invalid date');

			payload.bookingFrom = (parseInt(payload.bookingFrom));
			if (payload.bookingFrom < Date.now())
				throwError.validationError('Invalid date');

			// Add restaurant id to payload
			payload.restaurant = req.params.restaurantId;

			// Validate booking time with business hours
			bookingValidator.businessHours(payload)
			.then(async function(valid) {
				if (!valid) throwError.validationError('Restaurant will be closed at that time');

				let table = null;

				// Manual table selection
				if (payload.table) {
					let available = await checkAvailability(
						payload.table,
						req.params.restaurantId,
						payload.bookingFrom,
						next
					);

					if (!available)
						throwError.validationError('Table not available');

					table = payload.table;
				} else {
					table = await findAvailableTable(payload, next)

					if (!table) {
						throwError.validationError('Table not available');
					}
				}

				// Update database
				var booking = new Booking;

				console.log('customer: ', customer);
				booking.customer = customer._id;
				booking.restaurant = payload.restaurant;
				booking.noOfPersons = payload.noOfPersons;
				booking.bookingFrom = payload.bookingFrom;
				booking.tables = table;

				booking.save()
				.then(function() {
					Booking.populate(booking, {path: 'tables'}).then(function() {
						return res.json({booking: booking.toRestauranteurJSON()});
					});
				}).catch(next);
			}).catch(next);
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
				return res.json({booking: updatedBooking.toRestauranteurJSON()});
			}).catch(next);
		}).catch(next);
	}).catch(next);
});

module.exports = router;
