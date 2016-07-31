var mailer = require('nodemailer');
var trans = mailer.createTransport({
  host: 'sean.dev',
  port: 25,
  secure: true,
  auth: {
    user: 'default',
    pass: 'default'
  },
  tls: {
    rejectUnauthorized: false
  }
});

var opts = {
  from: '"Sean Wilson" <hello@imsean.me>',
  to: 'sean@kbve.com',
  subject: 'Hello',
  text: 'World',
  html: '<b>World</b>'
};

trans.sendMail(opts, function(err, data) {
  if (err) {
    return console.log(err);
  }

  console.log(data);
});
