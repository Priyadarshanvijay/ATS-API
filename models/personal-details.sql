create table  personal_details(
	id INT PRIMARY KEY,
	first_name VARCHAR(50) NOT NULL,
	last_name VARCHAR(50),
	email VARCHAR(50) NOT NULL,
	gender VARCHAR(40),
	password VARCHAR(50) NOT NULL,
	phone_number VARCHAR(50) NOT NULL
);