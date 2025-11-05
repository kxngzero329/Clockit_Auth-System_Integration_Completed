<template>
  <div class="forgot-container">
    <!-- Left Image -->
    <div class="image">
      <img src="@/assets/Forgot password-bro (3).png" alt="Forgot Password Illustration" />
    </div>

    <!-- Right Form -->
    <div class="form">
      <h1 class="heading">Forgot Password?</h1>
      <p class="text">Enter your registered email address to receive a reset link.</p>

      <form @submit.prevent="handleForgotPassword">
        <input
          type="email"
          v-model="form.email"
          placeholder="Enter your email address"
          required
          :disabled="loading"
        />

        <div class="checkbox-wrapper">
          <input
            type="checkbox"
            id="useBackup"
            v-model="form.useBackup"
          />
          <label for="useBackup">Send to backup email instead</label>
        </div>

        <button type="submit" class="primary" :disabled="loading">
          {{ loading ? "Sending..." : "Send Reset Link" }}
        </button>

        <router-link to="/" class="secondary">Back to Sign In</router-link>
      </form>

      <div v-if="message" :class="['alert', success ? 'alert-success' : 'alert-danger']">
        {{ message }}
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onUnmounted } from "vue";
import { authAPI } from "../../services/api";

export default {
  name: "ForgotPassword",
  setup() {
    const form = ref({
      email: "",
      useBackup: false,
    });

    const loading = ref(false);
    const message = ref("");
    const success = ref(false);

    // Channel for cross-tab messaging
    const channel = new BroadcastChannel("reset-password");

    const handleForgotPassword = async () => {
      loading.value = true;
      message.value = "";

      try {
        const response = await authAPI.forgotPassword(form.value);
        if (response.data.success) {
          success.value = true;
          message.value = response.data.message;

          // ✅ mark this tab as the one that requested reset
          localStorage.setItem("resetRequested", "true");
          channel.postMessage("reset-requested");
        } else {
          success.value = false;
          message.value = response.data.message || "Failed to send reset link.";
        }
      } catch (error) {
        success.value = false;
        message.value =
          error.response?.data?.message || "An error occurred. Please try again.";
      } finally {
        loading.value = false;
      }
    };

    onUnmounted(() => {
      channel.close();
    });

    return {
      form,
      loading,
      message,
      success,
      handleForgotPassword,
    };
  },
};
</script>


<style scoped>
.forgot-container {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 80px;
  min-height: 100vh;
  padding: 40px;
  background: var(--bg-color);
  font-family: 'Inter', sans-serif;
  box-sizing: border-box;
}

.image img {
  width: 100%;
  max-width: 500px;
  object-fit: contain;
}

.form {
  flex: 1;
  max-width: 420px;
}

.heading {
  font-family: 'Poppins', sans-serif;
  font-size: 2rem;
  font-weight: 700;
  color: var(--accent-color);
  margin-bottom: 12px;
}

.text {
  font-size: 1rem;
  color: var(--subtext-color);
  margin-bottom: 20px;
}

input[type="email"] {
  width: 100%;
  padding: 12px 14px;
  border-radius: 10px;
  background: var(--input-bg);
  border: 1px solid var(--border-color);
  margin-bottom: 16px;
  font-size: 0.95rem;
  color: var(--text-color);
}

/* Checkbox styling for clean layout */
.checkbox-wrapper {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 20px;
}

.checkbox-wrapper input[type="checkbox"] {
  width: 18px;
  height: 18px;
  accent-color: var(--accent-color);
  cursor: pointer;
}

.checkbox-wrapper label {
  font-size: 0.95rem;
  color: var(--subtext-color);
  cursor: pointer;
  user-select: none;
}

.primary {
  width: 100%;
  background: var(--accent-color);
  color: var(--button-text);
  transition: 0.3s ease;
  border: none;
  padding: 12px 16px;
  border-radius: 22px;
  font-weight: 600;
  cursor: pointer;
  margin-bottom: 12px;
}

.primary:hover {
  background-color: #05a892;
  transform: translateY(-2px);
}

.primary:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.secondary {
  display: inline-block;
  text-align: center;
  color: var(--accent-color);
  font-weight: 600;
  margin-top: 8px;
  cursor: pointer;
  text-decoration: none;
}

.secondary:hover {
  text-decoration: underline;
}

/* Alerts */
.alert {
  margin-top: 16px;
  padding: 10px 14px;
  border-radius: 8px;
  font-size: 0.9rem;
}

.alert-success {
  background-color: rgba(6, 195, 167, 0.1);
  color: var(--accent-color);
}

.alert-danger {
  background-color: rgba(255, 0, 0, 0.1);
  color: red;
}

/* Responsive */
@media (max-width: 1024px) {
  .forgot-container {
    flex-direction: column;
    text-align: center;
    gap: 60px;
  }
  .image img {
    max-width: 70%;
    margin: 0 auto;
  }
  .form {
    max-width: 90%;
  }
}

@media (max-width: 768px) {
  .forgot-container {
    padding: 24px 16px;
  }
  .heading {
    font-size: 1.6rem;
  }
  .text {
    font-size: 0.9rem;
  }
}
</style>
