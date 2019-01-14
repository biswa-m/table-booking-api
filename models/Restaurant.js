var mongoose = require('mongoose');

var validateData = require('../helpers/validateData');

var ObjectId = mongoose.Schema.Types.ObjectId;

var timeSchema = {
	start: Number,
	end: Number
}

var RestaurantSchema = new mongoose.Schema({
	name: {
		type: String,
		required: [true, "can't be blank"]
	},
	address: {
		type: String,
		required: [true, "can't be blank"]
	},
	description: {
		type: String,
	},
	admin: {
		type: [{type: ObjectId, ref: 'RestaurantOwner'}],
		required: [true, "can't be blank"]
	},
	verified: Boolean,
	businessHours: {
		sunday: timeSchema,
		monday: timeSchema,
		tuesday: timeSchema,
		wednesday: timeSchema,
		thursday: timeSchema,
		friday: timeSchema,
		saturday: timeSchema
	}
});

RestaurantSchema.methods.setBusinessHours = function(data) {
	if (!data) return;

	var businessHours = this.businessHours;
	const days = Object.keys(businessHours);

	days.forEach(function(day) {
		if (!data[day]) return;

		if (!validateData.time(data[day].start)
					|| !validateData.time(data[day].end)
					|| data[day].start > data[day].end) {
			var err = new Error('Invalid business hours');
			err.name = 'ValidationError';
			throw err;
		}

		businessHours[day].start = data[day].start;
		businessHours[day].end = data[day].end;
	});
};

RestaurantSchema.methods.viewByOwnerJSON = function() {
	return {
		id: this._id,
		name: this.name,
		address: this.address,
		description: this.description,
		businessHours: this.businessHours,
		verified: this.verified
	};
};

RestaurantSchema.methods.viewJSON = function() {
	return {
		id: this._id,
		name: this.name,
		address: this.address,
		description: this.description,
		businessHours: this.businessHours
	};
};

var Restaurant = mongoose.model('Restaurant', RestaurantSchema);

module.exports = Restaurant;
