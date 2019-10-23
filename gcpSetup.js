let fs = require("fs");
fs.writeFile(process.env.GOOGLE_APPLICATION_CREDENTIALS_FILE, process.env.GOOGLE_APPLICATION_CREDENTIALS, (err) => {});