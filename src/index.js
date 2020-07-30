module.exports = function (code) {
  return function * expand (v, env = {}) {
    if (typeof v === 'string') {
      const m = /<(?:(.*):)?([^>]+)>/.exec(v)
      if (!m) return void (yield v)
      const end = m.index + m[0].length
      const head = v.slice(0, m.index)
      const filters = m[1] === undefined ? [] : m[1].split(':')
      for (const filter of filters) {
        if (!(env = applyFilter(filter, env))) return
      }
      const key = m[2]
      if (!(key in code)) throw new Error(`<${key}> is undefined`)
      for (const substitution of expand(code[key], env))
        for (const tail of expand(v.slice(end), env))
          yield `${head}${substitution}${tail}`
    } else if (Array.isArray(v)) {
      for (const elem of v) for (const result of expand(elem, env)) yield result
    } else if (typeof v === 'object' && v !== null) {
      for (const [filter, w] of Object.entries(v)) {
        const newEnv = applyFilter(filter, env)
        if (!newEnv) continue
        for (const result of expand(w, newEnv)) yield result
      }
    } else throw new Error('invalid value: ' + JSON.stringify(v))
  }
}

function applyFilter (filter, env) {
  const m = /^(.*?)\s*(=|:=|!=|<=|<|>=|>|\+=|-=|\*=|\?=)\s*(.*)$/.exec(filter)
  if (!m) throw new Error('invalid filter: ' + filter)
  const [_, variable, operator, value] = m
  if (operator === ':=') return { ...env, [variable]: value }
  if (operator === '?=')
    return variable in env ? env : { ...env, [variable]: value }
  if (operator === '!=')
    return (!(variable in env) || env[variable] !== value) && env
  if (operator === '=')
    return !(variable in env)
      ? { ...env, [variable]: value }
      : env[variable] == value && env
  if (!(variable in env)) throw new Error(`${variable} has no value`)
  const current = env[variable]
  if (operator === '<') return current < value && env
  if (operator === '<=') return current <= value && env
  if (operator === '>') return current > value && env
  if (operator === '>=') return current >= value && env
  if (operator === '+=') return { ...env, [variable]: +current + +value }
  if (operator === '-=') return { ...env, [variable]: current - value }
  if (operator === '*=') return { ...env, [variable]: current * value }
  throw new Error(`invalid operator: ${operator}`)
}
