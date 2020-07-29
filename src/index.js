module.exports = function (code) {
  return function * expand (v, env = {}) {
    if (typeof v === 'string') {
      const m = /<([^>]+)>/.exec(v)
      if (!m) return void (yield v)
      const end = m.index + m[0].length
      const head = v.slice(0, m.index)
      const key = m[1]
      if (!(key in code)) throw new Error(`<${key}> is undefined`)
      for (const substitution of expand(code[key], env))
        for (const tail of expand(v.slice(end), env))
          yield `${head}${substitution}${tail}`
    } else if (Array.isArray(v)) {
      for (const elem of v) for (const result of expand(elem, env)) yield result
    } else if (typeof v === 'object' && v !== null) {
      for (const [filter, w] of Object.entries(v)) {
        const m = /^(.*)=(.*)$/.exec(filter)
        if (!m) throw new Error('invalid filter: ' + filter)
        const [_, variable, value] = m
        if (variable in env && env[variable] !== value) continue
        for (const result of expand(w, { ...env, [variable]: value }))
          yield result
      }
    } else throw new Error('invalid value: ' + JSON.stringify(v))
  }
}
