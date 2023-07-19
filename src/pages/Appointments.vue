<script setup>
import { onMounted, reactive, onUnmounted, ref } from "vue";
import ListComponent from "@/components/List.vue";

const lists = reactive({
    actual: [],
    suggested: [],
    doctors: [],
    patients: [],
    lastUpdate: -1,
    inited: "0"
});

const activeCard = ref(undefined);

async function sync() {
    let json = await (
        await fetch("https://api.crwnd.dev/test-task-api/get-data", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded", },
            body: new URLSearchParams({
                last_update: lists.lastUpdate,
                inited: lists.inited
            }),
        })
    ).json();
    if (json.ok === true) {
        if (lists.inited === "0" || lists.lastUpdate !== json.lastUpdate) {
            lists.actual = json.actual;
            lists.suggested = json.suggested;
            lists.doctors = json.doctors;
            lists.patients = json.patients;
            lists.lastUpdate = json.lastUpdate;
            lists.inited = "1";
        }
    } else
        alert("Failed to get data");
}
let intervalID = -1;
onMounted(async () => {
    sync();
    intervalID = setInterval(sync, 5000);
});
onUnmounted(async () => {
    clearInterval(intervalID);
});
</script>

<template>
    <div id="main-page-content">
        <h1>Appointments</h1>
        <div id="main-page-content__two-lists">
            <ListComponent id="actual" name="actual" codename="actual" :list="lists.actual" />
            <ListComponent id="suggested" name="suggested" codename="suggested" :list="lists.suggested"
                @openCard="(index) => activeCard = index" :openButton="true" :counter="true" />
        </div>
        <div id="main-page-content__actions">
            <RouterLink to="/"><button type="submit">Insert page</button></RouterLink>
            <button>Apply</button>
        </div>
    </div>
    <div class="modal-response" id="modal-delete-response" v-if="activeCard !== undefined" @click="activeCard = undefined">
        <div class="modal-response__content" id="modal-delete-response__content" @click.stop="">
            <span>Card:</span>
            <p>Patient: {{
                lists.patients.find(patient => patient.id === lists.suggested[activeCard].patient).id +
                (lists.patients.find(patient => patient.id === lists.suggested[activeCard].patient).name ?
                    ", " + lists.patients.find(patient => patient.id === lists.suggested[activeCard].patient).name : "") +
                (lists.patients.find(patient => patient.id === lists.suggested[activeCard].patient).dob ?
                    ", " + lists.patients.find(patient => patient.id === lists.suggested[activeCard].patient).dob : "")
            }}</p>
            <p>Doctor: {{
                lists.doctors.find(doctor => doctor.id === lists.suggested[activeCard].doctor).id +
                (lists.doctors.find(doctor => doctor.id === lists.suggested[activeCard].doctor).name ?
                    ", " + lists.doctors.find(doctor => doctor.id === lists.suggested[activeCard].doctor).name : "") +
                (lists.doctors.find(doctor => doctor.id === lists.suggested[activeCard].doctor).dob ?
                    ", " + lists.doctors.find(doctor => doctor.id === lists.suggested[activeCard].doctor).dob : "")
            }}</p>
            <p>Appointment: {{ lists.suggested[activeCard].hour || "hour not set" }}</p>
        </div>
    </div>
</template>

<style scoped>
#main-page-content__two-lists {
    display: flex;
    flex-direction: row;
}
</style>