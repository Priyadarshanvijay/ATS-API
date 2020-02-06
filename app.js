const express = require('express');
const {Client} = require('pg');
const chalk = require('chalk');
const app = express();
app.use(express.json());

const client = new Client({
    user: "postgres",
    password: "postgres",
    host: "localhost",
    port: 5432,
    database : "ats"
});


//API to get job listings based on skill
app.get('/jobListing', async (req,res) => {
    try{
        const skill = req.body.skill;
        const jobs = await findJobsBySkill(skill);
        res.setHeader("content-type", "application/json");
        res.send(JSON.stringify(jobs));
    }
    catch(e){
        res.send('error');
        // console.log(`Error occoured : ${e}`);
    }
});

//API to add job posting
app.post('/addJob', async (req,res) => {
    let result = {};
    try{
        console.log(chalk.inverse("Request to add a job posting received!"));
        const reqJSON = req.body;
        await createJob(reqJSON)
        result.success = true;
    }
    catch(e){
        result.success = false;
        console.log(e);
    }
    finally{
        res.setHeader("content-type", "application/json");
        res.send(JSON.stringify(result));
    }
    if(result.success) console.log(chalk.bold.inverse.green('Job Posted Successfully'));
    else console.log(chalk.red.inverse.bold('Job posting not successfull!!'));
    console.log(res.statusCode);
});
// ({skills_required})=>{
//     return candidatesBySkill(skills_required);
// }
//API to find canddates based on jobs
app.get('/candidateListing', async (req,res) => {
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
app.post('/Apply', async (req,res) => {
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
app.get('/getCandidates', async (req, res) => {
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
    try {
        await client.query("insert into job_posting (id, job_title, job_description, company, annual_salary_ctc, is_open, vacant_position, skills_required) values ($1,$2,$3,$4,$5,$6,$7,$8);", [jobJSON.id, jobJSON.job_title, jobJSON.job_description, jobJSON.company, jobJSON.annual_salary_ctc, jobJSON.is_open, jobJSON.vacant_position, jobJSON.skills_required]);
        return true
        }
        catch(e){
            return false;
        }
}

async function findJobsBySkill(skill){
    try{
        const results = await client.query("select * from job_posting where skills_required = $1", [skill]);
        return results.rows;
    }
    catch(e){
        return [];
    }
}

async function skillFromJob(jobID, callback){
    try{
        let skill = (await client.query("SELECT skills_required FROM job_posting WHERE id = $1", [jobID])).rows[0];
        let {skills_required} = skill;
        return await callback("skills",skills_required);
    }
    catch(e){
        return callback("skills","");
    }
}

async function getCandidatesByApplied(jobID, callback){
    try{
        let candIDS = (await client.query("SELECT candidate_id FROM applied_jobs WHERE job_id = $1", [jobID])).rows;
        let candidates = [];
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
    catch(e){
        console.log(e);
        return [];
    }
}

async function candidatesByParam(param,value){
    try{
        let candidates = (await client.query(`SELECT * FROM candidate_details NATURAL JOIN personal_details WHERE candidate_details.${param} = $1`, [value])).rows;
        return candidates;
    }
    catch(e){
        console.log(e);
        return [];
    }
}

async function createApplication(candID, jID){
    try{
        await client.query('insert into applied_jobs (candidate_id,job_id,date_applied) values ($1,$2,$3);', [candID,jID,new Date()]);
    }
    catch(e){
        console.log(chalk.red.inverse("ERROR!"), e);
    }
}

app.listen(3000, () => console.log('Server startted on localhost:3000'));