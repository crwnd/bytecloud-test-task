'use strict';
import express from 'express';
import mongoose from 'mongoose';
import compression from 'compression';
import * as dotenv from 'dotenv';
import lodash from 'lodash';
dotenv.config({ path: './server/.env', });

console.log("connecting to mongodb...");
mongoose.set("debug", true);
mongoose.set("strictQuery", true);
mongoose.connect(process.env.MONGO_LINK || "", { useNewUrlParser: true, useUnifiedTopology: true, dbName: "test", });
const db = mongoose.connection;
db.on("error", () => console.error.bind(console, "connection error: "));
db.once("open", () => console.log("Connected successfully"));

const Schema = mongoose.Schema;

const userSchema = new Schema({
    id: { type: Number, unique: true },
    hours: [Number],
    dob: String,
    name: String,
});
const appointmentsSchema = new Schema({
    patient: Number,
    doctor: Number,
    hour: Number,
});
let Patients = mongoose.model("patients", userSchema);
let Doctors = mongoose.model("doctors", userSchema);
let Appointments = mongoose.model("appointments", appointmentsSchema);

const PORT = 3128;
const app = express();
let lastUpdate = -1;
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(function (req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', '*')
    next();
});

const arrayRange = (start, stop) =>
    Array.from(
        { length: (stop - start) + 1 },
        (value, index) => start + index
    );

function isDate(day, month, year) {
    if (day == 0) {
        return false;
    }
    switch (month) {
        case 1: case 3: case 5: case 7: case 8: case 10: case 12:
            if (day > 31)
                return false;
            return true;
        case 2:
            if (year % 4 == 0)
                if (day > 29) {
                    return false;
                }
                else {
                    return true;
                }
            if (day > 28) {
                return false;
            }
            return true;
        case 4: case 6: case 9: case 11:
            if (day > 30) {
                return false;
            }
            return true;
        default:
            return false;
    }
}
const DDMMYYY_Validation = (input) => {
    const reg = /^([0-9]{2})\.([0-9]{2})\.([0-9]{4})$/;
    return (!!input?.match(reg)) && isDate(parseInt(input?.match(reg)[1]), parseInt(input?.match(reg)[2]), parseInt(input?.match(reg)[3]));
}
const onlyLettersAndSpaces = (str) => {
    return Boolean(str?.match(/^(?:\b[a-zA-Z]+\b|\b[a-zA-Z]+\s[a-zA-Z]+\b)$/gm));
}
const isWorkingHours = (str) => {
    const parts = str?.split("-").map(el => parseInt(el));
    return (parts[0] <= parts[1] && parts[0] >= 0 && parts[1] >= 0 && parts[0] <= 23 && parts[1] <= 23);
}

function isJson(str) {
    try {
        JSON.parse(str);
    } catch (e) {
        return false;
    }
    return true;
}

