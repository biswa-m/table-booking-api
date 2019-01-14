var mongoose = require('mongoose');
var router = require('express').Router();

var Restaurant = mongoose.model('Restaurant');

/*
 * Get list of all varified restaurants by public
 */
// TODO add filter by availibilty during date time
router.get('/', function(req, res, next) {
	Restaurant.find({verified: true}).then(function(restaurants) {
		let list = []

		restaurants.forEach(function(restaurant) {
			list.push(restaurant.viewJSON());
		});

		return res.json({restaurants: list});
	}).catch(next);
});

module.exports = router;
