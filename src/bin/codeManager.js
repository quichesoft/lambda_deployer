const nodePath = require('path')
const childProcess = require('child_process')
const AWS = require('aws-sdk')
const fs = require('fs')
const _ = require('lodash')

class CodeManager {

  static async deploy(path, prepack_cmd, type) {
    console.log(`Packing lambda to code.zip`)

    prepack_cmd = prepack_cmd || 'npm run build'
    const pathToScript = nodePath.resolve(`${__dirname}/pack_lambda.sh`)
    const params = { path, prepack_cmd }

    let output
    try {
      output = childProcess.execSync(`"${pathToScript}" '${JSON.stringify(params)}'`, { cwd: path })
      if (output == null) {
        console.error('Failed to pack lambda. Empty output from packer')
        return
      }

      output = JSON.parse(output.toString('utf8'))
      if (output.file == null) {
        console.error('Missing file path from packer output')
        return
      }
    } catch (e) {
      console.log(`Operation failed with ${e}`)
    }

    const filePath = output.file
    const fileContent = fs.readFileSync(`${filePath}`)

    const packageJson = JSON.parse(fs.readFileSync(`${path}/package.json`).toString())
    const deployment = _.get(packageJson, 'deployment')
    if (deployment == null) {
      console.error('Missing deployment section in package.json')
      return
    }

    const bucket = deployment.aws_bucket
    if (bucket == null) {
      console.error('Missing aws_bucket in deployment section')
      return
    }

    const lambdaName = _.get(deployment, `aws_lambda_function_name.${type}`)
    if (lambdaName == null) {
      console.error(`Missing aws_lambda_function_name in deployment section for env ${type}`)
      return
    }

    const profile = deployment.aws_profile
    if (profile != null) {
      const credentials = new AWS.SharedIniFileCredentials({ profile })
      AWS.config.update({ credentials })
    }

    const region = deployment.aws_region
    if (region != null) {
      AWS.config.update({ region })
    }

    const s3 = new AWS.S3()
    const lambda = new AWS.Lambda()
    try {
      console.log(`Uploading code.zip to AWS S3`)

      const s3Params = { Bucket: bucket, Key: `${type}/${lambdaName}/code.zip`, Body: fileContent }
      await s3.putObject(s3Params).promise()

      console.log(`Updating lambda source code`)

      await lambda.updateFunctionCode({
        FunctionName: lambdaName,
        S3Key: s3Params.Key,
        S3Bucket: s3Params.Bucket
      }).promise()

      console.log(`Cleaning data`)
      fs.unlinkSync(`${filePath}`)

      console.log(`Lambda deployed`)
    } catch (e) {
      console.log(`Operation failed with ${e}`)
    }
  }
}

module.exports = CodeManager
