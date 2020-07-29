module.exports = function (code) {
  return function expand (x) {
    return code[x].replace(/<([^>]+)>/g, (_, key) => expand(key))
  }
}
