import { createRouter, createWebHistory } from "vue-router";

import InsertPage from "../pages/InsertPage.vue";
import AppointmentsPage from "../pages/Appointments.vue";

let router = new createRouter({
	history: createWebHistory(import.meta.env.BASE_URL),
	routes: [
		{
			path: "/",
			name: "Insert",
			component: InsertPage,
		},
		{
			path: "/appointments",
			name: "Appointments",
			component: AppointmentsPage,
		},
	],
});

export default router;