app.post('/submit-data', async (req, res) => {
    try {
        console.info("/submit-data requested");
        if (!req.body.patients || !req.body.doctors || !req.body.appointments)
            return res.json({ ok: false, error: "not enough params" });

        let patients = [];
        if (isJson(req.body.patients)) {
            console.info("req.body.patients is json");
            patients = JSON.parse(req.body.patients).filter(el => el !== undefined).map(el => {
                if (el === "") return;
                let data = el.split(", ");
                if (data.length < 2 || data.length > 4)
                    return { ok: false, reason: "wrong-arguments", string: el, };
                if (!isWorkingHours(data[1]))
                    return { ok: false, reason: "wrong-time", string: el, };
                let dob = undefined;
                let name = undefined;
                if (data[2] !== undefined) {
                    if (!DDMMYYY_Validation(data[2]) && !onlyLettersAndSpaces(data[2]))
                        return { ok: false, reason: "wrong-arguments", string: el, };
                    if (DDMMYYY_Validation(data[2]))
                        dob = data[2];
                    else
                        name = data[2];
                }
                if (data[3] !== undefined) {
                    if (!DDMMYYY_Validation(data[3]) && !onlyLettersAndSpaces(data[3]))
                        return { ok: false, reason: "wrong-arguments", string: el, };
                    if (DDMMYYY_Validation(data[3]))
                        if (dob !== undefined)
                            return { ok: false, reason: "wrong-arguments", string: el, };
                        else
                            dob = data[3];
                    else
                        if (name !== undefined)
                            return { ok: false, reason: "wrong-arguments", string: el, };
                        else
                            name = data[3];
                }
                return {
                    ok: true,
                    id: parseInt(data[0]),
                    hours: arrayRange(parseInt(data[1].split("-")[0]), parseInt(data[1].split("-")[1]) - 1),
                    dob: dob,
                    name: name,
                    string: el,
                };
            }).filter(el => el !== undefined);
            if (patients.length > 0) {
                console.log("patients", patients);
                let patientsAlreadyInDB = await Patients.find({ id: { $in: patients.map(el => el.id) } });
                patients = patients.map(patient => { return !patientsAlreadyInDB.some(el => el.id === patient.id) ? patient : Object.assign({}, patient, { ok: false, reason: "duplicate" }) });
                await Patients.insertMany(patients.filter(el => el.ok === true).map(el => { return { id: el.id, hours: el.hours, dob: el.dob, name: el.name } }));
            }
        }

        let doctors = [];
        if (isJson(req.body.doctors)) {
            doctors = JSON.parse(req.body.doctors).filter(el => el !== undefined).map(el => {
                if (el === "") return;
                let data = el.split(", ");
                if (data.length < 2 || data.length > 4)
                    return { ok: false, reason: "wrong-arguments", string: el, };
                if (!isWorkingHours(data[1]))
                    return { ok: false, reason: "wrong-time", string: el, };
                let dob = undefined;
                let name = undefined;
                if (data[2] !== undefined) {
                    if (!DDMMYYY_Validation(data[2]) && !onlyLettersAndSpaces(data[2]))
                        return { ok: false, reason: "wrong-arguments", string: el, };
                    if (DDMMYYY_Validation(data[2]))
                        dob = data[2];
                    else
                        name = data[2];
                }
                if (data[3] !== undefined) {
                    if (!DDMMYYY_Validation(data[3]) && !onlyLettersAndSpaces(data[3]))
                        return { ok: false, reason: "wrong-arguments", string: el, };
                    if (DDMMYYY_Validation(data[3]))
                        if (dob !== undefined)
                            return { ok: false, reason: "wrong-arguments", string: el, };
                        else
                            dob = data[3];
                    else
                        if (name !== undefined)
                            return { ok: false, reason: "wrong-arguments", string: el, };
                        else
                            name = data[3];
                }
                return {
                    ok: true,
                    id: parseInt(data[0]),
                    hours: arrayRange(parseInt(data[1].split("-")[0]), parseInt(data[1].split("-")[1]) - 1),
                    dob: dob,
                    name: name,
                    string: el,
                };
            }).filter(el => el !== undefined);
            if (doctors.length > 0) {
                let doctorsAlreadyInDB = await Doctors.find({ id: { $in: doctors.map(el => el.id) } });
                doctors = doctors.map(doctor => { return !doctorsAlreadyInDB.some(el => el.id === doctor.id) ? doctor : Object.assign({}, doctor, { ok: false, reason: "duplicate" }) });
            }
        }

        await Doctors.insertMany(doctors.filter(el => el.ok === true).map(el => { return { id: el.id, hours: el.hours, dob: el.dob, name: el.name } }));
        // console.log("doctors", doctors);
        let appointments = [];
        if (isJson(req.body.appointments)) {
            appointments = JSON.parse(req.body.appointments).filter(el => el !== undefined).map(el => {
                if (el === "") return;
                let data = el.split(", ");
                if (data.length < 2 || data.length > 3)
                    return { ok: false, reason: "wrong-arguments", string: el, };
                if (data[2] && (parseInt(data[2]) > 24 || parseInt(data[2]) < 0))
                    return { ok: false, reason: "wrong-format", string: el, };
                return {
                    ok: true,
                    patient: parseInt(data[0]),
                    doctor: parseInt(data[1]),
                    hour: data[2] ? parseInt(data[2]) : undefined,
                    string: el,
                };
            }).filter(el => el !== undefined);
            if (appointments.length > 0) {
                let appointmentsAlreadyInDB = await Appointments.find({ $or: appointments.map(appointment => { return { patient: appointment.patient, doctor: appointment.doctor, hour: appointment.hour } }) });
                appointments = appointments.map(appointment => { return !appointmentsAlreadyInDB.some(el => el.patient === appointment.patient && el.doctor === appointment.doctor && el.hour === appointment.hour) ? appointment : Object.assign({}, appointment, { ok: false, reason: "duplicate" }) });
                await Appointments.insertMany(appointments.filter(el => el.ok === true).map(el => { return { patient: el.patient, doctor: el.doctor, hour: el.hour } }));
            }
        }
        // console.log("appointments", appointments);

        lastUpdate = new Date().valueOf();

        return res.json({
            ok: true,
            patients: {
                success: patients.filter(el => el.ok === true).map(el => el.string) || [],
                wrongFormat: patients.filter(el => el.ok === false && el.reason !== "duplicate").map(el => el.string) || [],
                duplicates: patients.filter(el => el.ok === false && el.reason === "duplicate").map(el => el.string) || [],
            },
            doctors: {
                success: doctors.filter(el => el.ok === true).map(el => el.string) || [],
                wrongFormat: doctors.filter(el => el.ok === false && el.reason !== "duplicate").map(el => el.string) || [],
                duplicates: doctors.filter(el => el.ok === false && el.reason === "duplicate").map(el => el.string) || [],
            },
            appointments: {
                success: appointments.filter(el => el.ok === true).map(el => el.string) || [],
                wrongFormat: appointments.filter(el => el.ok === false && el.reason !== "duplicate").map(el => el.string) || [],
                duplicates: appointments.filter(el => el.ok === false && el.reason === "duplicate").map(el => el.string) || [],
            },
        });
    }
    catch (ex) {
        console.error("[ERROR] /submit-data: ", ex);
        return res.json({ ok: false, patients: { success: [], wrongFormat: [], duplicates: [], }, doctors: { success: [], wrongFormat: [], duplicates: [], }, appointments: { success: [], wrongFormat: [], duplicates: [], }, });
    }
});

