const express = require('express');
const fs = require('fs');
const path = require('path');
const {Client} = require('pg');
const chalk = require('chalk');
const app = express();
const morgan = require('morgan');
const logger = require('./logger');
const validator = require('express-joi-validation').createValidator({});
const validation = require('./validation');
app.use(express.json());
app.use(express.static('public'));


const accessLogStream = fs.createWriteStream(path.join(__dirname, 'access.log'), { flags: 'a' });
app.use(morgan('combined', { stream: accessLogStream }))
const accessDevLogStream = fs.createWriteStream(path.join(__dirname, 'dev.log'), { flags: 'a' });
app.use(morgan('dev', {stream : accessDevLogStream}));


const client = new Client({
    user: "postgres",
    password: "postgres",
    host: "localhost",
    port: 5432,
    database : "ats"
});


//API to get job listings based on skill
app.get('/jobListing', validator.body(validation.jobListingPost) ,async (req,res) => {
    try{
        const skill = req.body.skill;
        const jobs = await findJobsBySkill(skill);
        res.setHeader("content-type", "application/json");
        res.send(JSON.stringify(jobs));
    }
    catch(e){
        console.log(`Error occoured : ${e}`);
        res.send('error');
    }
});

//API to add job posting
app.post('/addJob', validator.body(validation.addJobPOST), async (req,res) => {
    let result = {};
    try{
        console.log(chalk.inverse("Request to add a job posting received!"));
        const reqJSON = req.body;
        await createJob(reqJSON)
        result.success = true;
    }
    catch(e){
        result.success = false;
        console.log(e.message);
        res.status(409);
    }
    finally{
        res.setHeader("content-type", "application/json");
        res.send(JSON.stringify(result));
    }
    if(result.success) console.log(chalk.bold.inverse.green('Job Posted Successfully'));
    else console.log(chalk.red.inverse.bold('Job posting not successfull!!'));
    console.log(res.statusCode);
});

//API to change job posting
app.patch('/addJob', validator.body(validation.addJobPatch), async (req,res) => {
    try{
        const reqJSON = req.body;
        await alterJob(reqJSON.id, reqJSON.param, reqJSON.paramValues);
        res.status(200);
    }
    catch(e){
        console.log(e.message);
        res.status(400);
    }
    finally{
        res.send();
    }
});

//API to find candidates based on jobs
app.get('/candidateListing', validator.body(validation.getCandidateListing) ,async (req,res) => {
    let result = true;
    try{
        const jobID = req.body.jobID;
        let listOfCandidates = [];
        listOfCandidates =  await skillFromJob(jobID, candidatesByParam);
        res.setHeader("content-type", "application/json");
        res.send(JSON.stringify(listOfCandidates));
    }
    catch(e){
        result = false;
        res.setHeader("content-type", "application/json");
        res.send('ERROR');
    }
    finally{
        if(result) console.log(chalk.green.inverse('Success!'));
        else console.log(chalk.inverse.red('FAIL!!'));
    }
});

//API to apply for a job
app.post('/Apply', validator.body(validation.applyForJob) , async (req,res) => {
    let result = true;
    try{
        const candidateID = req.body.candID;
        const jobID = req.body.jID;
        await createApplication(candidateID, jobID);
    }
    catch(e){
        console.log('Error, ' + e);
        result = false;
    }
    res.setHeader("content-type", "application/json");
    res.send(result);
});

//API to get candidates based on who have applied for a job
app.get('/getCandidates', validator.body(validation.getCandidateListing), async (req, res) => {
    let result = true;
    try{
        const jobID = req.body.jID;
        const listOfCandidates = await getCandidatesByApplied(jobID, candidatesByParam);
        res.setHeader("content-type", "application/json");
        res.send(JSON.stringify(listOfCandidates));
    }
    catch(e){
        result = false;
        res.setHeader("content-type", "application/json");
        res.send('ERROR');
    }
    finally{
        if(result) console.log(chalk.green.inverse('Success!'));
        else console.log(chalk.inverse.red('FAIL!!'));
    }
});

