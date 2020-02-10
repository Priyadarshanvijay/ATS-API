const Joi = require('joi');


const jobListingPost = Joi.object({
    skill: Joi.string().required()
});

const addJobPOST = Joi.object({
    id: Joi.number().integer().required(),
    job_title: Joi.string().required(),
    job_description: Joi.string(),
    company: Joi.string().required(),
    annual_salary_ctc: Joi.string().required(),
    is_open: Joi.bool().required(),
    vacant_position: Joi.number().integer(),
    skills_required: Joi.string().required()
});

const addJobPatch = Joi.object({
    id : Joi.number().integer().required(),
    param : Joi.array().min(1).required(),
    paramValues: Joi.array().min(1).required()
}).assert('param.length', Joi.ref('paramValues.length'), 'Number of values in param is not equal to number of values in paramValues');

const getCandidateListing = Joi.object({
    jobID : Joi.number().integer().required()
});

const applyForJob = Joi.object({
    candidateID :Joi.number().integer().required(),
    jobID :  Joi.number().integer().required()
});

module.exports = {
    jobListingPost,
    addJobPOST,
    getCandidateListing,
    addJobPatch,
    applyForJob
};