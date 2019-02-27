var mongoose = require('mongoose');
var router = require('express').Router();

var auth = require('../../helpers/auth');
var listTables = require('../../helpers/table/listTables');

var Table = mongoose.model('Table');
var Restaurant = mongoose.model('Restaurant');

/*
 * List all tables for particular restaurants
 * required data: none 
 * optional data in query string: 
 *	-	availability='available' / 'unavailable' / 'status'. To filter tables on given date
 *	-	date, in mili-second format. Find out booking status on this time
 *	- capacity, mincapacity, maxcapacity // Capacity wise filtering for available tables
 *	- bookingId // ignore this booking id while checking availability
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

		let query = {}
		query.bookingId = req.query.bookingId;
		query.date = parseInt(req.query.date) ? parseInt(req.query.date) : (Date.now());
		query.capacity = parseInt(req.query.capacity) ? parseInt(req.query.capacity) : null;
		query.maxcapacity = parseInt(req.query.maxcapacity) ? parseInt(req.query.maxcapacity) : null;
		query.mincapacity = parseInt(req.query.mincapacity) ? parseInt(req.query.mincapacity) : 0;

		if (!availability) {
			// Return all tables
			listTables('all', req.params.restaurantId, query, next)
			.then(function(list) {
				return res.json({tables: list});
			}).catch(next);
		} else {
			listTables(availability, req.params.restaurantId, query, next)
			.then(function(list) {
				return res.json({tables: list});
			}).catch(next);
		}
	}).catch(next)
});

module.exports = router;
