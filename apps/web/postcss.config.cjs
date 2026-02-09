module.exports = {
  plugins: {
    tailwindcss: {
      config: process.env.TAILWIND_CONFIG || "./tailwind.config.cjs",
    },
    autoprefixer: {},
  },
};
