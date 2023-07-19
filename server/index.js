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

const DDMMYYY_Validation = (input) => {
    var reg = /(0[1-9]|[12][0-9]|3[01])[- /.](0[1-9]|1[012])[- /.](19|20)\d\d/;
    return !!input?.match(reg);
}
function onlyLettersAndSpaces(str) {
    return Boolean(str?.match(/^[A-Za-z\s]*$/));
}

app.post('/submit-data', async (req, res) => {
    if (!req.body.patients || !req.body.doctors || !req.body.appointments)
        return res.json({ ok: false, error: "not enough params" });

    let patients = JSON.parse(req.body.patients).map(el => {
        if (el === "") return;
        let data = el.split(", ");
        if (data.length < 2 || data.length > 4)
            return { ok: false, reason: "wrong-arguments", string: el, };
        if (parseInt(data[1].split("-")[0]) < 0 || parseInt(data[1].split("-")[0]) >= 24 || parseInt(data[1].split("-")[1]) < 0 || parseInt(data[1].split("-")[1]) >= 24 || parseInt(data[1].split("-")[0]) > parseInt(data[1].split("-")[1]))
            return { ok: false, reason: "wrong-time", string: el, };
        if (onlyLettersAndSpaces(data[2]) && data[2].trim().split(" ").length - 1 > 1)
            return { ok: false, reason: "wrong-name", string: el, };
        if (onlyLettersAndSpaces(data[3]) && data[3].trim().split(" ").length - 1 > 1)
            return { ok: false, reason: "wrong-name", string: el, };
        return {
            ok: true,
            id: parseInt(data[0]),
            hours: arrayRange(parseInt(data[1].split("-")[0]), parseInt(data[1].split("-")[1]) - 1),
            dob: (DDMMYYY_Validation(data[2]) ? data[2] : undefined) || (DDMMYYY_Validation(data[3]) ? data[3] : undefined),
            name: (onlyLettersAndSpaces(data[2]) ? data[2] : undefined) || (onlyLettersAndSpaces(data[3]) ? data[3] : undefined),
            string: el,
        };
    });
    let patientsAlreadyInDB = await Patients.find({ id: { $in: patients.map(el => el.id) } });
    patients = patients.map(patient => { return !patientsAlreadyInDB.some(el => el.id === patient.id) ? patient : Object.assign({}, patient, { ok: false, reason: "duplicate" }) });
    await Patients.insertMany(patients.filter(el => el.ok === true).map(el => { return { id: el.id, hours: el.hours, dob: el.dob, name: el.name } }));
    // console.log("patients", patients);

    let doctors = JSON.parse(req.body.doctors).map(el => {
        if (el === "") return;
        let data = el.split(", ");
        if (data.length < 2 || data.length > 4)
            return { ok: false, reason: "wrong-arguments", string: el, };
        if (parseInt(data[1].split("-")[0]) < 0 || parseInt(data[1].split("-")[0]) >= 24 || parseInt(data[1].split("-")[1]) < 0 || parseInt(data[1].split("-")[1]) >= 24 || parseInt(data[1].split("-")[0]) > parseInt(data[1].split("-")[1]))
            return { ok: false, reason: "wrong-time", string: el, };
        if (onlyLettersAndSpaces(data[2]) && data[2].trim().split(" ").length - 1 > 1)
            return { ok: false, reason: "wrong-name", string: el, };
        if (onlyLettersAndSpaces(data[3]) && data[3].trim().split(" ").length - 1 > 1)
            return { ok: false, reason: "wrong-name", string: el, };
        return {
            ok: true,
            id: parseInt(data[0]),
            hours: arrayRange(parseInt(data[1].split("-")[0]), parseInt(data[1].split("-")[1]) - 1),
            dob: (DDMMYYY_Validation(data[2]) ? data[2] : undefined) || (DDMMYYY_Validation(data[3]) ? data[3] : undefined),
            name: (onlyLettersAndSpaces(data[2]) ? data[2] : undefined) || (onlyLettersAndSpaces(data[3]) ? data[3] : undefined),
            string: el,
        };
    });
    let doctorsAlreadyInDB = await Doctors.find({ id: { $in: doctors.map(el => el.id) } });
    doctors = doctors.map(doctor => { return !doctorsAlreadyInDB.some(el => el.id === doctor.id) ? doctor : Object.assign({}, doctor, { ok: false, reason: "duplicate" }) });

    await Doctors.insertMany(doctors.filter(el => el.ok === true).map(el => { return { id: el.id, hours: el.hours, dob: el.dob, name: el.name } }));
    // console.log("doctors", doctors);
    let appointments = JSON.parse(req.body.appointments).map(el => {
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
    });
    let appointmentsAlreadyInDB = await Appointments.find({ $or: appointments.map(appointment => { return { patient: appointment.patient, doctor: appointment.doctor, hour: appointment.hour } }) });
    appointments = appointments.map(appointment => { return !appointmentsAlreadyInDB.some(el => el.patient === appointment.patient && el.doctor === appointment.doctor && el.hour === appointment.hour) ? appointment : Object.assign({}, appointment, { ok: false, reason: "duplicate" }) });
    await Appointments.insertMany(appointments.filter(el => el.ok === true).map(el => { return { patient: el.patient, doctor: el.doctor, hour: el.hour } }));
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
});

app.post('/get-data', async (req, res) => {
    let response = {
        ok: true,
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

    response.suggested = lodash.cloneDeep(response.actual);

    let changesMade = true;
    while (changesMade) {
        changesMade = false;
        for (let i = 0; i < response.suggested.length; i++) {
            // console.log("i", i);
            // console.log("response.suggested[i]", response.suggested[i]);

            if (response.suggested[i].status === "green" || response.suggested[i].status === "blue") { continue; }
            let patientHours = response.patients.find(el => el.id === response.suggested[i].patient)?.hours || [];
            // console.log("patientHours", patientHours);
            let doctorHours = response.doctors.find(el => el.id === response.suggested[i].doctor)?.hours || [];
            // console.log("doctorHours", doctorHours);
            // Doctor has free hours?
            let doctorHoursLeft = doctorHours.filter(hour => patientHours.includes(hour)).filter(hour => response.suggested.some(el => el.doctor === response.suggested[i].doctor && el.hour !== hour)) || [];
            // console.log("doctorHoursLeft", doctorHoursLeft);
            if (doctorHoursLeft.length > 0) {
                let patientAlsoFreeHours = doctorHoursLeft.filter(doctorHourLeft => {
                    return !response.suggested.some(el => el.patient === response.suggested[i].patient && (el.hour === doctorHourLeft || !(el.hour === doctorHourLeft && el.doctor === response.suggested[i].doctor)))
                }) || [];
                // console.log("patientAlsoFreeHours", patientAlsoFreeHours);
                response.suggested[i].status = "blue";
                response.suggested[i].hour = patientAlsoFreeHours[0];
                changesMade = true;
                continue;
            }
        }
    }

    // console.log("response", response);
    return res.json(response);
});

app.post('/reset-data', async (req, res) => {
    try {
        lastUpdate = new Date().valueOf();
        return res.json({ ok: true, patients: (await Patients.deleteMany({})).deletedCount, doctors: (await Doctors.deleteMany({})).deletedCount, appointments: (await Appointments.deleteMany({})).deletedCount });
    } catch {
        return res.json({ ok: false, patients: 0, doctors: 0, appointments: 0 });
    }
});

app.use('/', (req, res) => res.status(404).json({ ok: false, error: "unknown method" }));

app.listen(PORT, () => console.log('SERVER IS UP ON PORT:', PORT));