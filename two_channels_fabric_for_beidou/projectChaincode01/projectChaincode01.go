package main

import (
    "fmt"
    "encoding/json"

    "github.com/hyperledger/fabric/core/chaincode/shim"
    "github.com/hyperledger/fabric/protos/peer"
)

type SimpleChaincode struct {
}

// 定义存储设备信息的结构体
type Record struct {
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
}


/**
链码实例化，对应peer chaincode instantiate
 */
 func (t *SimpleChaincode) Init (stub shim.ChaincodeStubInterface) peer.Response{
	return shim.Success(nil)
 }

/**
调用链码，对应peer chaincode invoke
 */
 func (t *SimpleChaincode) Invoke(stub shim.ChaincodeStubInterface) peer.Response {
    function, args := stub.GetFunctionAndParameters()
    if function == "verify" {
        return t.verify(stub, args)
    } else if function == "query" {
        return t.query(stub, args)
    } 
	
    // 输入的函数名不是verify则报错
    return shim.Error("Invalid invoke function name. Expecting \"verify\" or \"query\". ")
}

/**
链码的主要逻辑
*/
func (t *SimpleChaincode) verify(stub shim.ChaincodeStubInterface, args []string) peer.Response {
    // _, args := stub.GetFunctionAndParameters()
    var err error

	// 首先，检查输入参数是否合法
    if len(args) != 15 {
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

    mainKey := macAddress

    var record = Record{IpAddress: ipAddress, MacAddress: macAddress, CpuPhysicalCores: cpuPhysicalCores, 
        InstructionSet: instructionSet, CpuSpeed: cpuSpeed, CpuVersion: cpuVersion, 
        CpuRegisterInfo: cpuRegisterInfo, SystemMemorySize: systemMemorySize, SystemHardDiskSize: systemHardDiskSize, 
        Imei: imei, Imsi: imsi, Iccid: iccid, BusinessPort: businessPort, RegistrationTime: registrationTime, BeidouMsg: beidouMsg}
    
    checkResult := Record{
        IpAddress: "true",
        MacAddress: "true",
        CpuPhysicalCores: "true",
        InstructionSet: "true",
        CpuSpeed: "true",
        CpuVersion: "true",
        CpuRegisterInfo: "true",
        SystemMemorySize: "true",
        SystemHardDiskSize: "true",
        Imei: "true",
        Imsi: "true",
        Iccid: "true",
        BusinessPort: "true",
        RegistrationTime: "true",
        BeidouMsg: "true",
    }
	/**
    recordAsBytes, _ := json.Marshal(record)
    err = stub.PutState(mainKey, recordAsBytes)
    if err != nil {
        return shim.Error(err.Error())
    }
    checkResultAsBytes, _ := json.Marshal(checkResult)
    return shim.Success(checkResultAsBytes)
 	*/ 
    
	// 然后，查看主键是否已经存在
	getRecordBytes, err := stub.GetState(mainKey)
    if err != nil {
        return shim.Error("Failed to get state")
    }
    if getRecordBytes == nil {
		// 当主键不存在时，将这台设备记录
        recordAsBytes, _ := json.Marshal(record)
        err = stub.PutState(mainKey, recordAsBytes)
		if err != nil {
			return shim.Error(err.Error())
		}
        checkResultAsBytes, _ := json.Marshal(checkResult)
        return shim.Success(checkResultAsBytes)
    }
    
    // 逐个校验每一个字段
    var getRecord Record
    json.Unmarshal(getRecordBytes, &getRecord)

    if (getRecord.IpAddress != ipAddress){
        checkResult.IpAddress = "false"
    }
    if (getRecord.MacAddress != macAddress){
        checkResult.MacAddress = "false"
    }
    if (getRecord.CpuPhysicalCores != cpuPhysicalCores){
        checkResult.CpuPhysicalCores = "false"
    }
    if (getRecord.InstructionSet != instructionSet){
        checkResult.InstructionSet = "false"
    }
    if (getRecord.CpuSpeed != cpuSpeed){
        checkResult.CpuSpeed = "false"
    }
    if (getRecord.CpuVersion != cpuVersion){
        checkResult.CpuVersion = "false"
    }
    if (getRecord.CpuRegisterInfo != cpuRegisterInfo){
        checkResult.CpuRegisterInfo = "false"
    }
    if (getRecord.SystemMemorySize != systemMemorySize){
        checkResult.SystemMemorySize = "false"
    }
    if (getRecord.SystemHardDiskSize != systemHardDiskSize){
        checkResult.SystemHardDiskSize = "false"
    }
    if (getRecord.Imei != imei){
        checkResult.Imei = "false"
    }
    if (getRecord.Imsi != imsi){
        checkResult.Imsi = "false"
    }
    if (getRecord.Iccid != iccid){
        checkResult.Iccid = "false"
    }
    if (getRecord.BusinessPort != businessPort){
        checkResult.BusinessPort = "false"
    }
    if (getRecord.BeidouMsg != beidouMsg){
        checkResult.BeidouMsg = "false"
    }

    checkResultAsBytes, _ := json.Marshal(checkResult)

    return shim.Success(checkResultAsBytes)
    
}


/**
查询函数，查看链码中已有的信息
*/
func (t *SimpleChaincode) query(stub shim.ChaincodeStubInterface, args []string) peer.Response {
    if len(args) > 0 {
        return shim.Error("Incorrect number of arguments. Expecting 0")
    }

    var records []Record
    // 这里主键的范围需要调试
    resultsIterator, err := stub.GetStateByRange("00:00:00:00:00:00", "FF:FF:FF:FF:FF:FF")
	if err != nil {
		return shim.Error(err.Error())
	}
    defer resultsIterator.Close()

    for resultsIterator.HasNext() {
		aKeyValue, err := resultsIterator.Next()
		if err != nil {
			return shim.Error(err.Error())
		}
		queryKeyAsStr := aKeyValue.Key
        _ = queryKeyAsStr
		queryValAsBytes := aKeyValue.Value
		var record Record
		json.Unmarshal(queryValAsBytes, &record)
		records = append(records, record)
	}

    recordsAsBytes, _ := json.Marshal(records)
    return shim.Success(recordsAsBytes)
}

// 主函数 ，调用 shim.Start 方法
func main() {
    err := shim.Start(new(SimpleChaincode))

    if( err!= nil){
        fmt.Printf("Error starting Simple Chaincode is %s \n",err)
    }
}
