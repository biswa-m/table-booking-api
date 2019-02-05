var time = {}; // format: HHMM, type: Integer, Eg 10 am -> 1000, 1:45 pm -> 0145

time.validate = function(value) {
	return (
		parseInt(value) == value)
		&& value >= 0
		&& value <= 2400
		&& (value % 100) < 60;
};

time.get = function(date) {
	date = new Date(date)
	return (date.getHours() * 100 + date.getMinutes());
}

let days = [
	'sunday',
	'monday',
	'tuesday',
	'wednesday',
	'thursday',
	'friday',
	'saturday'];

time.getDay = function(date) {
	date = new Date(date)
	return (days[date.getDay()]);
}

module.exports = {time};
