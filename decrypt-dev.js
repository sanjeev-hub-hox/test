const secureEnv = require('secure-env');
const fs = require('fs');
require('dotenv').config();

const envVars = secureEnv({
  secret: 'EAlAiD3Pac4JeTwQcdHH', //TODO: need to find a place to store this secret or do we need to pass this as env variable while running
  path: '.env.dev.enc',
});

// Function to format object keys and values as environment variables
function formatEnv(envVars) {
  return Object.entries(envVars)
    .map(([key, value]) => `${key.toUpperCase()}=${value}`)
    .join('\n');
}

// Function to write the env data into .env
function writeToEnvFile(envData) {
  fs.writeFileSync('.env', envData);
}

function extract() {
  const envData = formatEnv(envVars);
  writeToEnvFile(envData);
  console.log('.env file created successfully.');
}

extract();
