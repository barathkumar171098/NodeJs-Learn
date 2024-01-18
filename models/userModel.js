const moongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const crypto = require('crypto');
//name, email , photo, password, passwordConfirm

const userSchema = new moongoose.Schema({
  name: {
    type: String,
    required: [true, "Please tell us your name!"],
  },
  email: {
    type: String,
    required: [true, "Please provide your email"],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, "Please provide a valid email"],
  },
  photo: String,
  role: {
    type: String,
    enum: ['user', 'guide', 'lead-guide', 'admin'],
    default: 'user'

  },
  password: {
    type: String,
    required: [true, "Please provide a password"],
    minlength: 8,
    select: false,
  },
  passwordConfirm: {
    type: String,
    required: [true, "Please confirm your password"],
    validate: {
      // This only works on create or save
      validator: function (el) {
        return el === this.password;
      },
      message: "Passwords are not the same",
    },
 
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  active: {
    type: Boolean,
    default: true,
    select: false
  }
});

userSchema.pre('save', async function (next) {
  //Only run this function if password was actually completed
  if (!this.isModified("password")) return next();

  this.password = await bcrypt.hash(this.password, 12);

  //delete passedconfirm field
  this.passwordConfirm = undefined;
  next();
});


userSchema.pre('save', function(next) {
  // if didn't modify the password, then it calls the next middleware fn
  if(!this.isModified('password') || this.isNew) return next();

  // modifying password changed one sec in past
  this.passwordChangedAt = Date.now() - 1000;
  next();
})

/*this middleware is used to handle the find Query Wherever be used to hide or delete the respective data to Postman 
not delete at the DB 
Only marking as inactive */

userSchema.pre(/^find/, function(next) {
  // this points to the current query
  this.find({ active: {$ne: false} });
  // this.find({ active: true });
  next();
});


// creating an instance method
// using compare function, then checking the password is correct or not
userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

//InstanceMethod for changedPasswordAfter

userSchema.methods.changedPasswordAfter = function(JWTTimestamp) {
  if(this.passwordChangedAt) {
    const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
    console.log(changedTimestamp, JWTTimestamp);  

    return JWTTimestamp < changedTimestamp // 
  }
  // false means password not changed
  return false;
} 

//InstanceMethod for createPasswordResetToken

userSchema.methods.createPasswordResetToken = function() {
  const resetToken = crypto.randomBytes(32).toString('hex');

  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

    console.log({resetToken}, this.passwordResetToken , 'resetData');

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  return resetToken;  
}

const User = moongoose.model('User', userSchema);

module.exports = User;
