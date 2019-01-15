var mongoose = require('mongoose');

var bookingValidator = require('../helpers/bookingValidator');

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
		validate: {
			isAsync: true,
			validator: bookingValidator.restaurant,
			message: 'Invalid restaurant'
		}
	},
	tables: {
		type: [{type: ObjectId, ref: 'Table'}],
		default: undefined,
		required: [true, "can't be blank"]
	},
	noOfPersons: {
		type: Number, // TODO integer
		required: [true, "can't be blank"],
		validate: {
			isAsync: true,
			validator: bookingValidator.noOfPersons,
			message: 'No of persons can not be more than table capacity'
		}
	},
	bookingFrom: {
		type: Date,
		required: [true, "can't be blank"],
	},
	bookingTo: {
		type: Date,
		required: [true, "can't be blank"]
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

BookingSchema.methods.toUserJSON = function() {
	return {
		restaurant: this.restaurant,
		tables: this.tables,
		bookingFrom: this.bookingFrom,
		bookingTo: this.bookingTo
	};
};

BookingSchema.methods.toAuthUserJSON = function() {
	var respond = {
		restaurant: this.restaurant,
		tables: this.tables,
		noOfPersons: this.noOfPersons,
		customer: this.customer,
		bookingFrom: this.bookingFrom,
		bookingTo: this.bookingTo,
		bookingStatus: this.bookingStatus
	};
};

var Booking = mongoose.model('Booking', BookingSchema);

Booking.schema.path('bookingFrom').validate(bookingValidator.bookingTime, 'Invalid booking time!');

module.exports = Booking;
