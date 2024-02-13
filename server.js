const moongose = require('mongoose');
const dotenv = require('dotenv');


process.on('uncaughtException', err => {
  console.log(`${err.name, err.message}`);
  console.log('Uncaught Exception! Shutting down');
  process.exit(1);
})
dotenv.config({ path: './config.env' });
const app = require('./app');

// console.log(process.env);
const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD,
);
// console.log(DB);
moongose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
  })
  .then(() => console.log('DB connection Sucessful!'))
const port = process.env.PORT || 3000;

//START SERVER
app.listen(port, () => {
  console.log(`App is running on this port:${port}...`);
});


// process.on('unhandledRejection', err => {
//   console.log(`${err.name, err.message}`);
//   console.log('Unhandled Rejection! Shutting down');
//   process.exit(1);
// })
