const { readFileSync } = require('fs');
const entify = (x => x.replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;'));

process.stdout.write(readFileSync(process.argv[2], 'utf8')
  .replace(/\$MARKUP:([A-Za-z0-9-]+)/g, (_, name) => readFileSync(`markup/${name}.html`, 'utf8'))
  .replace(/\$SNIPPET:([A-Za-z0-9-]+)/g, (_, name) =>
    `<pre id="${name}"><code>${entify(readFileSync(`snippet/${name}.js`, 'utf8'))}</code></pre>`)
);

