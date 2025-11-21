module.exports = {
  default: {
    requireModule: ["ts-node/register/transpile-only"],
    require: [
      "tests/bdd/support/world.ts",
      "tests/bdd/support/hooks.ts",
      "tests/bdd/steps/**/*.ts",
    ],
    paths: ["tests/bdd/features/**/*.feature"],
    publishQuiet: true,
    format: ["progress"],
  },
};
