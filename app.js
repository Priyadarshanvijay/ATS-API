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

app.listen(3000, () => console.log('Server startted on localhost:3000'));