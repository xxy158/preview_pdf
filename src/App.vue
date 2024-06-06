<template>
  <div id="app" >
      <router-view style="width: 100%;heihgt: 100%;"></router-view>
  </div>
</template>

<script>
export default {
  name: 'App',

  computed: {
    // key() {
    // return this.$route.name !== undefined? this.$route.name +new Date(): this.$route +new Date()
    // }
  },
  mounted(){
  }
  // watch:{
  //   '$route'(to,from){
  //     console.log(to,from)
  //   }
  // }
}
</script>

<style>
#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
  width: 100%;
  height: 100%;
  min-width: 1200px;/*no*/
}
</style>
