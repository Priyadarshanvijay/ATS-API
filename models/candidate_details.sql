create table candidate_details (
	id INT REFERENCES personal_details(id),
	CV VARCHAR(50) NOT NULL,
	skills VARCHAR(200),
	college_of_latest_education VARCHAR(200),
	location VARCHAR(50)
);