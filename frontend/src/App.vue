<template>
  <div id="app">
    <!-- 🌗 Theme Toggle -->
    <label class="theme-toggle">
      <input type="checkbox" :checked="isDarkMode" @change="toggleTheme" />
      <span class="slider">
        <div class="star star_1"></div>
        <div class="star star_2"></div>
        <div class="star star_3"></div>
        <svg viewBox="0 0 16 16" class="cloud">
          <path
            transform="scale(0.06)"
            fill="#fff"
            d="m391.84 540.91c-.421-.329-.949-.524-1.523-.524-1.351 0-2.451 1.084-2.485 2.435-1.395.526-2.388 1.88-2.388 3.466 0 1.874 1.385 3.423 3.182 3.667v.034h12.73v-.006c1.775-.104 3.182-1.584 3.182-3.395 0-1.747-1.309-3.186-2.994-3.379.007-.106.011-.214.011-.322 0-2.707-2.271-4.901-5.072-4.901-2.073 0-3.856 1.202-4.643 2.925"
          ></path>
        </svg>
      </span>
    </label>

    <!-- Page Transitions -->
    <transition name="fade" mode="out-in">
      <router-view />
    </transition>
  </div>
</template>

<script>
export default {
  name: "App",
  data() {
    return {
      isDarkMode: false,
    };
  },
  mounted() {
    // Initialize theme
    const savedTheme = localStorage.getItem("theme") || "light";
    this.setTheme(savedTheme);
  },
  methods: {
    toggleTheme() {
      const newTheme = this.isDarkMode ? "light" : "dark";
      this.setTheme(newTheme);
    },
    setTheme(theme) {
      this.isDarkMode = theme === "dark";
      document.documentElement.setAttribute("data-theme", theme);
      localStorage.setItem("theme", theme);
    },
  },
};
</script>

<style scoped>
/* Theme Toggle */
.theme-toggle {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 999;
  width: 3.8em;
  height: 2em;
}

.theme-toggle input {
  opacity: 0;
  width: 0;
  height: 0;
}

.theme-toggle .slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #064e44;
  transition: 0.4s;
  border-radius: 30px;
}

.theme-toggle .slider:before {
  position: absolute;
  content: "";
  height: 1.6em;
  width: 1.6em;
  border-radius: 20px;
  left: 0.2em;
  bottom: 0.2em;
  background-color: #f7b733;
  transition: 0.4s;
}

.theme-toggle input:checked + .slider {
  background-color: #00a6ff;
}

.theme-toggle input:checked + .slider:before {
  transform: translateX(1.8em);
  box-shadow: inset 15px -4px 0px 15px #ffcf48;
}

.theme-toggle .star {
  background-color: #fff;
  border-radius: 50%;
  position: absolute;
  width: 5px;
  height: 5px;
}

.theme-toggle .star_1 {
  left: 2.5em;
  top: 0.5em;
}
.theme-toggle .star_2 {
  left: 2.2em;
  top: 1.2em;
}
.theme-toggle .star_3 {
  left: 3em;
  top: 0.9em;
}

.theme-toggle input:checked ~ .slider .star {
  opacity: 0;
}

.theme-toggle .cloud {
  width: 3.5em;
  position: absolute;
  bottom: -1.4em;
  left: -1.1em;
  opacity: 0;
  transition: all 0.4s;
}

.theme-toggle input:checked ~ .slider .cloud {
  opacity: 1;
}

/* Page fade transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.4s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
