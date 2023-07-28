/*
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

const { FileSystemWallet, Gateway } = require('fabric-network');
const express = require('express');
const path = require('path');
const res = require('express/lib/response');
const req = require('express/lib/request');
const net = require('net');

const moment = require('moment');
const { application } = require('express');
const listeningPort = '2233'    // 接口服务监听的端口号
const axios = require('axios')

//日志相关，暂时无用
const fs = require('fs');
let options = {
 flags: 'a', 
 encoding: 'utf8', // utf8编码
}
let stderr = fs.createWriteStream('./system.log', options);
// 创建logger
let logger = new console.Console(stderr);


const app = express();

app.use(express.urlencoded({ extended: true }))
app.use(express.json());

var bodyParser = require('body-parser')
var multiparty = require('connect-multiparty')

//处理 application/json
app.use(bodyParser.json())

//处理 mutipart/form-data
app.use(multiparty())

const ccpPath = path.resolve(__dirname, '..', 'connection-org1.json');

// 定义一个缓存类
class DataCache {
    constructor() {
        this.cache = new Map();
        this.capacity = 1000;    // 缓存的最大容量
    }

    set(key, value) {
        // 超过容量，删除最老的键值对
        if (this.cache.size >= this.capacity) {
            const oldestKey = this.cache.keys().next().value;
            this.cache.delete(oldestKey);
        }
        this.cache.set(key, value);
    }

    get(key) {
        return this.cache.get(key);
    }

    has(key) {
        return this.cache.has(key);
    }
}
//var cache = new DataCache();    // 创建实例
var index = 1

async function main() {
    try {

        // Create a new file system based wallet for managing identities.
        const walletPath = path.join(process.cwd(), 'wallet');
        const wallet = new FileSystemWallet(walletPath);
        console.log(`Wallet path: ${walletPath}`);

        // Check to see if we've already enrolled the user.
        const userExists = await wallet.exists('user1');
        if (!userExists) {
            console.log('An identity for the user "user1" does not exist in the wallet');
            console.log('Run the registerUser.js application before retrying');
            return;
        }
		
        // Create a new gateway for connecting to our peer node.
        const gateway = new Gateway();
        await gateway.connect(ccpPath, { wallet, identity: 'user1', discovery: { enabled: true, asLocalhost: true } });

        // Get the network (channel) our contract is deployed to.
        const network1 = await gateway.getNetwork('channel01');
        const network2 = await gateway.getNetwork('channel02');


        // Get the contract from the network.
        // 对象的创建路径：wallet -> gateway -> network -> contract
        // 最终通过合同（对应于编写的智能合约逻辑），实现对区块链的调用
        const contract1 = network1.getContract('myccone');
        const contract2 = network2.getContract('mycctwo');

        // 接受认证请求的接口，POST类型
        // 这里是主要逻辑
        app.post('/api/authDevice', async function(req, res){
//            console.log("\n——————————————————————————————\n");
//            console.log(req.body.data);
//            console.log('get information:', req.body);
            // res.json({result: "Connected Success!"});
//            req.body = JSON.parse(Object.keys(req.body)[0]);
//            console.log('get information:', req.body)
            try {
                let currentTime = moment(Date.now()).format('YYYY-MM-DD HH:mm:ss')
           
//                const startTime = new Date();   // 获取当次认证的开始时间
//                var result = await contract1.submitTransaction('verify', req.body.ipAddress, req.body.macAddress, req.body.cpuPhysicalCores, req.body.instructionSet, req.body.cpuSpeed, req.body.cpuVersion, req.body.cpuRegisterInfo, req.body.systemMemorySize, req.body.systemHardDiskSize, req.body.imei, req.body.imsi, req.body.iccid, req.body.businessPort, currentTime, req.body.beidouMsg);
//                const endTime = new Date()      // 获取当前认证的结束时间
//                const timeDiff = endTime.getTime() - startTime.getTime();
//                console.log(`Time difference in milliseconds: ${timeDiff}`);
			 
                var result = await contract1.submitTransaction('verify', req.body.ipAddress, req.body.macAddress, req.body.cpuPhysicalCores, req.body.instructionSet, req.body.cpuSpeed, req.body.cpuVersion, req.body.cpuRegisterInfo, req.body.systemMemorySize, req.body.systemHardDiskSize, req.body.imei, req.body.imsi, req.body.iccid, req.body.businessPort, currentTime, req.body.beidouMsg);
                result = JSON.parse(result)
			 
//			 if (cache.has(req.body.macAddress)) {
//                	// 缓存命中，将请求数据与缓存数据对比
//               	var result = compareReqWithCache(req.body, cache.get(req.body.macAddress))
//           	 } else {
//               	// 缓存不命中，去DB中搜索
//               	var result = await contract1.submitTransaction('verify', req.body.ipAddress, req.body.macAddress, req.body.cpuPhysicalCores, req.body.instructionSet, req.body.cpuSpeed, req.body.cpuVersion, req.body.cpuRegisterInfo, req.body.systemMemorySize, req.body.systemHardDiskSize, req.body.imei, req.body.imsi, req.body.iccid, req.body.businessPort, currentTime, req.body.beidouMsg);
//               	result = JSON.parse(result)
//           	}
                
                res.json(result)
                // 检查插入结果
                var wrongDetail = "Wrong"
                for(var val in result) {
                    if(val == 'registrationTime') continue;
                    if(result[val] == 'false') {
                        wrongDetail += (" " + String(val));
                    }
                }
                // 检查出错误，将错误信息存储到拎一个channel按上去
                if(wrongDetail !== "Wrong"){
                	currentTime = currentTime + "-" + index
                	index += 1
                    var warningResult = await contract2.submitTransaction('verify', currentTime, req.body.macAddress, req.body.ipAddress, wrongDetail);
                    console.log("--------"+warningResult)
                } 
//                else if(!cache.has(req.body.macAddress)){
//                    // 认证正确，或者新注册，更新缓存
//                    cache.set(req.body.macAddress, req.body);
//                }

                // 记录日志
//                logger.log("[ " + currentTime + " ] " + "Docker " + dockerID + " handles this request from \"" + req.body.ipAddress + "\"")
//                dockerID += 1
//                dockerID %= 3

            } catch(error) {
                console.error(error);
                res.send(String(error));
            }
//            console.log("An authentication request was processed. Procedure");
            
        });

        // 展示所有设备信息，GET类型接口
        app.get('/api/queryDevice', async function(req, res) {
            try {
                console.log("I get a GET request for devices");
                var result = await contract1.submitTransaction('query');
                result = result.toString();
                var output_data = {
                    'code': '1',
                    'data': result
                }
                res.json(output_data);
            } catch(error) {
                console.error(error);
                res.json({
                    'code': '0',
                    "data": []
                });
            }
        });


        // 展示所有告警，GET类型接口
        app.get('/api/queryWarning', async function(req, res) {
            try {
                console.log("I get a GET request to get WARNINGs");
                var result = await contract2.submitTransaction('query');
                result = result.toString();
                var output_data = {
                    'code': '1',
                    'data': result
                }
                res.json(output_data);
            } catch(error) {
                console.error(error);
                res.json({
                    'code': '0',
                    'data': []
                });
            }
            
            // console.log('Transaction has been submitted');
        });

        
        // 调用阻塞特定设备，暂时做假数据，全返回成功
        app.post('/api/blockFlow', async function(req, res) {
            console.log(req.body)
            res.json({
                        'code': '1',
                        'result': true,
                        'details': ""
                    })
        })

    } catch (error) {
        console.error(`Failed to submit transaction: ${error}`);
        process.exit(1);
    }
        
}

function compareReqWithCache(json1, json2) {
    const result = {};
    const keys = Object.keys(json1);
  
    for (const key of keys) {
      if (json1[key] === json2[key]) {
        result[key] = 'true';
      } else {
        result[key] = 'false';
      }
    }
    return result;
  }


app.listen(listeningPort, () => {
    console.log('正在监听端口:'+listeningPort);
});

main();

setTimeout(() => console.log('请开始测试'), 5000)
