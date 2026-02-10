import listEndpoints from "express-list-endpoints";

export const printRoutes = (app) => {
  const routes = listEndpoints(app);

  console.log("\n📦 REGISTERED ROUTES\n");
  routes.forEach((route) => {
    route.methods.forEach((method) => {
      console.log(`${method.padEnd(6)} ${route.path}`);
    });
  });
  console.log("\n");
};

export const routesAsJson = (app) => {
  return listEndpoints(app).map((route) => ({
    path: route.path,
    methods: route.methods,
    middlewares: route.middlewares,
  }));
};
