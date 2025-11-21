// Local ts-node registration for Cucumber with CommonJS output
require("ts-node").register({
  transpileOnly: true,
  compilerOptions: {
    module: "commonjs",
  },
});
