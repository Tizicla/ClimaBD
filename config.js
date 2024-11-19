
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.21.0/firebase-app.js';
import {  getDatabase, ref, set, get, child  } from 'https://www.gstatic.com/firebasejs/9.21.0/firebase-database.js';

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBFIhz4mRKibRgzy4Om4W20liXeCUt-r74",
  authDomain: "sensorth-c671d.firebaseapp.com",
  databaseURL: "https://sensorth-c671d-default-rtdb.firebaseio.com",
  projectId: "sensorth-c671d",
  storageBucket: "sensorth-c671d.appspot.com",
  messagingSenderId: "622485340485",
  appId: "1:622485340485:web:ab540b4d37129c9e3cfe2c"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const dbRef = ref(db);


//READ VALUES ------------------------------------------------------
export async function readfocos() {
    try {
        const focosSnapshot = await get(child(dbRef, "focos"));

        if (focosSnapshot.exists()) {
            return(focosSnapshot.val());
        } else {
            console.log("No data available for 'focos'");
            return [];
        }
    } catch (error) {
        console.error("Error reading data:", error);
        return [];
    }
}

export async function readsensor() {
    try {
        const sensorSnapshot = await get(child(dbRef, "sensor"));

        if (sensorSnapshot.exists()) {
            return sensorSnapshot.val();
        } else {
            console.log("No data available for 'sensor'");
            return [];
        }
    } catch (error) {
        console.error("Error reading data:", error);
        return [];
    }
}

export async function readhist() {
    try {
        const sensorHistSnapshot = await get(child(dbRef, "sensorHist"));

        if (sensorHistSnapshot.exists()) {
            return sensorHistSnapshot.val();
        } else {
            console.log("No data available for 'sensorHist'");
            return [];
        }
    } catch (error) {
        console.error("Error reading data:", error);
        return [];
    }
}

export async function readData() {
    try {
        const focosData = await readfocos();
        const sensorData = await readsensor();
        const sensorHistData = await readhist();

        console.log("Focos:", focosData);
        console.log("Sensor:", sensorData);
        console.log("Sensor History:", sensorHistData);
    } catch (error) {
        console.error("Error reading data:", error);
    }
}


//WRITE FOCO VALUES ---------------------------------------------------
export async function turnOff(foconum) {
    try {
        // Set the specified foco to 'off'
        await set(ref(db, `focos/${foconum}`), 'off');
        console.log(`${foconum} is turned off`);
    } catch (error) {
        console.error(`Error turning off ${foconum}:`, error);
    }
}

export async function turnOn(foconum) {
    try {
        // Set the specified foco to 'on'
        await set(ref(db, `focos/${foconum}`), 'on');
        console.log(`${foconum} is turned on`);
    } catch (error) {
        console.error(`Error turning on ${foconum}:`, error);
    }
}



// readData()





