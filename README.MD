Restaurant Table booking system

Description: A web service which will facilate restaurant owners to manage table booking and allow customers to make table reservations.


NOTE: This is a tentative backend system design. Further discussion might be needed and a lot of reservation related challenges are not considered - eg: restaurant might have special timing for some particular day. As this is just going to be prototype minimalistic approach is considered.

Database Schema
RestaurantOwner: {
	firstName: String,
	lastName: String,
	email: String,
	phone: String,
	password: String,
	resturants: [resturant ObjectId] 
}

Customer: {
	email: String,
	password: String,
	name: String,
	phone: String
}

Restaurant: {
	name: String,
	Address: String,
	description: String,
	admin: [RestaurantOwner ObjectId]
	verified: Boolean
	businessHours: {
		Sunday: {
			start: Time,
			end: Time
		},
		Monday: {
			start: Time,
			end: Time
		},
		...
		...
	}
}

Table: {
	restaurant: ObjectId,
	tableIdentifier: String,	// eg Table No 12
	capacity: Number,
	description: String
}

Booking: {
	restaurant: ObjectId,
	tables: [table ObjectId],
	noOfPersons: Integer,
	bookingFrom: DateTime,
	bookingTo: DateTime,
	customer: Customer ObjectId,
	bookingStatus: pending/confirmed/canceled
	bookingStatusUpdatedBy: customer/RestaurantOwner
}

each collection will have _id by default


Proposed API routes

/user
	POST - create customer account
		Permission - self
	PUT - update customer details.
		Permission - self
	GET - get customer data.
		Permission - self, restaurantOwner if user has booking in his/her restaurant

		params: phone, eg: GET /user/9876543210

/user/login
	POST - validate customer login and return jwt token
		Permission - self

/user/restaurant/login
	POST - validate RestaurantOwner login and return jwt token
		Permission - self

/restaurant
	POST - Create new restaurant by RestaurantOwner
	PUT - Update restaurant details by RestaurantOwner
	GET - Get restaurants owned by the RestaurantOwner
	DELETE - Delete restaurant owned by RestaurantOwner

/table
	POST - Add table(s) to their restaurant by RestaurantOwner
	example request:
		POST /table
		BODY: {
			restauranId: 23847hjhd7q3472341,
			tables: [
				{
					tableIdentifier: 1,
					capacity: 4
				},
				{
					tableIdentifier: 2,
					capacity: 2
				}
			]
		}

	PUT - Update single table details

	GET - List tables for particular restaurant

/restaurants
	GET - list all verfied restaurants for public view

	in version 2, we can add filter by avalibility during datetime

/booking
	POST - Create booking in case its available
		return bookingId

	Permission - Customer, RestaurantOwner

	DELETE - Delete a book
	Permission - Customer, RestaurantOwner