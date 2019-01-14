var mongoose = require('mongoose');

var Table = mongoose.model('Table');
var Restaurant = mongoose.model('Restaurant');

// Instantiate object to export
var bookingValidator = {};

// Function to validate no of persons during schema building
bookingValidator.noOfPersons = function(value, respond) {
	if (!value) respond(false, 'There must be atleast one person');

	var tableIds = this.tables;
	var restaurant = this.restaurant;

	// Go through each table of tables array
	Table.find({'_id': {$in: this.tables}})
	.then(function(tables) {
		// check provided table ids are valid
		if (tables.length !== tableIds.length)
			respond(false, 'validation fail, invalid table');

		// Iterate throgh table array to calculate total capacity
		var totalCapacity = 0;
		tables.forEach(function(table) {
			if (JSON.stringify(restaurant) !== JSON.stringify(table.restaurant))
				respond(false, 'validation fail, invalid table or restaurant');

			totalCapacity += table.capacity;
		});
		if (value > totalCapacity) respond(false);

		respond(true);
	}).catch(function(err){
		console.log(err);
		respond(false, 'validation fail');
	});
};

// function to validate restaurat during schema building
bookingValidator.restaurant =  function(value, respond) {
	Restaurant.findById(value).then(function(restaurant) {
		if (!restaurant) respond(false);

		respond(true);
	}).catch(function(err){
		console.log(err);
		respond(false);
	});
};

module.exports = bookingValidator;
