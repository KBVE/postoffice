#!/usr/bin/env node

var mailin = require('mailin');
var mailer = require('nodemailer');
var mysql = require('mysql2');
var util = require('util');
var zt = require('zt');
var rc = require('rc')('postoffice', {
  smtp: {
    host: '127.0.0.1',
    user: 'default',
    pass: 'default',
    port: 25
  },
  mysql: {
    host: '127.0.0.1',
    user: 'root',
    pass: 'root',
    database: 'wp',
    port: 3306
  }
});
var mcon = mysql.createConnection({
  host: rc.mysql.host,
  user: rc.mysql.user,
  password: rc.mysql.pass,
  database: rc.mysql.database,
  port: rc.mysql.port
});
var trans = mailer.createTransport({
  host: rc.smtp.host,
  port: rc.smtp.port,
  secure: true,
  auth: {
    user: rc.smtp.user,
    pass: rc.smtp.pass
  },
  tls: {
    rejectUnauthorized: false
  }
});

mailin.start({
  port: rc.smtp.port,
  disableWebhook: true,
  debug: true,
  verbose: true,
  smtpOptions: {
    secure: true,
    logger: true,
    disabledCommands: false
  },
  ignoreTLS: true
});

mailin.on('authorizeUser', function(conn, user, pass, done) {
  if (user === rc.smtp.user && pass === rc.smtp.pass) {
    return done(null, {user: user});
  }

  done(new Error('Unauthorized'));
});

mailin.on('startMessage', function(conn) {
  var log = 'Received request from [%s] to [%s] with id [%s]';
  zt.log(util.format(log, conn.from, conn.sender, conn.id));
});

var stmt = 'SELECT user_email FROM wp_users WHERE user_email=?';
mailin.on('message', function(conn, data, raw) {
  for (var i = 0; i < data.to.length; i++) {
    mcon.execute(stmt, [data.to[i].address], function(err, rows) {
      if (err) {
        return zt.error(err);
      }

      var from = data.from[0].address;
      var opts;

      if (!rows) {
        opts = {
          html: data.html,
          text: data.text,
          subject: data.subject,
          from: from,
          to: data.to[i].address
        };

        trans.sendMail(opts, function(err, data) {
          if (err) {
            return console.log(err);
          }

          console.log(data);
        });
        return;
      }

      opts = {
        html: data.html,
        text: data.text,
        subject: data.subject,
        from: from,
        to: rows[0].user_email
      };

      trans.sendMail(opts, function(err, data) {
        if (err) {
          return console.log(err);
        }

        console.log(data);
      });
    });
  }
});
