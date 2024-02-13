import { login, logout } from "./login";
import "@babel/polyfill";
import { displayMap } from "./mapbox";
import { updateSettings } from "../js/updateSettings"
import { bookTour } from "./stripe";
// DOM Elements
const mapBox = document.getElementById("map");
const loginForm = document.querySelector(".form--login");
const logoutBtn = document.querySelector('.nav__el--logout');
const userDataForm = document.querySelector('.form-user-data')
const userPasswordForm = document.querySelector('.form-user-password');
const bookBtn = document.getElementById('book-tour');
//DELEGATION
if (mapBox) {
  const locations = JSON.parse(mapBox.dataset.locations);
  displayMap(locations);
}

if (loginForm) {
  loginForm.addEventListener("submit", el => {
    //VALUES
    el.preventDefault(); /* prevents the form from re-loading any other page*/
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    login(email, password)
  })
}

// want to listen all the events happening on that button when there is a click
if(logoutBtn) {
  logoutBtn.addEventListener('click', logout)
}

//userData form filling
if(userDataForm) {
  
  userDataForm.addEventListener('submit', e => {
    e.preventDefault();
    const form = new FormData()
    form.append('name', document.getElementById('name').value)
    form.append('email', document.getElementById('email').value)
    form.append('photo', document.getElementById('photo').files[0])
    console.log(form,'form');
    updateSettings(form,'data');
  })
}
// else if(!userDataForm ){
//   console.log(true);
// }

if (userPasswordForm) {
  debugger;
  userPasswordForm.addEventListener("submit", async (es) => {
    es.preventDefault();
    document.querySelector('.btn--save-password').textContent = 'Updating...'

    const passwordCurrent = document.getElementById("password-current").value;
    const password = document.getElementById("password").value;
    const passwordConfirm = document.getElementById("password-confirm").value;
    await updateSettings(
      { passwordCurrent, password, passwordConfirm },
      "password"
    );
  });

  document.querySelector('.btn--save-password').textContent ='Save password';
  document.getElementById('password-current').value ='';
  document.getElementById('password').value ='';
  document.getElementById('password-confirm').value ='';
}

if(bookBtn) {
  bookBtn.addEventListener('click', e => {
    e.target.textContent = 'Processing...'
    const {tourId} = e.target.dataset;
    bookTour(tourId)
  })
}
