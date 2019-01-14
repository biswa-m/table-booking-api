var mongoose = require('mongoose');
var router = require('express').Router();

var auth = require('../helpers/auth');

var Restaurant = mongoose.model('Restaurant');
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

module.exports = router;
