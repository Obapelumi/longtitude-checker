module.exports = {
  purge: ["./**/*.vue"],
  theme: {
    extend: {
      inset: {
        0: "0",
        "1/2": "50%",
        100: "100%",
        auto: "auto"
      },
      spacing: {
        72: "18rem",
        84: "21rem",
        96: "24rem",
        108: "27rem",
        120: "30rem"
      },
      fontSize: {
        tiny: ".425rem"
      },
      maxHeight: (theme) => ({
        ...theme("spacing"),
        full: "100%",
        screen: "100vh"
      }),
    }
  },
  variants: {
    display: ["responsive", "group-hover"]
  }
};
