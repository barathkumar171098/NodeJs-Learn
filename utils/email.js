const nodemailer = require('nodemailer')
const pug = require('pug');
const {htmlToText} = require('html-to-text');

/*created a new Email class 
created a new transporter function 
It's abstracting logic away from the actual send Fn
using pug template to Send a Welcome Email*/

module.exports = class Email {
  constructor(user, url) {
    this.to = user.email;
    this.firstName = user.name.split(" ")[0];
    this.url = url;
    this.from = `Jonas Schmedtmann <${process.env.EMAIL_FROM}>`;
  }

  newTransport() {
    if (process.env.NODE_ENV === "production") {
      //send grid
      return nodemailer.createTransport({
        service: 'SendGrid',
        auth: {
          user: process.env.SENDGRID_USERNAME,
          pass: process.env.SENDGRID_PASSWORD
        }
      })
    }
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }

  //send the actual email
  async send(template, subject) {
    // 1.render html based on a pug template
    const html = pug.renderFile(`${__dirname}/../views/email/${template}.pug`, {
      firstName: this.firstName,
      url: this.url,
      subject,
    });
    console.log(html);

    //2.define the email options
    const mailOptions = {
      from: this.from,
      to: this.to,
      subject,
      html,
      // text: htmlToText.fromString(html),
    };
    console.log(mailOptions);
    //3. create transport and send mail

    await this.newTransport().sendMail(mailOptions);
  }

  async sendWelcome() {
    await this.send("Welcome", "Welcome to the Natours family");
  }

  async sendPasswordReset() {
    await this.send(
      "passwordReset",
      "Your password reset token( valid for only 10 mins)"
    );
  }
};

