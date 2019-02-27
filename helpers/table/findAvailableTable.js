var mongoose = require('mongoose');

var Table = mongoose.model('Table');
var Booking = mongoose.model('Booking');

var config = require('../../config');
var throwError = require('../throwError');

var findAvailbleTable = function(payload, next) {
	return new Promise(function(resolve,reject){
		// Find the occupied tables of the restaurant at the given time
		Booking.find(
			{
				'restaurant': payload.restaurant,
				'bookingFrom': {
					$gt: payload.bookingFrom - config.defaultBookingDuration,
					$lt: payload.bookingFrom + config.defaultBookingDuration
				},
				_id: {
					$ne: payload.id
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
				return resolve(table);
			}).catch(next);
		}).catch(next);
	});
};

module.exports = findAvailbleTable;
