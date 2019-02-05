var mongoose = require('mongoose');
var router = require('express').Router();

var auth = require('../helpers/auth');
var config = require('../config');
var throwError = require('../helpers/throwError');
var bookingValidator = require('../helpers/bookingValidator');

var Booking = mongoose.model('Booking');
var Table = mongoose.model('Table');
var Customer = mongoose.model('Customer');
var RestaurantOwner = mongoose.model('RestaurantOwner');
var Restaurant = mongoose.model('Restaurant');

/*
 * Create a new booking by logged-id customer
 * Required data: token, restaurant, noOfPersons, bookingFrom
 */
router.post('/', auth.required, function(req, res, next) {
	Customer.findById(req.user.id).then(function(customer) {
		if (!customer) return res.sendStatus(401);

		if (!req.body.booking) return res.sendStatus(400);
		var payload = req.body.booking;

		// Validate input
		var regExObjectId = /^[a-f\d]{24}$/i;
		if (!regExObjectId.test(payload.restaurant))
			throwError.validationError();
		if (!(payload.noOfPersons = parseInt(payload.noOfPersons))
			|| payload.noOfPersons <= 0)
			throwError.validationError();
		if (payload.bookingFrom < Date.now())
			throwError.validationError();

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
					let availableTables = allTables.filter(x => !(JSON.parse(JSON.stringify(occupiedTables.map(a => a.tables[0]))).includes(JSON.parse(JSON.stringify(x._id)))));

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
					var booking = new Booking;

					booking.customer = req.user.id;
					booking.restaurant = payload.restaurant;
					booking.noOfPersons = payload.noOfPersons;
					booking.bookingFrom = payload.bookingFrom;
					booking.tables = table;

					booking.save()
					.then(function() {
						return res.json({booking: booking.toCustomerJSON()});
					}).catch(next);
				}).catch(next);
			}).catch(next);
		}).catch(next);
	}).catch(next);
});

/*
 * Get all bookings of the logged-in customer
 * Required data: Authentication token for customer
 */
router.get('/', auth.required, function(req, res, next) {
	Customer.findById(req.user.id).then(function(customer) {
		if (!customer) return res.sendStatus(401);

		// Get booking data of the customer
		Booking.find({customer: req.user.id}).then(function(bookings) {
			var bookingList = [];
			bookings.forEach(function(booking) {
				bookingList.push(booking.toUserJSON());
			});

			res.json({bookings: bookingList});
		}).catch(next);
	}).catch(next);
});

/*
 * Get booking of the logged-in customer by bookingId
 * Required data: Authentication token
 */
router.get('/:bookingId', auth.required, function(req, res, next) {
	// if regEx of params do not match procceed to next function
	var regExObjectId = /^[a-f\d]{24}$/i;
	if (!regExObjectId.test(req.params.bookingId)) return next();

	Customer.findById(req.user.id).then(function(customer) {
		if (!customer) return res.sendStatus(401);

		// Get booking data of the customer
		Booking.findById({
			_id: req.params.bookingId,
			customer: req.user.id
		}).then(function(booking) {
			if (!booking) return res.sendStatus(401);

			res.json({booking: booking.toUserJSON()});
		}).catch(next);
	}).catch(next);
});

module.exports = router;
