var validateData = {}

validateData.time = function(value) {
	return (parseInt(value) == value) && value >= 0 && value <= 2400;
};

module.exports = validateData;
