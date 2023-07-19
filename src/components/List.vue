<script setup>
defineProps(["name", "codename", "id", "list", "open-button", "counter"]);
defineEmits(["openCard"]);

const words = ["Zero", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine"];
</script>

<template>
    <div class="form">
        <label :for="id">{{ name }}</label>
        <ul :name="codename" :id="id">
            <li v-for="(item, index) in list" :style="{ 'background-color': item.status, 'color': 'black' }">{{ item.patient
            }}, {{
    item.doctor }}{{
        ", " +
        (item.hour || "") }} <button v-if="openButton === true" @click="$emit('openCard', index)">Open card</button>
            </li>
        </ul>
        <div v-if="counter === true">
            {{ (list.filter(el => el.status === "green").length < 10 ? words[list.filter(el => el.status === "green").length]
                :
                list.filter(el => el.status === "green").length) + " green appointment" + (list.filter(el => el.status ===
                    "green").length !== 1 ? "s" : "") }}
                {{ (list.filter(el => el.status === "blue").length < 10 ? words[list.filter(el => el.status ===
                    "blue").length] :
                    list.filter(el => el.status === "blue").length) + " blue appointment" + (list.filter(el => el.status
                        ===
                        "blue").length !== 1 ? "s" : "") }}
        </div>
    </div>
</template>

<style scoped>
.form {
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
}

.form label {
    font-size: 18px;
    margin-bottom: 12px;
}

.form textarea {
    width: 100%;
    height: 100%;
}
</style>