module.exports = {
    transform: {
      "^.+\\.(js|jsx)$": "babel-jest",
    },
    testEnvironment: "jsdom",
    transformIgnorePatterns: [
      "/node_modules/(?!(axios)/)", // Ignore everything in node_modules except axios
    ],
  };
  