function optimizeAppointments(actual, doctors, patients) {
    let suggested = [];

    suggested = lodash.cloneDeep(actual);

    let changesMade = true;
    let iter = 0;
    while (changesMade && iter++ <= 1000) {
        changesMade = false;
        for (let i = 0; i < suggested.length; i++) {
            // console.log("i", i);
            // console.log("suggested[i]", suggested[i]);

            if (suggested[i].status === "green" || suggested[i].status === "blue") { continue; }
            let patientHours = patients.find(el => el.id === suggested[i].patient)?.hours || [];
            // console.log("patientHours", patientHours);
            let doctorHours = doctors.find(el => el.id === suggested[i].doctor)?.hours || [];
            // console.log("doctorHours", doctorHours);
            // Doctor has free hours?
            let doctorHoursLeft = doctorHours.filter(hour => patientHours.includes(hour)).filter(hour => suggested.some(el => el.doctor === suggested[i].doctor && el.hour !== hour)) || [];
            // console.log("doctorHoursLeft", doctorHoursLeft);
            if (doctorHoursLeft.length > 0) {
                let patientAlsoFreeHours =
                    doctorHoursLeft.filter(doctorHourLeft => {
                        return !suggested.some(el => el.patient === suggested[i].patient && el.hour === doctorHourLeft && el.doctor !== suggested[i].doctor)
                    }) || [];
                // console.log("patientAlsoFreeHours", patientAlsoFreeHours);
                if (patientAlsoFreeHours.length === 0) {
                    suggested[i].status = "red";
                    suggested[i].hour = undefined;
                    changesMade = true;
                    continue;
                }
                suggested[i].status = "blue";
                suggested[i].hour = patientAlsoFreeHours[0];
                changesMade = true;
                continue;
            }
        }
    }

    return suggested;
}

