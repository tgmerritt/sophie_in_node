let http = require('http');

let createServer = (port, requestCallback) => {
    //create a server object:
    http.createServer((req, res) => {

        if (req.method === "POST") {

            console.log('POST recv, processing');
            let body = '';

            req.on('data', (data) => {
                // Refuse call if the body is larger than 1mb
                if (body.length > 1e6) {
                    //Request is to big, bail.
                    req.connection.destroy();
                }
                body += data;
            });

            req.on('end', () => {
                console.log('body = ' + body);
                requestCallback(body, req.url, (responseBody) => {
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.write(responseBody);
                    res.end();
                });
            });
        } else {
            res.write('<body><div>Unsupported method</div></body>');
            res.end();
        }

    }).listen(port);
}

module.exports = {
    createServer: createServer
};


