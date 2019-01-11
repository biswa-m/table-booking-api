var mongoose = require('mongoose');

var ObjectId = mongoose.Schema.Types.ObjectId;

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
		required: [true, "can't be blank"],
	},
	verified: Boolean,
	businessHours: {
		sunday: {
			start: Date,	
			end: Date
		},
		monday: {
			start: Date,	
			end: Date
		},
		tuesday: {
			start: Date,	
			end: Date
		},
		wednesday: {
			start: Date,	
			end: Date
		},
		thursday: {
			start: Date,	
			end: Date
		},
		friday: {
			start: Date,	
			end: Date
		},
		saturday: {
			start: Date,	
			end: Date
		}
	}
});

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
