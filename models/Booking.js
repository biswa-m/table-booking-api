var mongoose = require('mongoose');

var ObjectId = mongoose.Schema.Types.ObjectId;

var BookingSchema = new mongoose.Schema({
	customer: {
		type: ObjectId,
		required: [true, "can't be blank"]
	},
	restaurant: {
		type: ObjectId,
		ref: 'Restaurant',
		required: [true, "Can't be blank"],
	},
	tables: {
		type: [{type: ObjectId, ref: 'Table'}],
		default: undefined,
		required: [true, "can't be blank"]
	},
	noOfPersons: {
		type: Number, // TODO integer
		required: [true, "can't be blank"],
	},
	bookingFrom: {
		type: Date,
		required: [true, "can't be blank"],
	},
	bookingStatus: {
		type: String,
		default: 'pending',
		validate: {
			validator: function(value) {
				validStrings = ['pending', 'confirmed', 'canceled'];
				return (validStrings.indexOf(value.toLowerCase()) !== -1);
			},
			message: 'invalid input, enter pending/confirmed/canceled'
		}
	},
	bookingStatusUpdatedBy: {
		type: String,
		validate: {
			validator: function(value) {
				validStrings = ['customer', 'restaurantOwner', 'superAdmin'];
				return (validStrings.indexOf(value.toLowerCase()) !== -1);
			},
			message: 'invalid string'
		}
	}
}, {timestamps: true});

BookingSchema.methods.toCustomerJSON = function() {
	return {
		id: this._id,
		restaurant: this.restaurant,
		bookingFrom: this.bookingFrom,
		bookingStatus: this.bookingStatus
	};
};

BookingSchema.methods.toRestauranteurJSON = function() {
	return {
		id: this._id,
		restaurant: this.restaurant,
		tables: this.tables,
		noOfPersons: this.noOfPersons,
		customer: this.customer,
		bookingFrom: this.bookingFrom,
		bookingStatus: this.bookingStatus
	};
};

var Booking = mongoose.model('Booking', BookingSchema);

module.exports = Booking;
