const express = require('express');
const {Client} = require('pg');
const chalk = require('chalk');
const app = express();
app.use(express.json());

app.get('/', (req,res) => {
    console.log('Get Request');
    res.status(200).send("Hi, welcome to aws instance");
});

app.listen(8080, () => console.log('Server started on localhost:3000'));