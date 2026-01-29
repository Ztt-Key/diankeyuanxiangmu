<template>
  <div class="animated fadeIn">
    <big-count v-for="(item, idx) in numList" :key="'count' + idx" v-bind="item"></big-count>
  </div>
</template>

<script>
  import bigCount from './common/bicCount.vue';
  export default {
    name: 'Top',
    components: {
      bigCount
    },
    data: () => ({
      numList: [
        { title: '新增人口', value: 320, num: -8.65 },
        { title: '新增企业', value: 251, num: 200 },
        { title: '新增税收', value: 862, num: 7.69 }
      ]
    })
  };
</script>

<style></style>
