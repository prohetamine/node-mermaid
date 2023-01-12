module.exports = {
    "env": {
      "node": true,
      "browser": true,
      "commonjs": true,
      "es6": true,
      "es2021": true,
    },
    "extends": "eslint:recommended",
    "globals": {
        "Atomics": "readonly",
        "SharedArrayBuffer": "readonly"
    },
    "parserOptions": {
        "ecmaVersion": 2018
    },
    "rules": {}
}
