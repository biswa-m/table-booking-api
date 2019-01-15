var throwError = {};

throwError.validationError = function(msg) {
	var err = new Error(msg);
	err.name = 'ValidationError';
	throw err;
};

module.exports = throwError;
