#!/bin/env bash

# install
docker build -t applog-base -f tasks/integration/dockerfiles/baseDockerfile .;
docker build -t applog-crossbar -f tasks/integration/dockerfiles/crossbarDockerfile .;
docker build -t applog-service -f tasks/integration/dockerfiles/applogDockerfile .;
docker build -t applog-test -f tasks/integration/dockerfiles/testDockerfile .;

# start services
echo "starting database...";
docker run -d \
	--name applog-db \
	memsql/quickstart;
sleep 15;
docker run --rm --link applog-db:memsql memsql/quickstart memsql-shell -e "create database test"

echo "starting crossbar...";
docker run -d \
  --name applog-crossbar \
  applog-crossbar;
sleep 10;

echo "starting applog-service...";
docker run -d \
  --name applog-service \
  --link applog-db:db \
  --link applog-crossbar:crossbar \
  applog-service;
sleep 10;

echo "running test...";
docker run \
  --name applog-test \
  --link applog-db:db \
  --link applog-crossbar:crossbar \
  applog-test;
TEST_EC=$?;

# return with the exit code of the test
if [ $TEST_EC -eq 0 ]
then
  echo "It Saul Goodman !";
  exit 0;
else
  exit $TEST_EC;
fi
