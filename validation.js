const Joi = require('joi');
const app = require('express')();
const validator = require('express-joi-validation').createValidator({});

const querySchema = Joi.object({
    name: Joi.string().required(),
    age: Joi.string().required(),
    "phone number": Joi.string().required(),
});

app.get('/orders', validator.query(querySchema), (req,res) => {
    res.end(`Hello ${req.query.name}! ${req.query.age} ${req.query["phone number"]}`);
});

app.listen(3030, () => console.log('server running'));