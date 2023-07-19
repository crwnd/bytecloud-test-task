<script setup>
import { RouterView } from "vue-router";
</script>

<template>
	<div id="page-content">
		<RouterView />
	</div>
</template>

<style>
#page-content {
	height: 100%;
	width: 100%;
	max-width: 1600px;
	flex-direction: column;
	align-items: center;
	justify-content: center;
}
</style>
