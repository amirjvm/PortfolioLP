import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

export const getRouter = () => {
  const queryClient = new QueryClient();

  const router = createRouter({
    routeTree,
    context: { queryClient },
    // One-page site: restoring the old offset on reload reads as the page
    // scrolling itself down. Always start at the top.
    scrollRestoration: false,
    defaultPreloadStaleTime: 0,
  });

  return router;
};
