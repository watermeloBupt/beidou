#! /bin/bash
rm -rf wallet/*

node enrollAdmin.js
sleep 3

node registerUser.js
sleep 3

nohup node testinvoke.js &

# test and init
#node trypost.js
