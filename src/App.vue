<template>
    <div id="app">
        <router-view />
    </div>
</template>

<script>
export default {
    mounted() {
        this.$api.menu.update().then();
    }
};
</script>

<style>

</style>
