<template>
  <div class="login-wrapper">
    <!-- LEFT SIDE -->
    <section class="login-left">
      <div class="left-content">
        <h1 class="left-title">Welcome Back</h1>
        <p class="left-subtitle">Login to continue to your account</p>

        <img :src="isDarkMode ? darkLogo : lightLogo" alt="Company Logo" class="login-logo" />

        <blockquote class="login-quote">
          “Login effortlessly and leave the stress behind — secure, simple, and reliable every single time.”
          <span>— Development Team</span>
        </blockquote>
      </div>
    </section>

    <!-- RIGHT SIDE -->
    <section class="login-right">
      <div class="form-card">
        <h2 class="form-title">User Verification</h2>
        <p class="form-subtitle">Enter your credentials to access your account</p>

        <transition name="fade">
          <div v-if="message" :class="['login-alert', success ? 'alert-success' : 'alert-error']">
            {{ message }}
          </div>
        </transition>

        <form @submit.prevent="handleLogin" class="login-form">
          <label for="email" class="form-label">Email Address</label>
          <input type="email" id="email" v-model="form.email" required :disabled="loading || isLocked"
            class="form-input" placeholder="Enter your email" />

          <label for="password" class="form-label">Password</label>
          <div class="password-wrapper">
            <input :type="showPassword ? 'text' : 'password'" id="password" v-model="form.password" required
              :disabled="loading || isLocked" class="form-input" placeholder="Enter your password" />
            <span class="toggle-password" @click="showPassword = !showPassword">
              <i :class="showPassword ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
            </span>
          </div>

          <div class="form-options">
            <label class="remember-me">
              <input type="checkbox" v-model="rememberMe" />
              Remember Me
            </label>
            <router-link to="/forgot-password" class="forgot-link">Forgot password?</router-link>
          </div>

          <button type="submit" class="login-btn" :disabled="loading || isLocked">
            <span v-if="loading" class="spinner"></span>
            {{ loading ? 'Signing In...' : isLocked ? `Locked` : 'Sign In' }}
          </button>

          <div class="register-link">
            <span>Don't have an account?</span>
            <router-link to="/register">Sign up here</router-link>
          </div>
        </form>
      </div>
    </section>
  </div>
</template>

<script>
import { ref, onMounted, onBeforeUnmount } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "../../store";
import { authAPI } from "../../services/api";
import lightLogo from "@/assets/login-logo-lg.png";
import darkLogo from "@/assets/login-logo-dark.png";

export default {
  name: "Login",
  setup() {
    const router = useRouter();
    const authStore = useAuthStore();

    const form = ref({ email: "", password: "" });
    const showPassword = ref(false);
    const rememberMe = ref(false);
    const loading = ref(false);
    const message = ref("");
    const success = ref(false);
    const isDarkMode = ref(document.documentElement.getAttribute("data-theme") === "dark");
    const isLocked = ref(false);
    const lockCountdown = ref(0);
    let countdownInterval = null;

    // Observe theme changes dynamically
    let observer = null;
    onMounted(() => {
      observer = new MutationObserver(() => {
        isDarkMode.value = document.documentElement.getAttribute("data-theme") === "dark";
      });
      observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

      // Check if lock is persisted in localStorage
      const lockedUntil = localStorage.getItem("lockedUntil");
      if (lockedUntil && Date.now() < parseInt(lockedUntil)) {
        startLockTimer(Math.ceil((parseInt(lockedUntil) - Date.now()) / 1000));
      }
    });

    onBeforeUnmount(() => {
      observer && observer.disconnect();
      clearInterval(countdownInterval);
    });

    const startLockTimer = (seconds) => {
      isLocked.value = true;
      lockCountdown.value = seconds;
      localStorage.setItem("lockedUntil", Date.now() + seconds * 1000);

      countdownInterval = setInterval(() => {
        lockCountdown.value--;
        if (lockCountdown.value <= 0) {
          clearInterval(countdownInterval);
          isLocked.value = false;
          message.value = "";
          localStorage.removeItem("lockedUntil");
        } else {
          message.value = `Account locked. Try again in ${lockCountdown.value} seconds.`;
        }
      }, 1000);
    };

    const handleLogin = async () => {
      if (isLocked.value) {
        message.value = `Account locked. Try again in ${lockCountdown.value} seconds.`;
        return;
      }

      if (!form.value.email || !form.value.password) {
        message.value = "Please fill in both fields.";
        success.value = false;
        return;
      }

      loading.value = true;
      message.value = "";
      success.value = false;

      try {
        const response = await authAPI.login(form.value);

        if (response.data.success) {
          const { token, user: loggedUser } = response.data.data;
          authStore.setAuth(loggedUser, token);

          if (rememberMe.value) {
            localStorage.setItem("authToken", token);
            localStorage.setItem("user", JSON.stringify(loggedUser));
          } else {
            sessionStorage.setItem("authToken", token);
            sessionStorage.setItem("user", JSON.stringify(loggedUser));
          }

          message.value = "Login successful!";
          success.value = true;
          router.push("/dashboard"); // takes you to the dashboard on successful login
          return;
        }

        message.value = response.data.message || "Invalid login attempt.";
        success.value = false;
      } catch (err) {
        const status = err.response?.status;
        const msg = err.response?.data?.message || "Login failed. Try again.";

        if (status === 423 || msg.toLowerCase().includes("locked")) {
          message.value = "Account locked due to too many failed attempts.";
          startLockTimer(30); // Lock for 30 seconds
        } else {
          message.value = msg;
        }

        success.value = false;
      } finally {
        loading.value = false;
      }
    };

    return {
      form,
      rememberMe,
      loading,
      message,
      success,
      isDarkMode,
      handleLogin,
      lightLogo,
      darkLogo,
      isLocked,
      lockCountdown,
      showPassword,
    };
  },
};
</script>

