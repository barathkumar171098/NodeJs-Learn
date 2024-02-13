// need to update the user data fn

/* eslint-disable */
import axios from "axios";
import { showAlert } from "./alerts";

export const updateSettings = async (data, type) => {
  try {
    console.log('1');
    const url =
      type === "password"
        ? "http://localhost:3200/api/v1/users/updateMyPassword"
        : "http://localhost:3200/api/v1/users/updateMe";
    console.log(true);
    console.log(type, 'typeee');

    const res = await axios({
      method: "PATCH",
      url,
      data
    });
    console.log('3');

    console.log(res.data);
    if(res.data.status === 'Success'){
        showAlert('success', `${type.toUpperCase()} updated successfully!`)
    }
    console.log('4');
  } catch (err) {
    console.log(err);
    showAlert("error", err.response.data.message);
  }
};
