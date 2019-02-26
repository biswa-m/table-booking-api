var mongoose = require('mongoose');
var router = require('express').Router();

var auth = require('../../helpers/auth');
var listTables = require('../../helpers/listTables');

var Table = mongoose.model('Table');
var Restaurant = mongoose.model('Restaurant');

/*
 * List all tables for particular restaurants
 * required data: none 
 * optional data in query string: 
 *	-	availability='available' / 'unavailable' / 'status'. To filter tables on given date
 *	-	date, in mili-second format. Find out booking status on this time
 */
//TODO restrict acess
router.get('/:restaurantId', auth.required, function(req, res, next) {
	// Check user is admin of the restaurant or not
	Restaurant.findOne({
		admin: req.user.id,
		_id: req.params.restaurantId
	}).then(function(restaurant) {
		if (!restaurant) return res.sendStatus(401);

		// Validate query string parameters
		let availability = (typeof(req.query.availability) == 'string'
				&& ['available', 'unavailable', 'status'].indexOf(req.query.availability) != -1)
			? req.query.availability : false;

		let date = parseInt(req.query.date) ? parseInt(req.query.date) : (Date.now());

		if (!availability) {
			// Return all tables
			listTables('all', req.params.restaurantId, date, next)
			.then(function(list) {
				return res.json({tables: list});
			}).catch(next);
		} else {
			listTables(availability, req.params.restaurantId, date, next)
			.then(function(list) {
				return res.json({tables: list});
			}).catch(next);
		}
	}).catch(next)
});

module.exports = router;
