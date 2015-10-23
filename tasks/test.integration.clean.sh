#!/bin/env bash

# stop
docker stop applog-service;
docker stop applog-crossbar;
docker stop applog-db;

# clean
docker rm applog-test;
docker rm applog-service;
docker rm applog-crossbar;
docker rm applog-db;

# uninstall
docker rmi applog-test;
docker rmi applog-service;
docker rmi applog-crossbar;
docker rmi applog-base;
