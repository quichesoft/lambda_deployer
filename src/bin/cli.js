#!/usr/bin/env node
'use strict'

const program = require('commander')
const Liftoff = require('liftoff')
const interpret = require('interpret')
const argv = require('minimist')(process.argv.slice(2))
const CodeManager = require('./codeManager')

function invoke(env) {
  program
    .version('0.0.1')
    .command('deploy <type>')
    .option('--cmd <prepack_cmd>', 'Pre-pack command')
    .description('Pack typescript code to code.zip')
    .action((type, options) => {
      return CodeManager.deploy(env.cwd, options.prepack_cmd, type)
    })

  program.parse(process.argv)
}

const cli = new Liftoff({
  name: 'lambda_deployer',
  extensions: interpret.jsVariants,
  v8flags: require('v8flags')
})

cli.launch({
  cwd: argv.cwd,
  configPath: argv.config,
  require: argv.require,
  completion: argv.completion
}, invoke)
