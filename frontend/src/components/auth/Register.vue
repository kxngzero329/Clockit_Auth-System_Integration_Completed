<template>
  <div class="register-wrapper">
    <div class="register-right">
      <div class="form-card">
        <h1 class="form-title">Create Account</h1>
        <p class="form-subtitle">Join ClockIt and track your attendance</p>

        <div
          v-if="message"
          :class="['login-alert', success ? 'alert-success' : 'alert-error']"
        >
          {{ message }}
        </div>

        <form @submit.prevent="handleRegister" class="form-grid">
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">First Name</label>
              <input
                v-model="form.first_name"
                class="form-input"
                type="text"
                placeholder="Enter first name"
                required
              />
            </div>

            <div class="form-group">
              <label class="form-label">Last Name</label>
              <input
                v-model="form.last_name"
                class="form-input"
                type="text"
                placeholder="Enter last name"
                required
              />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Email</label>
              <input
                v-model="form.email"
                class="form-input"
                type="email"
                placeholder="Enter your email"
                required
              />
            </div>

            <div class="form-group">
              <label class="form-label">Contact Number</label>
              <input
                v-model="form.contact_no"
                class="form-input"
                type="tel"
                placeholder="Enter contact number"
              />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group full-width">
              <label class="form-label">Address</label>
              <textarea
                v-model="form.address"
                class="form-input"
                rows="2"
                placeholder="Enter your address"
                required
              ></textarea>
            </div>
          </div>

          <!-- PASSWORD FIELD WITH VALIDATOR -->
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Password</label>
              <div class="password-field">
                <input
                  v-model="form.password"
                  :type="showPassword ? 'text' : 'password'"
                  placeholder="Create a strong password"
                  maxlength="15"
                  @input="updatePasswordHints"
                  required
                  class="form-input"
                />
                <span class="toggle-password" @click="showPassword = !showPassword">
                  <i :class="showPassword ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
                </span>
              </div>

              <small v-if="charWarning" class="warning">{{ charWarning }}</small>

              <div class="strength">
                <div class="strength-bar" :style="{ width: strengthPercent + '%', background: strengthColor }"></div>
              </div>
              <small class="strength-label" :style="{ color: strengthColor }">{{ strengthLabel }}</small>

              <ul v-if="form.password" class="password-hints">
                <li :class="{ valid: hasUppercase }">Contains an uppercase letter (A–Z)</li>
                <li :class="{ valid: hasNumber }">Contains a number (0–9)</li>
                <li :class="{ valid: hasSpecial }">Contains a special character (!@#$%)</li>
                <li :class="{ valid: hasMinLength }">8–15 characters long</li>
              </ul>
            </div>

            <div class="form-group">
              <label class="form-label">Backup Email (Optional)</label>
              <input
                v-model="form.backup_email"
                class="form-input"
                type="email"
                placeholder="Enter backup email"
              />
            </div>
          </div>

          <button type="submit" class="login-btn" :disabled="loading">
            <span v-if="loading" class="spinner"></span>
            {{ loading ? "Creating Account..." : "Create Account" }}
          </button>

          <div class="register-link">
            <span>Already have an account? </span>
            <router-link to="/">Sign in here</router-link>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import { authAPI } from "../../services/api";

const router = useRouter();

const form = ref({
  first_name: "",
  last_name: "",
  email: "",
  contact_no: "",
  address: "",
  password: "",
  backup_email: "",
});

const loading = ref(false);
const message = ref("");
const success = ref(false);

/* PASSWORD VALIDATION */
const showPassword = ref(false);
const hasUppercase = ref(false);
const hasNumber = ref(false);
const hasSpecial = ref(false);
const hasMinLength = ref(false);
const charWarning = ref("");

function updatePasswordHints() {
  const p = form.value.password;
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
    case 1: return "Weak";
    case 2: return "Fair";
    case 3: return "Good";
    case 4: return "Strong";
  }
});

const strengthColor = computed(() => {
  switch (strengthScore.value) {
    case 1: return "#FF4D4D";
    case 2: return "#FFA500";
    case 3: return "#00BFFF";
    case 4: return "#00C853";
    default: return "#CCCCCC";
  }
});

const handleRegister = async () => {
  loading.value = true;
  message.value = "";

  try {
    const payload = { ...form.value, backup_email: form.value.backup_email || null };

    const response = await authAPI.register(payload);

    if (response.data.success) {
      success.value = true;
      message.value = response.data.message;
      setTimeout(() => {
        router.push("/");
      }, 2000);
    }
  } catch (error) {
    success.value = false;
    message.value =
      error.response?.data?.message ||
      "An error occurred during registration. Please try again.";
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
@import url("https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=Poppins:wght@600;700&display=swap");

.register-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: var(--bg-color);
  color: var(--text-color);
  font-family: "Inter", sans-serif;
  padding: 40px;
}

.register-right {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
}

.form-card {
  background: var(--panel-bg);
  border-radius: 16px;
  box-shadow: var(--shadow);
  width: 100%;
  max-width: 800px;
  padding: 40px 50px;
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
  text-align: center;
}

.form-subtitle {
  color: var(--subtext-color);
  text-align: center;
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

.form-grid {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.full-width {
  grid-column: 1 / -1;
}

.form-label {
  color: var(--subtext-color);
  font-size: 0.9rem;
  margin-bottom: 6px;
}

.form-input {
  width: 100%;
  padding: 12px 14px;
  border-radius: 10px;
  border: 1px solid var(--border-color);
  background: var(--input-bg);
  color: var(--text-color);
  transition: border-color 0.3s ease, box-shadow 0.3s ease;
}

.form-input:focus,
textarea:focus {
  border-color: var(--accent-color);
  box-shadow: 0 0 0 3px rgba(6, 195, 167, 0.2);
  outline: none;
}

.form-hint {
  font-size: 0.8rem;
  color: var(--subtext-color);
  margin-top: 4px;
}

.password-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.password-wrapper .form-input {
  padding-right: 40px;
  /* space for eye icon */
}

.toggle-password {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  cursor: pointer;
  color: var(--subtext-color);
  transition: color 0.3s ease, transform 0.2s ease;
}

.toggle-password:hover {
  color: var(--accent-color);
  transform: translateY(-50%) scale(1.1);
}

.password-field {
  position: relative;
}

.password-field .form-input {
  width: 100%;
  padding-right: 40px; /* space for eye icon */
  box-sizing: border-box;
}

.toggle-password {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  cursor: pointer;
  color: var(--subtext-color);
  transition: color 0.3s ease, transform 0.2s ease;
}

.toggle-password:hover {
  color: var(--accent-color);
  transform: translateY(-50%) scale(1.1);
}

.warning {
  color: #e63946;
  font-size: 0.85rem;
  font-weight: 500;
  margin-top: 4px;
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

@media (max-width: 768px) {
  .form-card {
    padding: 30px;
  }
}
</style>
