const App = require('../app');
const chai = require('chai');
const request = require('request');
const chaiHttp = require('chai-http') ;
const should = chai.should();

chai.use(chaiHttp);

describe('App', () => {
    describe('/GET Job Listings based on skill', () => {
        chai.request(App)
            .get('/jobListing'
            .endsWith())
    })
})