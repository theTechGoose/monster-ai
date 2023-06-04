
#!/bin/bash

NODE_APP_PATH="/home/raphael/monster-ai/dist/apps/five-nine-recordings/main.js"

while true
do
    if ! pgrep -f "$NODE_APP_PATH"
    then
        echo "Starting Node.js app..."
        node $NODE_APP_PATH
    fi
    sleep 1
done
