var mongoose = require('mongoose');
var router = require('express').Router();

var auth = require('../../helpers/auth');
var throwError = require('../../helpers/throwError');
var bookingValidator = require('../../helpers/bookingValidator');
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

			if (!req.body.booking) return res.sendStatus(400);
			var payload = req.body.booking;

			// Validate input
			var regExObjectId = /^[a-f\d]{24}$/i;
			if (!(payload.noOfPersons = parseInt(payload.noOfPersons))
				|| payload.noOfPersons <= 0)
				throwError.validationError();
			if (payload.bookingFrom < Date.now())
				throwError.validationError();

			// Add restaurant id to payload
			payload.restaurant = booking.restaurant;
			console.log(payload);

			// Validate booking time with business hours
			bookingValidator.businessHours(payload).then(function(valid) {
				if (!valid) throwError.validationError('Restaurant will be closed at that time');

				// Find the tables which have bookings during the time
				Booking.find(
					{
						'restaurant': payload.restaurant,
						'bookingFrom': {
							$gt: payload.bookingFrom - config.defaultBookingDuration,
							$lt: payload.bookingFrom + config.defaultBookingDuration
						}
					},
					'tables'
				).then(function(occupiedTables) {
					console.log('Occupied tables: ', occupiedTables);

					// Find all the tables of the restaurant with required capacity
					Table.find(
						{
							'restaurant': payload.restaurant,
							'capacity': {$gte: payload.noOfPersons}
						},
						'_id capacity'
					).then(function(allTables) {
						console.log('All tables: ', allTables);
						if (!allTables.length) throwError.noTable('Table not available');

						// Find the tables which does not have bookings at the time
						// Substract the tables ids of occupiedTables from allTables
						let availableTables = allTables.filter(x =>
							!(JSON.parse(JSON.stringify(occupiedTables.map(a => a.tables[0])))
							.includes(JSON.parse(JSON.stringify(x._id)))));

						if (!availableTables.length) throwError.noTable('Table not available');
						console.log('Available tables', availableTables);

						// Select one table with minimum capacity
						let len = availableTables.length;
						let min = Infinity;
						let table = '';

						while(len-- && (min != payload.noOfPersons)) {
							if (availableTables[len].capacity < min) {
								min = availableTables[len].capacity;
								table = availableTables[len]._id;
							}
						}
						console.log('Selected table: ', table)

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
