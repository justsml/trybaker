const { body,validationResult } = require('express-validator/check');
const { sanitizeBody } = require('express-validator/filter');
const express = require('express');
const router = express.Router();
const phoneAPI = require('../api/phone');
const querystring = require('querystring');

/* GET home page. */
router.get('/', function(req, res) {
  res.render('index', { title: 'Welcome to TryBaker!' });
});

router.get('/challenge', function(req, res, next) {
    const {phone, fName, lName, email, userId}  = req.query;

    res.render('challenge', {
        title: userId ? 'Welcome back,' : 'Lets get you verified:',
        phone,
        fName,
        lName,
        email,
        doesUserExist: !userId,
    });
});

router.get('/dashboard', function(req, res, next) {
    // using a timeout to defeat a small race condition on the api
    setTimeout(() => {
        phoneAPI.getData(req.query)
            .then(results => {
                if(results.status == 'invalid') {
                    let userId;
                    if(results.user) {
                        userId = results.user.id;
                    }
                    return res.redirect(`/challenge?${querystring.stringify({userId: userId, ...req.query})}`);
                }

                // console.log('dashboard hydration? ', {results, ...req.query})
                const user = results.user;
                const data = results.data;
                res.render('dashboard', {
                    title: 'TryBaker v0.1',
                    total: data.total,
                    visits: data.entries.length,
                    entries: data.entries,
                    ...req.query
                });
            })
            .catch(next);
    }, 100)
});


// Form submission logic
// #1 Login given a phone number
router.post('/login', function(req, res, next) {
    console.log('login post', req.body);
    if(!req.body.phone) { return res.redirect(`/?errors=['Invalid request. No code or phone.']`) }

    phoneAPI.sendCode(req.body.phone)
        .then(result => {
            console.log('+++++++++++++++++++++++++++++++')
            console.log('result', result)
            console.log('+++++++++++++++++++++++++++++++')
            if(result){
                let userId = result.userId  || '';
                res.redirect(`/challenge?phone=${req.body.phone}&userId=${userId}`);
            } else {
                res.redirect('/');
            }
        })
        .catch(next)
});

// #2  Let's verify that you own that phone number given a phone number and code
router.post('/verification', function(req, res, next) {
    const {code, phone}  = req.body;

    if(!code || !phone) {
        res.redirect(`/?errors=['Invalid request. No code or phone.']`);
    } else {
        phoneAPI.completeVerification(req.body)
            .then(result => {
                const {userId} = result;
                if(userId) {
                    res.redirect(`/checkin?${querystring.stringify({...req.body, userId: userId})}`);
                } else {
                    res.redirect(`/challenge?errors=['Invalid code used']&${querystring.stringify(req.body)}`);
                }
            })
            .catch(err => {
                console.log(err);
                res.redirect(`/challenge?errors=['Something went wrong']&${querystring.stringify(req.body)}`);
            });
    }
});

// #3 Lets get you hydrated, you seem to belong
router.get('/checkin', function(req, res) {
    console.log('dashboard hydration', req.query);
    res.redirect(`/dashboard?${querystring.stringify(req.query)}`);
});



module.exports = router;
