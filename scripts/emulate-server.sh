pkill java || sleep 3
firebase use default
nx build server
if [ ! -d "$INIT_CWD/logs" ]
then
    echo "Creating logs directory"
    mkdir "$INIT_CWD/logs"
fi
concurrently 'sleep 5 && cd $INIT_CWD/logs && firebase emulators:start' 'nx build server --watch'
