#! /bin/bash
rm -rf wallet/*

node enrollAdmin.js
sleep 10

node registerUser.js
sleep 10

node testinvoke.js

# test and init
#node trypost.js
