#!/bin/sh

# Determine which decrypt script to run based on NODE_ENV
case "$NODE_ENV" in
    production)
        decrypt_script="decrypt-prod.js"
        ;;
    development)
        decrypt_script="decrypt-dev.js"
        ;;
    staging)
        decrypt_script="decrypt-stg.js"
        ;;
    *)
        echo "Unknown or unset NODE_ENV, defaulting to development..."
        decrypt_script="decrypt-dev.js"
        ;;
esac

# Run decrypt script followed by main script
echo "Running $NODE_ENV script..."
node "$decrypt_script"
node dist/main.js
