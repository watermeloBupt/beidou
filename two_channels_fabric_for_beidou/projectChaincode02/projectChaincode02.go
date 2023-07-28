package main

import (
    "fmt"
    "encoding/json"

    "github.com/hyperledger/fabric/core/chaincode/shim"
    "github.com/hyperledger/fabric/protos/peer"
)

type SimpleChaincode struct {
}

// 记录认证过程中的错误请求，
// 包含告警时间、标识ip的mac地址、ip地址字段，
// 以及告警明细。
// 明细说明了此次报警产生的原因

type WarningRecord struct {
    WarningTime string `json:"warningTime"`
    MacAddress string `json:"macAddress"`
    IpAddress string `json:"ipAddress"`
    WarningDetail string `json:"warningDetail"`
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
    if len(args) != 4 {
        return shim.Error("Incorrect number of arguments. Expecting 4")
    }

    // 将参数暂存并输出
    warningTime := args[0]
    macAddress := args[1]
    ipAddress := args[2]
    warningDetail := args[3]

    mainKey := warningTime  // 以报警时间作为主键，一般来说不会产生主键冲突

    var record = WarningRecord{WarningTime: warningTime, MacAddress: macAddress, IpAddress: ipAddress, WarningDetail: warningDetail}
    
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

		return shim.Success([]byte("Insert a warning detail."))

    }

    return shim.Success([]byte("Insert WRONGING!!!"))
}
/**
查询函数，查看链码中已有的信息，为展示接口服务
*/
func (t *SimpleChaincode) query(stub shim.ChaincodeStubInterface, args []string) peer.Response {
    if len(args) > 0 {
        return shim.Error("Incorrect number of arguments. Expecting 0")
    }

    var records []WarningRecord
    // 这里主键的范围需要调试
    resultsIterator, err := stub.GetStateByRange("0000-00-00 00:00:00", "9999-99-99 99:99:99")
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
		var record WarningRecord
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
