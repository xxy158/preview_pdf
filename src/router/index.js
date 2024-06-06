import Vue from "vue";
import Router from "vue-router";
Vue.use(Router);

// 固定的路由表
let fixedRouter = [
  {
    path: "/",
    redirect: {
      name: "pdfView",
    },
  },
  {
    path: "/pdfView",
    name: "pdfView",
    component: (resolve) => require(["../views/Index.vue"], resolve),
    meta: { title: 'pdf预览', roles:["admin"], icon: 'iconfont icon-zhuye icon-menu'},//当前菜单哪些角色可以看到
  }
];


var router = new Router({
  mode: "history",
  base: process.env.BASE_URL,
  routes: fixedRouter,
  scrollBehavior (to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    } else {
      return {
        x: 0,
        y: 0
      }
    }
  }
});
const VueRouterPush = Router.prototype.push;
Router.prototype.push = function push(to) {
  return VueRouterPush.call(this, to).catch((err) => err);
};

router.beforeEach((to, from, next) => {
  console.log("路由名称：" + to.name);
  next();
});

export default router;
