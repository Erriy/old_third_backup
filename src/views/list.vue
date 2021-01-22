<template>
    <div>
        <a-button @click="$router.push('/seed')">seed</a-button>
    </div>
</template>

<script>
export default {
    mounted() {
        this.$api.menu.update().then();
    }
}
</script>

<style>

</style>