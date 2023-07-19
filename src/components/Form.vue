<script setup>
defineProps(["name", "codename", "id"]);
defineEmits([]);
</script>

<template>
    <div class="form">
        <label :for="id">{{ name }}</label>
        <textarea :name="codename" :id="id"></textarea>
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