<template>
  <div class="dashboard-container">
    <div class="container mt-5">
      <div class="row justify-content-center">
        <div class="col-md-6">
          <div class="auth-card">
            <div class="auth-header">
              <h1 class="auth-title">Welcome, {{ user?.first_name }}!</h1>
              <p class="auth-subtitle">Here’s your profile info:</p>
            </div>

            <div v-if="loading" class="text-center my-3">
              <span class="spinner-border"></span>
            </div>

            <div v-else class="user-info mt-4">
              <div class="info-item"><strong>Name:</strong> {{ user.first_name }} {{ user.last_name }}</div>
              <div class="info-item"><strong>Email:</strong> {{ user.email }}</div>
              <div class="info-item"><strong>Employee ID:</strong> {{ user.employee_id }}</div>
              <div class="info-item"><strong>Role:</strong> {{ user.is_admin ? "Administrator" : "Employee" }}</div>
              <div class="info-item">
                <strong>Status:</strong>
                <span :class="user.is_locked ? 'text-danger' : 'text-success'">
                  {{ user.is_locked ? 'Locked' : 'Active' }}
                </span>
              </div>
            </div>

            <div class="mt-4 text-center">
              <button @click="handleLogout" class="btn btn-primary">Sign Out</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "../store";
import { userAPI } from "../services/api";

export default {
  name: "Dashboard",
  setup() {
    const router = useRouter();
    const authStore = useAuthStore();
    const user = ref(null);
    const loading = ref(true);
    let intervalId = null;

    const fetchUserProfile = async () => {
      try {
        const response = await userAPI.getProfile();
        user.value = response.data.data;
      } catch (err) {
        console.error("Failed to fetch profile:", err);
      } finally {
        loading.value = false;
      }
    };

    const handleLogout = () => {
      authStore.clearAuth();
      localStorage.removeItem("authToken");
      localStorage.removeItem("user");
      sessionStorage.removeItem("authToken");
      sessionStorage.removeItem("user");
      router.push("/");
    };

    onMounted(() => {
      fetchUserProfile();
      // Auto-refresh lock status every second
      intervalId = setInterval(fetchUserProfile, 1000);
    });

    onUnmounted(() => {
      if (intervalId) clearInterval(intervalId);
    });

    return { user, loading, handleLogout };
  },
};
</script>

<style scoped>
.dashboard-container {
  min-height: 100vh;
  background: var(--bg-color);
  padding-top: 20px;
}

.info-item {
  padding: 10px 0;
  border-bottom: 1px solid var(--border-color);
  color: var(--text-color);
}

.info-item:last-child {
  border-bottom: none;
}

.info-item strong {
  color: var(--accent-color);
}
</style>
