// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBpvhuSBG2lHL3w4BPGZ4f4E8RC_nLkJBw",
  authDomain: "school-organiser-bcb8a.firebaseapp.com",
  projectId: "school-organiser-bcb8a",
  storageBucket: "school-organiser-bcb8a.appspot.com",
  messagingSenderId: "770113233801",
  appId: "1:770113233801:web:cb727aedd8ddc025993758",
  measurementId: "G-YXFBMZD74W",
  databaseURL: "https://school-organiser-bcb8a-default-rtdb.firebaseio.com" // Add this line
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

export { database };