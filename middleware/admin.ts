export default defineNuxtRouteMiddleware(async () => {
  const authStore = useAuthStore();
  await authStore.init();

  const user = authStore.user as any;
  if (!user || user.role !== "admin") {
    return navigateTo("/");
  }
});
