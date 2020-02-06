create table recruiter_details (
	id INT REFERENCES personal_details(id) NOT NULL,
	company VARCHAR(100) NOT NULL
);