//Add persons -> both candidates and recruiters with the same API?
app.post('/addPerson', async (req,res) => {
    try{
        console.log(chalk.cyanBright('Request received'));
        const detailsOfPersonObj = req.body;
        await addPerson(detailsOfPersonObj);
        res.setHeader("content-type", "application/json");
        res.status(200).send("User added successfully");
    }
    catch(e){
        await client.query('ROLLBACK');
        console.log(chalk.red('Request not processed due to the following error : '))
        console.log(e.message);
        console.log(`Received data : ${req.body}`);
        res.setHeader("content-type", "application/json");
        res.status(400).send("Cannot add user");
    }
    finally{
        console.log(chalk.cyanBright('Request Served!'));
    }
});

start();
//Functions

async function start(){
    await connect();
}

async function connect() {
    try {
        await client.connect();
    }
    catch(e) {
        console.error(`Failed to connect ${e}`)
    }
}

async function createJob(jobJSON){
    await client.query("insert into job_posting (id, job_title, job_description, company, annual_salary_ctc, is_open, vacant_position, skills_required) values ($1,$2,$3,$4,$5,$6,$7,$8);", [jobJSON.id, jobJSON.job_title, jobJSON.job_description, jobJSON.company, jobJSON.annual_salary_ctc, jobJSON.is_open, jobJSON.vacant_position, jobJSON.skills_required]);
    return true;
}

async function findJobsBySkill(skill){
    const results = await client.query("select * from job_posting where skills_required = $1", [skill]);
    return results.rows;
}

async function skillFromJob(jobID, callback){
    let skill = (await client.query("SELECT skills_required FROM job_posting WHERE id = $1", [jobID])).rows[0];
    let {skills_required} = skill;
    return await callback("skills",skills_required);
}

async function getCandidatesByApplied(jobID, callback){
    let candIDS = (await client.query("SELECT candidate_id FROM applied_jobs WHERE job_id = $1", [jobID])).rows;
    let candidates = [];
    //-----------------NOTE STARTS-----------------------
    //The below commented code wasn't working because of forEach function, I had to use for loop because of Async-Await
    //-----------------NOTE ENDS-----------------------
    // candIDS.forEach(async element => {
    //     let toPush = await callback("id",element.candidate_id);
    //     candidates.push(toPush);
    // });
    const candIDSize = candIDS.length;
    for(let curIndex = 0 ; curIndex < candIDSize ; ++curIndex){
        candidates.push((await callback("id",candIDS[curIndex].candidate_id))[0]);
    }
    return candidates;
}

async function candidatesByParam(param,value){
    let candidates = (await client.query(`SELECT * FROM candidate_details NATURAL JOIN personal_details WHERE candidate_details.${param} = $1`, [value])).rows;
    return candidates;
}

async function createApplication(candID, jID){
    await client.query('insert into applied_jobs (candidate_id,job_id,date_applied) values ($1,$2,$3);', [candID,jID,new Date()]);
}

async function addPerson(personJSON){
    await client.query('BEGIN');
    await client.query('INSERT INTO personal_details (id, first_name, last_name, email, gender, password, phone_number) VALUES ($1, $2, $3, $4, $5, $6, $7);', [personJSON.id, personJSON.first_name, personJSON.last_name, personJSON.email, personJSON.gender, personJSON.password, personJSON.phone_number]);
    if(personJSON["role"] === 'c'){
        //add to candidate table
        await client.query('INSERT INTO candidate_details (id, cv, skills, college_of_latest_education, location) VALUES ($1, $2, $3, $4, $5)', [personJSON.id, personJSON.cv, personJSON.skills, personJSON.college_of_latest_education, personJSON.location]);
    }
    else if(personJSON["role"] === 'r'){
        //add to recruiter table
        await client.query('INSERT INTO recruiter_details (id, company) VALUES ($1, $2)', [personJSON.id, personJSON.company]);
    }
    else{
        throw new Error("Role not defined in request");
    }
    await client.query('COMMIT');
}

async function alterJob(id,paramArray, paramValues){
    for(let i = 0 ; i < paramArray.length ; ++i){
        await client.query(`UPDATE job_posting SET ${paramArray[i]} = $1 WHERE id = $2`, [paramValues[i], id]);
    }
}

app.listen(3000, () => logger.info('Server started on localhost:3000'));