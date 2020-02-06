create table applied_jobs (
	candidate_id INT REFERENCES personal_details(id),
    job_id INT REFERENCES job_posting(id),
    date_applied DATE,
    PRIMARY KEY(candidate_id, job_id)
);