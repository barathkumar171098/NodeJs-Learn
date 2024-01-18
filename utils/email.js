const nodemailer = require('nodemailer')

//sending email with nodeMailer lib
const sendEmail = async options => {
    //1. create a transporter

    const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        auth: {
            user: process.env.EMAIL_USERNAME,
            pass: process.env.EMAIL_PASSWORD
        }
    })

    //2.define the email options
    const mailOptions = {
        from : 'Jonas Schmedtmann <hello@jonas.io>',
        to: options.email,
        sbject: options.subject,
        text: options.message,

    }

    //3. Actually send the email
    await transporter.sendMail(mailOptions);
}

module.exports = sendEmail