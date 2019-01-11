var mongoose = require('mongoose');

var ObjectId = mongoose.Schema.Types.ObjectId;

var TableSchema = new mongoose.Schema({
	restaurant: {
		type: ObjectId,
		ref: 'Restaurant',
		required: [true, "can't be blank"]
	},
	tableIdentifier: {
		type: String,
		required: [true, "can't be blank"]
	},
	capacity: {
		type: Number,
		required: [true, "can't be blank"]
	},
	description: {
		type: String,
	},
});

TableSchema.methods.viewJSON = function() {
	return {
		id: this._id,
		tableIdentifier: this.tableIdentifier,
		capacity: this.capacity,
		description: this.description
	};
};

var Table = mongoose.model('Table', TableSchema);

module.exports = Table;
