

'use strict'

const nodemailer = require('nodemailer')

const transport = nodemailer.createTransport({
   service: 'gmail',
   auth: {
      user: 'lqchi.service@gmail.com',
      pass: 'tpfbtdqpggrhwwxt'
   }
  
})

module.exports = transport;

