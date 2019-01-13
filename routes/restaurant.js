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
			return res.json({restaurant: restaurant.viewJSON()});
		}).catch(next);
	}).catch(next);
});

module.exports = router;
