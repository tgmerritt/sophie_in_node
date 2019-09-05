let jwt = require('jwt-simple');
let request = require('request');
let server = new require("./server.js");

const baseUrl = 'https://dal-eeva.faceme.com';
const tokenEndpoint = '/api/v1/clients/access/tokens/';
const apiKey = process.env.FM_API_KEY;
const customerJwtSecret = process.env.CUSTOMER_JWT_SECRET;

//Handle the post request
let processPostRequest = (body, path, callback) => {
    console.log('Process ' + path);
    try {
        if (path == '/api/v1/watson/getSingleUseToken') {

            getSingleUserToken((token) => {
                callback(token);
            });

        } else {
            callback({});
        }
    } catch (e) {
        console.log(e.toString());
        callback({});
    }
}

async function getSingleUseToken() {
    return new Promise((resolve, reject) => {
        let payload = {
            'sid': '',
            'fm-custom-data': '',
            'fm-workspace': process.env.FM_WORKSPACE
        };

        let token = jwt.encode(payload, customerJwtSecret);

        request.post({
            url: baseUrl + tokenEndpoint,
            headers: {
                'faceme-api-key': apiKey,
                'Content-Type': 'application/jwt'
            },
            body: token,
            method: 'POST'
        }, (err, resp, body) => {
            if (err) {
                console.log(err)
                console.log(body)
                reject(err);
            } else {
                console.log('Response: ' + body);

                let rt = JSON.parse(body);
                if (rt.hasOwnProperty('status')) {
                    console.log('Status:' + rt.status + ", Message: " + rt.message);
                } else {
                    resolve(rt.token);
                }

            }
        });
    })
}

let startServer = (port) => {
    server.createServer(port, processPostRequest)
}

module.exports = {
    startServer: startServer,
    getSingleUseToken: getSingleUseToken
};