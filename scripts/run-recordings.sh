
#!/bin/bash


while true
do
    if ! pgrep -f "$NODE_APP_PATH"
    then
        echo "Starting Node.js app..."
        node nx serve five-nine-recordings
    fi
    sleep 1
done
