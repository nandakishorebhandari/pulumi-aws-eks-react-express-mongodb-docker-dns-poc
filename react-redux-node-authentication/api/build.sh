#!/bin/bash

#usage parameters:
# deployment/build.sh <repo> <image> <tag> <branch>

REPO="nandab96"
NAME=$1
BRANCH=$2

docker rmi -f $NAME
docker build -t $NAME .

docker tag $NAME $REPO/$NAME:$BRANCH
docker push $REPO/$NAME:$BRANCH
