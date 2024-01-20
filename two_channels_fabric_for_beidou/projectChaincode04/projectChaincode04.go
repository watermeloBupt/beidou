package main

/*
本链码用于实现“运行日志可信审计的功能”
*/

import (
	"encoding/json"
	"fmt"

	"github.com/hyperledger/fabric/core/chaincode/shim"
	"github.com/hyperledger/fabric/protos/peer"
)

type ActionLogChainCode struct {
}

// 每行记录的结构体
type RunLog struct {
    IpAddress string `json:"ipAddress"`
    MacAddress string `json:"macAddress"`
    CpuPhysicalCores string `json:"cpuPhysicalCores"`
    InstructionSet string `json:"instructionSet"`
    CpuSpeed string `json:"cpuSpeed"`
    CpuVersion string `json:"cpuVersion"`
    CpuRegisterInfo string `json:"cpuRegisterInfo"`
    SystemMemorySize string `json:"systemMemorySize"`
    SystemHardDiskSize string `json:"systemHardDiskSize"`
    Imei string `json:"imei"`
    Imsi string `json:"imsi"`
    Iccid string `json:"iccid"`
    BusinessPort string `json:"businessPort"`
    RegistrationTime string `json:"registrationTime"`
    BeidouMsg string `json:"beidouMsg"` //定义一个存储北斗信息的字段
    CertificateSuccess string `json:"certificateSuccess"`  //是否认证成功
}

// 返回记录的结构体
type Resp struct {
	Code string      `json:"code"`
	Data interface{} `json:"data"`
}

func (t *ActionLogChainCode) Init(stub shim.ChaincodeStubInterface) peer.Response {
	return shim.Success(nil)
}

func (t *ActionLogChainCode) Invoke(stub shim.ChaincodeStubInterface) peer.Response {
	function, args := stub.GetFunctionAndParameters()
	if function == "insert" {
		return t.insert(stub, args)
	} else if function == "getAll" {
		return t.getAll(stub, args)
	}

	return shim.Error("Invalid invoke function name. Expecting \"insert\" or \"getAll\". ")
}

func (t *ActionLogChainCode) insert(stub shim.ChaincodeStubInterface, args []string) peer.Response {
	// 首先，检查输入参数是否合法
    var err error

    if len(args) != 16 {
        return shim.Error("Incorrect number of arguments. ")
    }

    // 将参数暂存并输出
    ipAddress := args[0]
    macAddress := args[1]
    cpuPhysicalCores := args[2]
    instructionSet := args[3]
    cpuSpeed := args[4]
    cpuVersion := args[5]
    cpuRegisterInfo := args[6]
    systemMemorySize := args[7]
    systemHardDiskSize := args[8]
    imei := args[9]
    imsi := args[10]
    iccid := args[11]
    businessPort := args[12]
    registrationTime := args[13]
    beidouMsg := args[14]
    certificateSuccess := args[15]

    mainKey := registrationTime

    var record = RunLog{IpAddress: ipAddress, MacAddress: macAddress, CpuPhysicalCores: cpuPhysicalCores,
        InstructionSet: instructionSet, CpuSpeed: cpuSpeed, CpuVersion: cpuVersion,
        CpuRegisterInfo: cpuRegisterInfo, SystemMemorySize: systemMemorySize, SystemHardDiskSize: systemHardDiskSize,
        Imei: imei, Imsi: imsi, Iccid: iccid, BusinessPort: businessPort, RegistrationTime: registrationTime, BeidouMsg: beidouMsg, CertificateSuccess: certificateSuccess}

    recordAsBytes, _ := json.Marshal(record)
    err = stub.PutState(mainKey, recordAsBytes)
    if err != nil {
        return shim.Error(err.Error())
    }
    return shim.Success([]byte("You inserted a running log successfully."))
}

func (t *ActionLogChainCode) getAll(stub shim.ChaincodeStubInterface, args []string) peer.Response {
	// 简单查询所有，不应该带有
	if len(args) > 0 {
		return shim.Error("Incorrect number of arguments. Expecting 0")
	}

	var runLogs []RunLog

	runLogsIterator, err := stub.GetStateByRange("0000-00-00 00:00:00", "9999-99-99 99:99:99")
	if err != nil {
		return shim.Error(err.Error())
	}

	defer runLogsIterator.Close()

	for runLogsIterator.HasNext() {
		kv, err := runLogsIterator.Next()
		if err != nil {
			return shim.Error(err.Error())
		}
		// keyAsString := kv.Key
		valAsByte := kv.Value
		var runLog RunLog
		json.Unmarshal(valAsByte, &runLog)
		runLogs = append(runLogs, runLog)
	}


	runLogsAsBytes, _ := json.Marshal(runLogs)
	return shim.Success(runLogsAsBytes)
}

func main() {
	err := shim.Start(new(ActionLogChainCode))
	if err != nil {
		fmt.Printf("Error starting Simple Chaincode is %s \n", err)
	}
}
