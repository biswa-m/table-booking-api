var mongoose = require('mongoose');
var router = require('express').Router();

var auth = require('../helpers/auth');

var Restaurant = mongoose.model('Restaurant');
var Customer = mongoose.model('Customer');
var Booking = mongoose.model('Booking');
var RestaurantOwner = mongoose.model('RestaurantOwner');

// TODO in V2.0 assign other admins by restaurant owner and manage permissions

/*
 * Create new restaurant by restaurant owner
 * required data: name, address, business hours
 * optional data: description
 */
router.post('/', auth.required, function(req, res, next) {
	RestaurantOwner.findById(req.user.id).then(function(restaurantOwner) {
		if (!restaurantOwner) return res.sendStatus(401);

		if (!req.body.restaurant) return res.sendStatus(400);

		var restaurant = new Restaurant();

		restaurant.admin = req.user.id;
		restaurant.name = req.body.restaurant.name;
		restaurant.address = req.body.restaurant.address;
		restaurant.description = req.body.restaurant.description;
		restaurant.setBusinessHours(req.body.restaurant.businessHours);

		restaurant.save().then(function() {
			return res.json({restaurant: restaurant.viewByOwnerJSON()});
		}).catch(next);
	}).catch(next);
});

/*
 * Get restaurants own by restaurantOwner
 * required data: Authentication token
 */
router.get('/', auth.required, function(req, res, next) {
	RestaurantOwner.findById(req.user.id).then(function(restaurantOwner) {
		if (!restaurantOwner) return res.sendStatus(401);

		Restaurant.find({admin: req.user.id}).then(function(restaurants) {
			var restauratnsDetails = [];
			restaurants.forEach(function(restaurant) {
				restauratnsDetails.push(restaurant.viewByOwnerJSON());
			});

			return res.json({restaurants: restauratnsDetails});
		}).catch(next);
	}).catch(next);
});

/*
 * Update restaurant details
 * required data: Authentication token
 * optional data: name, address, description, businessHours
 */
router.put('/', auth.required, function(req, res, next) {
	RestaurantOwner.findById(req.user.id).then(function(restaurantOwner) {
		if (!restaurantOwner) return res.sendStatus(401);

		let data = req.body.restaurant;
		if (!data || !(data.name || data.address || data.description || data.businessHours)){
			return res.status(400).json({errors: 'Provide data to update'});
		}

		Restaurant.findOne({
			admin: req.user.id,
			_id: req.body.restaurant.id
		}).then(function(restaurant) {
			if (!restaurant) return res.sendStatus(401);

			// Update fields that were passed
			if (typeof data.name !== 'undefined')
				restaurant.name = data.name;
			if (typeof data.address !== 'undefined')
				restaurant.address = data.address;
			if (typeof data.description !== 'undefined')
				restaurant.description = data.description;
			if (typeof data.businessHours !== 'undefined')
				restaurant.setBusinessHours(data.businessHours);

			restaurant.save().then(function() {
				return res.json({restaurant: restaurant.viewByOwnerJSON()});
			}).catch(next);
		}).catch(next);
	}).catch(next);
});

// TODO delete restaurant, manage the bookings and other associated data when deleted

/*
 * Read customer data by phone no
 * permission: restaurant owner, if the customer(s) have booking in his/her restaurant(s)
 * required data: Authentication token
 */
router.get('/:restaurantId/:phone', auth.required, function(req, res, next) {
	// if regEx of params do not match procceed to next function
	var regExObjectId = /^[a-f\d]{24}$/i;
	if (!regExObjectId.test(req.params.restaurantId)) return next();

	var regExPhone = /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/im;
	if (!regExPhone.test(req.params.phone)) return next();

	// Authorize if user is the admin of the restaurant
	Restaurant.findOne({
		_id: req.params.restaurantId,
		admin: req.user.id
	}).then(function(restaurant) {
		if (!restaurant) return res.sendStatus(401);

		// Find customer using phone no provided
		Customer.findOne({phone: req.params.phone}).then(function(customer) {
			if (!customer) return res.sendStatus(401);

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
