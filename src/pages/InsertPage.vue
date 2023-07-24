<script setup>
import { ref, reactive } from "vue";
import FormComponent from "@/components/Form.vue";
import { RouterLink } from "vue-router";
const modalInsertShow = ref(false);
const modalDeleteShow = ref(false);
const insertResponse = reactive({
  patients: {
    success: [],
    wrongFormat: [],
    duplicates: [],
  },
  doctors: {
    success: [],
    wrongFormat: [],
    duplicates: [],
  },
  appointments: {
    success: [],
    wrongFormat: [],
    duplicates: []
  }
});
const deleteResponse = reactive({
  patients: -1,
  doctors: -1,
  appointments: -1
});


async function sendData(submitEvent) {
  let patients = submitEvent.target.elements["patients"].value.trim().split("\n");
  let doctors = submitEvent.target.elements["doctors"].value.trim().split("\n");
  let appointments = submitEvent.target.elements["appointments"].value.trim().split("\n");

  // console.log("sendData");
  // console.log("patients", patients);
  // console.log("doctors", doctors);
  // console.log("appointments", appointments);
  let json = await (
    await fetch("https://api.crwnd.dev/test-task-api/submit-data", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded", },
      body: new URLSearchParams({
        patients: JSON.stringify(patients),
        doctors: JSON.stringify(doctors),
        appointments: JSON.stringify(appointments),
      }),
    })
  ).json();
  if (json.ok === true) {
    insertResponse.patients = json.patients;
    insertResponse.doctors = json.doctors;
    insertResponse.appointments = json.appointments;
    modalInsertShow.value = true;
    submitEvent.target.elements["patients"].value = "";
    submitEvent.target.elements["doctors"].value = "";
    submitEvent.target.elements["appointments"].value = "";
  } else
    alert("Failed to send data");
}
async function resetData() {
  let json = await (
    await fetch("https://api.crwnd.dev/test-task-api/reset-data", { method: "POST", })
  ).json();
  if (json.ok === true) {
    deleteResponse.patients = json.patients;
    deleteResponse.doctors = json.doctors;
    deleteResponse.appointments = json.appointments;
    modalDeleteShow.value = true;
  } else
    alert("Failed to reset data");

}
</script>

<template>
  <h1>Insert data</h1>
  <div id="main-page-content">
    <form @submit.prevent="sendData" @reset.prevent="resetData">
      <div id="main-page-content__forms">
        <FormComponent name="Patients" codename="patients" id="patients-form" />
        <FormComponent name="Doctors" codename="doctors" id="doctors-form" />
        <FormComponent name="Appointments" codename="appointments" id="appointments-form" />
      </div>
      <div id="main-page-content__actions">
        <RouterLink to="/appointments"><button type="submit">Appointments</button></RouterLink>
        <button type="submit">Send data</button>
        <button type="reset">Clear DB</button>
      </div>
    </form>
  </div>
  <div class="modal-response" id="modal-insert-response" v-if="modalInsertShow" @click="modalInsertShow = false">
    <div class="modal-response__content" id="modal-insert-response__content" @click.stop="">
      <span>Insert response:</span>
      <p v-if="insertResponse.patients.success.length > 0">Successful patients: {{
              insertResponse.patients.success.length
              }}</p>
      <span v-for="el in insertResponse.patients.success">
        {{ el }}
      </span>
      <p v-if="insertResponse.doctors.success.length > 0">Successful doctors: {{ insertResponse.doctors.success.length }}
      </p>
      <span v-for="el in insertResponse.doctors.success">
        {{ el }}
      </span>
      <p v-if="insertResponse.appointments.success.length > 0">Successful appointments: {{
              insertResponse.appointments.success.length }}
      </p>
      <span v-for="el in insertResponse.appointments.success">
        {{ el }}
      </span>
      <p v-if="insertResponse.patients.wrongFormat.length > 0">Wrong format patients: {{
              insertResponse.patients.wrongFormat.length }}</p>
      <span v-for="el in insertResponse.patients.wrongFormat">
        {{ el }}
      </span>
      <p v-if="insertResponse.doctors.wrongFormat.length > 0">Wrong format doctors: {{
              insertResponse.doctors.wrongFormat.length
              }}</p>
      <span v-for="el in insertResponse.doctors.wrongFormat">
        {{ el }}
      </span>
      <p v-if="insertResponse.appointments.wrongFormat.length > 0">Wrong format appointments: {{
              insertResponse.appointments.wrongFormat.length }}</p>
      <span v-for="el in insertResponse.appointments.wrongFormat">
        {{ el }}
      </span>
      <p v-if="insertResponse.patients.duplicates.length > 0">Duplicates patients: {{
              insertResponse.patients.duplicates.length }}</p>
      <span v-for="el in insertResponse.patients.duplicates">
        {{ el }}
      </span>
      <p v-if="insertResponse.doctors.duplicates.length > 0">Duplicates doctors: {{
              insertResponse.doctors.duplicates.length }}</p>
      <span v-for="el in insertResponse.doctors.duplicates">
        {{ el }}
      </span>
      <p v-if="insertResponse.appointments.duplicates.length > 0">Duplicates appointments: {{
              insertResponse.appointments.duplicates.length }}</p>
      <span v-for="el in insertResponse.appointments.duplicates">
        {{ el }}
      </span>
    </div>
  </div>
  <div class="modal-response" id="modal-delete-response" v-if="modalDeleteShow" @click="modalDeleteShow = false">
    <div class="modal-response__content" id="modal-delete-response__content" @click.stop="">
      <span>Data reset response:</span>
      <p>Patients deleted: {{ deleteResponse.patients }}</p>
      <p>Doctors deleted: {{ deleteResponse.doctors }}</p>
      <p>Appointments deleted: {{ deleteResponse.appointments }}</p>
    </div>
  </div>
</template>

<style scoped>
#main-page-content {
  width: 100%;
  max-width: 1600px;
  display: flex;
  flex-direction: column;
}

#main-page-content__forms {
  width: 100%;
  height: 500px;
  display: flex;
  flex-direction: row;
  gap: 12px;
  align-items: center;
  justify-content: center;
}

#main-page-content__forms>div {
  width: calc(100% / 3);
  height: inherit;
}
</style>