app.post('/get-data', async (req, res) => {
    console.info("/get-data requested");
    let response = {
        ok: false,
        patients: [],
        doctors: [],
        actual: [],
        suggested: [],
        lastUpdate: lastUpdate
    };
    try {
        if (parseInt(req.body.last_update) === lastUpdate && req.body.inited === "1") {
            console.log("update skipped");
            response.ok = true;
            return res.json(response);
        }

        response.patients = await Patients.find({}, ["-_id", "-__v"]);
        response.doctors = await Doctors.find({}, ["-_id", "-__v"]);
        let appointments = await Appointments.find({});
        console.info("patients: ", response.patients);
        console.info("doctors: ", response.doctors);
        console.info("appointments: ", appointments);
        appointments.forEach(appointment => {
            // console.log("appointment", appointment);
            const patient = response.patients.find(el => el.id === appointment.patient);
            // console.log("patient", patient);
            const doctor = response.doctors.find(el => el.id === appointment.doctor);
            // console.log("doctor", doctor);
            let status = undefined;
            if (status === undefined && (!patient || !doctor))
                status = "red";
            if (status === undefined && !(patient.hours || []).includes(appointment.hour))
                status = "red";
            if (status === undefined && !(doctor.hours || []).includes(appointment.hour))
                status = "red";
            if (status === undefined && appointments.filter(el => el.hour === appointment.hour && (el.patient === appointment.patient || el.doctor === appointment.doctor)).length > 1)
                status = "yellow";
            response.actual.push({ status: status || "green", patient: appointment.patient, doctor: appointment.doctor, hour: appointment.hour });
        });

        console.time("optimizeAppointments");

        response.suggested = optimizeAppointments(response.actual, response.doctors, response.patients);


        console.timeEnd("optimizeAppointments");

        // console.log("response", response);
        response.ok = true;
        return res.json(response);
    }
    catch (ex) {
        console.error("[ERROR] /get-data: ", ex);
        return response;
    }
});

app.post('/apply-suggested-changes', async (req, res) => {
    try {
        let response = {
            ok: false,
            patients: [],
            doctors: [],
            actual: [],
            suggested: [],
            lastUpdate: lastUpdate
        };

        if (parseInt(req.body.last_update) === lastUpdate && req.body.inited === "1") {
            // console.log("update skipped");
            return res.json(response);
        }

        response.patients = await Patients.find({}, ["-_id", "-__v"]);
        response.doctors = await Doctors.find({}, ["-_id", "-__v"]);
        let appointments = await Appointments.find({});
        appointments.forEach(appointment => {
            // console.log("appointment", appointment);
            const patient = response.patients.find(el => el.id === appointment.patient);
            // console.log("patient", patient);
            const doctor = response.doctors.find(el => el.id === appointment.doctor);
            // console.log("doctor", doctor);
            let status = undefined;
            if (status === undefined && (!patient || !doctor))
                status = "red";
            if (status === undefined && !(patient.hours || []).includes(appointment.hour))
                status = "red";
            if (status === undefined && !(doctor.hours || []).includes(appointment.hour))
                status = "red";
            if (status === undefined && appointments.filter(el => el.hour === appointment.hour && (el.patient === appointment.patient || el.doctor === appointment.doctor)).length > 1)
                status = "yellow";
            response.actual.push({ status: status || "green", patient: appointment.patient, doctor: appointment.doctor, hour: appointment.hour });
        });

        response.suggested = optimizeAppointments(response.actual, response.doctors, response.patients);

        try {
            await Appointments.deleteMany({});
            await Appointments.insertMany(response.suggested.filter(el => el.status !== "red"));
            lastUpdate = new Date().valueOf();
        }
        catch (e) {
            return res.json({ ok: false });
        }

        // console.log("response", response);
        return res.json({ ok: true });
    } catch (ex) {
        console.error("[ERROR] /apply-suggested-changes: ", ex);
        return res.json({ ok: true });
    }
});

app.post('/reset-data', async (req, res) => {
    try {
        lastUpdate = new Date().valueOf();
        return res.json({ ok: true, patients: (await Patients.deleteMany({})).deletedCount, doctors: (await Doctors.deleteMany({})).deletedCount, appointments: (await Appointments.deleteMany({})).deletedCount });
    } catch (ex) {
        console.error("[ERROR] /reset-data: ", ex);
        return res.json({ ok: false, patients: 0, doctors: 0, appointments: 0 });
    }
});

app.use('/', (req, res) => res.status(404).json({ ok: false, error: "unknown method" }));

app.listen(PORT, () => console.log('SERVER IS UP ON PORT:', PORT));