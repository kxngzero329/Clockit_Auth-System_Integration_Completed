<template>
  <transition name="fade">
    <div class="reset-container" v-if="initialized">
      <!-- Illustration -->
      <div class="illustration">
        <img src="@/assets/Security On-bro.png" alt="Security Illustration" class="image" />
      </div>

      <!-- Form -->
      <div class="form">
        <h1 class="heading">Create Your New Password</h1>
        <p class="text">Enter your new password below to access your account</p>

        <div v-if="message" :class="['alert', success ? 'alert-success' : 'alert-danger']">
          {{ message }}
        </div>

        <div class="password-field">
          <input v-model="newPassword" :type="show ? 'text' : 'password'" placeholder="Enter new password"
            maxlength="15" @input="updateHints" :disabled="loading" />
          <button type="button" class="eye" @click="toggleShow">
            <svg v-if="!show" width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" stroke="var(--accent-color)" stroke-width="1.5"
                stroke-linecap="round" stroke-linejoin="round" />
              <circle cx="12" cy="12" r="3" stroke="var(--accent-color)" stroke-width="1.5" />
            </svg>
            <svg v-else width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M17.94 17.94A10.94 10.94 0 0 1 12 19c-7 0-11-7-11-7a22.3 22.3 0 0 1 5.29-4.69"
                stroke="var(--accent-color)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
              <path d="M1 1l22 22" stroke="var(--accent-color)" stroke-width="1.5" stroke-linecap="round"
                stroke-linejoin="round" />
            </svg>
          </button>
        </div>

        <small v-if="charWarning" class="warning">{{ charWarning }}</small>

        <div class="strength">
          <div class="strength-bar" :style="{ width: strengthPercent + '%', background: strengthColor }"></div>
        </div>
        <small class="strength-label" :style="{ color: strengthColor }">{{ strengthLabel }}</small>

        <ul v-if="newPassword" class="password-hints">
          <li :class="{ valid: hasUppercase }">Contains an uppercase letter (A–Z)</li>
          <li :class="{ valid: hasNumber }">Contains a number (0–9)</li>
          <li :class="{ valid: hasSpecial }">Contains a special character (!@#$%)</li>
          <li :class="{ valid: hasMinLength }">8–15 characters long</li>
        </ul>

        <input v-model="confirmPassword" type="password" placeholder="Confirm password" maxlength="15"
          :disabled="loading" />

        <button class="primary" @click="handleReset" :disabled="loading">
          <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
          {{ loading ? "Resetting..." : "Reset Password" }}
        </button>

        <button class="secondary" @click="goToLogin" :disabled="loading">Back to Login</button>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { authAPI } from "../../services/api";

const route = useRoute();
const router = useRouter();

const newPassword = ref("");
const confirmPassword = ref("");
const show = ref(false);
const loading = ref(false);
const message = ref("");
const success = ref(false);
const charWarning = ref("");
const initialized = ref(false);

const hasUppercase = ref(false);
const hasNumber = ref(false);
const hasSpecial = ref(false);
const hasMinLength = ref(false);

const token = ref("");
const email = ref("");

const channel = new BroadcastChannel("reset-password");

onMounted(() => {
  const params = new URLSearchParams(window.location.search);
  token.value = params.get("token") || "";
  email.value = params.get("email") || "";

  // Detect same tab reset
  if (localStorage.getItem("resetRequested")) {
    localStorage.removeItem("resetRequested");
  }

  // Listen for reset-requested broadcasts
  channel.onmessage = (e) => {
    if (e.data === "reset-requested") {
      router.replace({ path: "/reset-password", query: { token: token.value, email: email.value } });
    }
  };

  if (!token.value || !email.value) {
    message.value = "Invalid or missing reset token/email.";
    success.value = false;
  }

  initialized.value = true;
});

onUnmounted(() => {
  channel.close();
});

function toggleShow() {
  show.value = !show.value;
}

function updateHints() {
  const p = newPassword.value;
  hasUppercase.value = /[A-Z]/.test(p);
  hasNumber.value = /[0-9]/.test(p);
  hasSpecial.value = /[^A-Za-z0-9]/.test(p);
  hasMinLength.value = p.length >= 8 && p.length <= 15;
  charWarning.value = p.length > 15 ? "Password must be between 8–15 characters." : "";
}

const strengthScore = computed(() => {
  let score = 0;
  if (hasUppercase.value) score++;
  if (hasNumber.value) score++;
  if (hasSpecial.value) score++;
  if (hasMinLength.value) score++;
  return score;
});

const strengthPercent = computed(() => (strengthScore.value / 4) * 100);

const strengthLabel = computed(() => {
  switch (strengthScore.value) {
    case 0:
    case 1:
      return "Weak";
    case 2:
      return "Fair";
    case 3:
      return "Good";
    case 4:
      return "Strong";
  }
});

const strengthColor = computed(() => {
  switch (strengthScore.value) {
    case 1:
      return "#FF4D4D";
    case 2:
      return "#FFA500";
    case 3:
      return "#00BFFF";
    case 4:
      return "#00C853";
    default:
      return "#CCCCCC";
  }
});

const goToLogin = () => router.push("/");

const handleReset = async () => {
  if (!token.value || !email.value) return;

  if (!hasMinLength.value)
    return alert("Password must be between 8–15 characters.");
  if (newPassword.value !== confirmPassword.value)
    return alert("Passwords do not match.");
  if (strengthScore.value < 3)
    return alert("Please make your password stronger before continuing.");

  loading.value = true;
  message.value = "";

  try {
    const response = await authAPI.resetPassword({
      email: email.value,
      token: token.value,
      newPassword: newPassword.value,
    });

    if (response.data.success) {
      success.value = true;
      message.value = response.data.message;
      setTimeout(() => router.push("/"), 1500);
    }
  } catch (err) {
    success.value = false;
    message.value =
      err.response?.data?.message ||
      "Failed to reset password. Please try again.";
  } finally {
    loading.value = false;
  }
};
</script>


<style scoped>
.reset-container {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 64px;
  min-height: 100vh;
  padding: 40px;
  background: var(--bg-color);
  font-family: 'Inter', sans-serif;
}

.illustration .image {
  max-height: 400px;
  object-fit: contain;
}

.form {
  flex: 1;
  max-width: 480px;
}

.heading {
  font-family: 'Poppins', sans-serif;
  font-size: 2.2rem;
  font-weight: 700;
  color: var(--accent-color);
  margin-bottom: 8px;
}

.text {
  font-size: 1rem;
  color: var(--subtext-color);
  margin-bottom: 20px;
}

input {
  width: 100%;
  padding: 14px 16px;
  border-radius: 10px;
  border: 1px solid var(--border-color);
  font-size: 0.95rem;
  margin-bottom: 12px;
  background: var(--input-bg);
  color: var(--text-color);
}

.password-field {
  position: relative;
  margin-bottom: 12px;
}

.eye {
  position: absolute;
  right: 10px;
  top: 45%;
  transform: translateY(-50%);
  background: transparent;
  border: none;
  cursor: pointer;
}

.warning {
  color: #e63946;
  font-size: 0.85rem;
  font-weight: 500;
}

.strength {
  height: 6px;
  background: rgba(2, 136, 123, 0.12);
  border-radius: 6px;
  margin: 6px 0;
}

.strength-bar {
  height: 100%;
  transition: width 200ms ease;
}

.strength-label {
  display: block;
  font-weight: 600;
  margin-bottom: 12px;
}

.password-hints {
  list-style: none;
  padding: 0;
  margin-bottom: 12px;
  font-size: 0.9rem;
  color: var(--subtext-color);
}

.password-hints li {
  display: flex;
  align-items: center;
  margin-bottom: 4px;
}

.password-hints li::before {
  content: "✖";
  color: #ff4d4d;
  margin-right: 8px;
}

.password-hints li.valid::before {
  content: "✔";
  color: #00c853;
}

.password-hints li.valid {
  color: #00c853;
}

.primary {
  width: 100%;
  background: var(--accent-color);
  color: var(--button-text);
  border: none;
  padding: 14px 16px;
  border-radius: 22px;
  font-weight: 600;
  cursor: pointer;
}

.secondary {
  background: transparent;
  border: none;
  color: var(--accent-color);
  cursor: pointer;
  font-weight: 600;
  margin-top: 10px;
}

/* Responsive */
@media (max-width: 1024px) {
  .reset-container {
    flex-direction: column;
    gap: 50px;
    padding: 32px;
    text-align: center;
  }

  .illustration .image {
    max-height: 320px;
  }
}

@media (max-width: 768px) {
  .reset-container {
    padding: 24px 16px;
    gap: 40px;
  }

  .form {
    width: 100%;
    max-width: 380px;
  }
}

@media (max-width: 480px) {
  .reset-container {
    padding: 16px;
    gap: 30px;
  }

  .form {
    max-width: 100%;
  }

  .heading {
    font-size: 1.6rem;
  }
}
</style>
