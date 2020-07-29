const fs = require('fs')
const { safeLoad } = require('js-yaml')
const files = fs.readdirSync(__dirname)
const genitive = require('..')
let ok = true
files.forEach(file => {
  const m = file.match(/\.input\.yaml$/)
  if (!m) return
  const input = safeLoad(fs.readFileSync(`${__dirname}/${file}`))
  const output = evalTestCase(input)
  const afile = `${__dirname}/${file.slice(0, m.index)}.approved.txt`
  const rfile = `${__dirname}/${file.slice(0, m.index)}.received.txt`
  if (
    !fs.existsSync(afile) ||
    fs
      .readFileSync(afile)
      .toString()
      .trimRight() !== output.trimRight()
  ) {
    console.log(`${rfile} failed`)
    ok = false
    fs.writeFileSync(rfile, output)
  } else {
    if (fs.existsSync(rfile)) fs.unlinkSync(rfile)
  }
})
if (!ok) {
  process.exit(1)
}
console.log('OK')

function evalTestCase (input) {
  const grammar = genitive(input)
  return [...grammar(`<${Object.keys(input)[0]}>`)].join('\n')
}