<style scoped>
@import url("https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=Poppins:wght@600;700&display=swap");

.login-wrapper {
  display: flex;
  min-height: 100vh;
  background-color: var(--bg-color);
  color: var(--text-color);
  font-family: "Inter", sans-serif;
}

.login-left {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(180deg, rgba(6, 195, 167, 0.15) 0%, rgba(6, 195, 167, 0.05) 100%);
  padding: 40px;
  text-align: center;
  box-shadow: inset -6px 0 12px rgba(0, 0, 0, 0.05);
}

.left-content {
  max-width: 420px;
}

.left-title {
  font-family: "Poppins", sans-serif;
  font-size: 2.6rem;
  color: var(--accent-color);
  margin-bottom: 10px;
}

.left-subtitle {
  color: var(--subtext-color);
  font-size: 1.05rem;
  margin-bottom: 25px;
}

.login-logo {
  width: 230px;
  height: auto;
  margin-bottom: 20px;
  object-fit: contain;
  border-radius: 12px;
  box-shadow: 0 4px 20px var(--shadow);
}

.login-quote {
  font-style: italic;
  color: var(--subtext-color);
  border-left: 4px solid var(--accent-color);
  padding-left: 12px;
  line-height: 1.6;
  font-size: 0.95rem;
  max-width: 380px;
  margin: 0 auto;
}

.login-quote span {
  display: block;
  margin-top: 8px;
  font-weight: 600;
  color: var(--accent-color);
  font-family: "Poppins", sans-serif;
}

.login-right {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--panel-bg);
  padding: 40px;
}

.form-card {
  background: var(--panel-bg);
  border-radius: 16px;
  box-shadow: var(--shadow);
  width: 100%;
  max-width: 380px;
  padding: 35px;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.form-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--hover-shadow);
}

.form-title {
  font-family: "Poppins", sans-serif;
  font-size: 1.8rem;
  color: var(--accent-color);
  margin-bottom: 10px;
}

.form-subtitle {
  color: var(--subtext-color);
  margin-bottom: 30px;
}

.login-alert {
  border-radius: 10px;
  padding: 12px 16px;
  font-size: 0.95rem;
  margin-bottom: 15px;
  animation: fadeIn 0.4s ease;
}

.alert-success {
  background-color: rgba(16, 185, 129, 0.15);
  color: #065f46;
}

.alert-error {
  background-color: rgba(239, 68, 68, 0.15);
  color: #7f1d1d;
}

.form-label {
  color: var(--subtext-color);
  font-size: 0.9rem;
  margin-bottom: 6px;
  display: block;
}

.form-input {
  width: 100%;
  padding: 12px 14px;
  border-radius: 10px;
  border: 1px solid var(--border-color);
  background: var(--input-bg);
  color: var(--text-color);
  margin-bottom: 18px;
  transition: border-color 0.3s ease, box-shadow 0.3s ease;
}

.form-input:focus {
  border-color: var(--accent-color);
  box-shadow: 0 0 0 3px rgba(6, 195, 167, 0.2);
  outline: none;
}

.form-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.password-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.password-wrapper .form-input {
  width: 100%;
  padding-right: 40px;
  box-sizing: border-box;
}

.toggle-password {
  position: absolute;
  right: 12px;
  top: 40%;
  transform: translateY(-50%);
  cursor: pointer;
  color: var(--subtext-color);
  font-size: 1rem;
  transition: color 0.3s ease, transform 0.2s ease;
}

.toggle-password:hover {
  color: var(--accent-color);
  transform: translateY(-50%) scale(1.1);
}

.remember-me {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--subtext-color);
  cursor: pointer;
  font-size: 0.9rem;
}

.remember-me input[type="checkbox"] {
  width: 18px;
  height: 18px;
  accent-color: var(--accent-color);
}

.forgot-link {
  color: var(--accent-color);
  font-weight: 600;
  text-decoration: none;
  font-size: 0.9rem;
}

.forgot-link:hover {
  text-decoration: underline;
}

.login-btn {
  width: 100%;
  background-color: var(--accent-color);
  color: var(--button-text);
  border: none;
  padding: 12px 16px;
  border-radius: 10px;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.3s ease, transform 0.3s ease;
}

.login-btn:hover {
  background-color: #05a892;
  transform: translateY(-2px);
}

.login-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.5);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  display: inline-block;
  margin-right: 6px;
}

.register-link {
  text-align: center;
  margin-top: 20px;
  color: var(--subtext-color);
}

.register-link a {
  color: var(--accent-color);
  font-weight: 600;
  text-decoration: none;
}

.register-link a:hover {
  text-decoration: underline;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-6px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 900px) {
  .login-left {
    display: none;
  }

  .login-right {
    width: 100%;
    padding: 30px;
  }
}
</style>
