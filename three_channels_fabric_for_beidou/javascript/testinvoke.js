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
        this.capacity = 100;    // 缓存的最大容量
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

class Queue {
  constructor(capacity = 100) {
    this.capacity = capacity;
    this.queue = [];
    this.sum = 0;
  }

  enqueue(item) {
    if (this.queue.length >= this.capacity) {
      const removedItem = this.queue.shift();
      this.sum -= removedItem;
    }
    this.queue.push(item);
    this.sum += item;
  }

  dequeue() {
    if (this.isEmpty()) {
      console.error("Queue is empty. Cannot dequeue from an empty queue.");
      return;
    }
    const dequeuedItem = this.queue.shift();
    this.sum -= dequeuedItem;
    return dequeuedItem; 
  }

  isEmpty() {
    return this.queue.length === 0;
  }

  size() {
    return this.queue.length;
  }

  getAverage() {
    if (this.isEmpty()) {
      console.error("Queue is empty. Cannot calculate average.");
      return -1;
    }
    return this.sum / this.queue.length;
  }

  getQueue() {
  	return this.queue;
  }
}

//var cache = new DataCache();    // 创建实例
var countWarn = 0
var countAuth = 0
var countLog = 0
var countRunLog = 0

const deviceAuthTimes = new Map();

const queue = new Queue(100);
const queueSys = new Queue(100);

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

        const channel1 = network1.getChannel();
        const channel2 = network2.getChannel();

	   const peers1 = channel1.getPeers();	
	   const peers2 = channel2.getPeers();
	
        // Get the contract from the network.
        // 对象的创建路径：wallet -> gateway -> network -> contract
        // 最终通过合同（对应于编写的智能合约逻辑），实现对区块链的调用
        const contract1 = network1.getContract('myccone');
        const contract2 = network2.getContract('mycctwo');
        // 新的chaincode安装在network1中，如果安装的不是这个网络，需要调整这部分代码
        const contract3 = network1.getContract('myccthree');
        const contract4 = network1.getContract('myccfour');


        // 接受认证请求的接口，POST类型
        // 这里是主要逻辑
        app.post('/api/authDevice', async function(req, res){
            console.log("\n——————————————————————————————\n");
            console.log(req.body.data);
            console.log('get information:', req.body);
//            res.json({result: "Connected Success!"});
//            req.body = JSON.parse(Object.keys(req.body)[0]);
//            console.log('get information:', req.body)  
            try {
                let currentTime = moment(Date.now() - 20 * 24 * 60 * 60 * 1000 * 0).format('YYYY-MM-DD HH:mm:ss')
                const startTime = new Date();   // 获取当次认证的开始时间
//                var result = await contract1.submitTransaction('verify', req.body.ipAddress, req.body.macAddress, req.body.cpuPhysicalCores, req.body.instructionSet, req.body.cpuSpeed, req.body.cpuVersion, req.body.cpuRegisterInfo, req.body.systemMemorySize, req.body.systemHardDiskSize, req.body.imei, req.body.imsi, req.body.iccid, req.body.businessPort, currentTime, req.body.beidouMsg); 
                
//                const timeDiff = endTime.getTime() - startTime.getTime();
//                console.log(`Time difference in milliseconds: ${timeDiff}`);
			 countAuth += 1
               var result = await contract1.submitTransaction('verify', req.body.ipAddress, req.body.macAddress, req.body.cpuPhysicalCores, req.body.instructionSet, req.body.cpuSpeed, req.body.cpuVersion, req.body.cpuRegisterInfo, req.body.systemMemorySize, req.body.systemHardDiskSize, req.body.imei, req.body.imsi, req.body.iccid, req.body.businessPort, currentTime, req.body.beidouMsg);
                result = JSON.parse(result)
			 const endTime = new Date()      // 获取当前认证的结束时间
			 queue.enqueue(endTime.getTime() - startTime.getTime())
			 if (!deviceAuthTimes.has(req.body.macAddress)) {
			    deviceAuthTimes.set(req.body.macAddress, []);
			  }
			  var authTime = endTime.getTime() - startTime.getTime();
			  if(authTime < 80000) {
			  	deviceAuthTimes.get(req.body.macAddress).push(authTime);
			  }
//			 if (cache.has(req.body.macAddress)) {
//                	// 缓存命中，将请求数据与缓存数据对比
//               	var result = compareReqWithCache(req.body, cache.get(req.body.macAddress))
//           	 } else {
//               	// 缓存不命中，去DB中搜索
//               	var result = await contract1.submitTransaction('verify', req.body.ipAddress, req.body.macAddress, req.body.cpuPhysicalCores, req.body.instructionSet, req.body.cpuSpeed, req.body.cpuVersion, req.body.cpuRegisterInfo, req.body.systemMemorySize, req.body.systemHardDiskSize, req.body.imei, req.body.imsi, req.body.iccid, req.body.businessPort, currentTime, req.body.beidouMsg);
//               	result = JSON.parse(result)
//           	}
			 res.json(result)
			 const daysInMillis = 20 * 24 * 60 * 60 * 1000 * 0;
                let createTime = moment(parseInt(req.body.currentTime, 10) - daysInMillis).format('YYYY-MM-DD HH:mm:ss:SSS')  
                let authBeginTime = moment(startTime.getTime() - daysInMillis).format('YYYY-MM-DD HH:mm:ss:SSS')
                let authEndTime = moment(endTime.getTime() - daysInMillis).format('YYYY-MM-DD HH:mm:ss:SSS')
                
//                console.log(startTime.getTime(), "   ", endTime.getTime())
                
			 console.log("本次认证在客户端创建的时间为：", createTime, "，到达服务器准备开始认证的时间为：", authBeginTime, "，认证结束的时间为：", authEndTime)
			 let subTimeSys = endTime.getTime() - parseInt(req.body.currentTime, 10)
			 console.log("本次认证的系统响应时间为：", subTimeSys, "ms，事务的响应时间为：", authTime, "ms")
			 queueSys.enqueue(subTimeSys)
                // 检查插入结果
                var wrongDetail = "Wrong"
                for(var val in result) {
                    if(val == 'registrationTime' || val == 'timeStamp') continue;
                    if(result[val] == 'false') {
                        wrongDetail += (" " + String(val));
                    }
                }
                // 检查出错误，将错误信息存储到拎一个channel按上去
                if(wrongDetail !== "Wrong"){
                	 countWarn += 1
                	 //currentTime = currentTime + " " + countWarn
                    var warningResult = await contract2.submitTransaction('verify', currentTime + " " + countWarn, req.body.macAddress, req.body.ipAddress, wrongDetail);
                    console.log("--------"+warningResult)
                    countRunLog += 1
                    var runLogResult = await contract4.submitTransaction('insert', req.body.ipAddress, req.body.macAddress, req.body.cpuPhysicalCores, req.body.instructionSet, req.body.cpuSpeed, req.body.cpuVersion, req.body.cpuRegisterInfo, req.body.systemMemorySize, req.body.systemHardDiskSize, req.body.imei, req.body.imsi, req.body.iccid, req.body.businessPort, currentTime + " " + countRunLog, req.body.beidouMsg, "False");
                } else {
                	countRunLog += 1
                	var runLogResult = await contract4.submitTransaction('insert', req.body.ipAddress, req.body.macAddress, req.body.cpuPhysicalCores, req.body.instructionSet, req.body.cpuSpeed, req.body.cpuVersion, req.body.cpuRegisterInfo, req.body.systemMemorySize, req.body.systemHardDiskSize, req.body.imei, req.body.imsi, req.body.iccid, req.body.businessPort, currentTime + " " + countRunLog, req.body.beidouMsg, "True");
                }
//                else if(!cache.has(req.body.macAddress)){
//                    // 认证正确，或者新注册，更新缓存
//                    cache.set(req.body.macAddress, req.body);
//                }

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
//                result = result.toString();
			  result = JSON.parse(result) 
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
//                splitIndexAndTime(result, "warningTime");
//                result = result.toString();
			 result = JSON.parse(result) 
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

        // Post接口，插入一条行为日志数据
        app.post("/api/insertAction", async function(req, res) {
//            console.log(req.body)
            try {
                let currentTime = moment(Date.now()).format('YYYY-MM-DD HH:mm:ss')
                countLog += 1
                currentTime = currentTime + " " + countLog
                var result  = await contract3.submitTransaction('insert', currentTime, req.body.ipAddress, req.body.macAddress, req.body.action, req.body.detail)
                result = result.toString();
                var output_data = {
                    'code': '1',
                    'data': result
                }
                res.json(output_data);
            } catch(error) {
                console.error(error);
                res.json({
                    "code": "0",
                    "data": String(error)
                });
            }
        });

        // Get接口，展示所有行为日志数据
        app.get("/api/getAllActions", async function(req, res) {
            try {
                var result = await contract3.submitTransaction("getAll");
//                splitIndexAndTime(result, "actionTime");
//                result = result.toString();
			 result = JSON.parse(result)
                var output_data = {
                    'code': '1',
                    'data': result
                }
                res.json(output_data);
            } catch(error) {
                console.error(error);
                res.json({
                    "code": "0",
                    "data": String(error)
                });
            }
        });

        // Get接口，展示所有行为日志数据
        app.get("/api/getAllLogs", async function(req, res) {
            try {
                var result = await contract4.submitTransaction("getAll");
//                splitIndexAndTime(result, "actionTime");
//                result = result.toString();
			  result = JSON.parse(result)
                var output_data = {
                    'code': '1',
                    'data': result
                }
                res.json(output_data);
            } catch(error) {
                console.error(error);
                res.json({
                    "code": "0",
                    "data": String(error)
                });
            }
        });

        
        // 调用阻塞特定设备，暂时做假数据，全返回成功
        app.post('/api/blockFlow', async function(req, res) {
            console.log(req.body)
            res.json({
                        'code': '1',
                        'result': true,
                        'details': ""
                    })
        });

        app.get('/api/queryDelay', async function(req, res) {
        	  const blockchainInfo1 = await channel1.queryInfo();
        	  const blockCount1 = blockchainInfo1.height.low;
//        	  console.log(`当前区块数：${blockCount1}`);
        	  const blockchainInfo2 = await channel2.queryInfo();
        	  const blockCount2 = blockchainInfo2.height.low;
//        	  console.log(`当前区块数：${blockCount2}`);
        	  const nodeCount1 = peers1.length;
//        	  console.log(`当前节点数：${nodeCount1}`);
        	  const nodeCount2 = peers2.length;
//        	  console.log(`当前节点数：${nodeCount2}`);
		let longestMacAddress = null;
		let longestAvgTime = 0;
		let systemCallTime = 0;
		console.log("================================")
		for (const [macAddress, authTimes] of deviceAuthTimes) {
			const totalAuthTime = authTimes.reduce((acc, time) => acc + time, 0);
			const avgAuthTime = totalAuthTime / authTimes.length;
			console.log("事务mac地址为：", macAddress, "，该事务的平均响应时间：", avgAuthTime.toFixed(2), "ms")
			if (avgAuthTime > longestAvgTime) {
				 longestMacAddress = macAddress;
				 longestAvgTime = avgAuthTime;
			}
		}
		console.log("================================")
		if (longestAvgTime != 0) {
			systemCallTime = longestAvgTime / (Math.random() * 15 + 52) * 100;
		}
            res.json({
                        'code': '1',
                        'blockchainNum': blockCount1 + blockCount2,
                        'contractNum': 4,
                        'nodeNum': nodeCount1 + nodeCount2,
                        'countAuth': countAuth,
                        'countWarn': countWarn,
                        'countLog': countLog,
                        'averageDelay': queue.getAverage().toFixed(2), 
                        'delayList': queue.getQueue(),
                        'longestMacAddress': longestMacAddress,
                        'longestAvgTime': longestAvgTime.toFixed(2),
                        'systemCallTime': queueSys.getAverage().toFixed(2)
                    })
        });

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

function splitIndexAndTime(result, keyVal) {
    for(var val in result) {
    	   console.log(val)
        if(val == keyVal) {
        	     console.log(result[val])
	     	const asteriskIndex = result[val].indexOf('*');
	    		if (asteriskIndex !== -1) {
	      		result[val] = result[val].substring(0, asteriskIndex);
	    		}
        }
    }
    return result;
}


app.listen(listeningPort, () => {
    console.log('正在监听端口:'+listeningPort);
});

main();

setTimeout(() => console.log('请开始测试'), 10000)
