#!/bin/bash
npx tsc
docker build -t bsd-street-scanning/ding-sign:latest .
docker tag bsd-street-scanning/ding-sign:latest 192.168.1.53:5000/bsd-street-scanning/ding-sign:latest
docker push 192.168.1.53:5000/bsd-street-scanning/ding-sign:latest
