package main

/*
本链码用于实现“行为日志可信审计的功能”
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
type ActionLog struct {
	ActionTime string `json:"actionTime"`
	Operator   string `json:"operator"`
	Action     string `json:"action"`
	Detail     string `json:"detail"`
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
	actionTime := args[0]
	actionLog := ActionLog{
		ActionTime: args[0],
		Operator:   args[1],
		Action:     args[2],
		Detail:     args[3],
	}

	getHistory, err := stub.GetState(actionTime)
	if err != nil {
		respAsByte, _ := json.Marshal(Resp{
			Code: "0",
			Data: "Failed to get state",
		})
		return shim.Error(respAsByte)
	}

	if getHistory != nil {
		respAsByte, _ := json.Marshal(Resp{
			Code: "0",
			Data: "Primary key conflict exists",
		})
		return shim.Error(respAsByte)
	} else {
		err := stub.PutState(actionTime, actionLog)
		if err != nil {
			respAsByte, _ := json.Marshal(Resp{
				Code: "0",
				Data: "Failed to put state",
			})
			return shim.Error(respAsByte)
		}
		respAsByte, _ := json.Marshal(Resp{
			Code: "1",
			Data: "You inserted a action log successfully.",
		})
		return shim.Success(respAsByte)
	}
}

func (t *ActionLogChainCode) getAll(stub shim.ChaincodeStubInterface, args []string) peer.Response {
	// 简单查询所有，不应该带有
	if len(args) > 0 {
		respAsByte, _ := json.Marshal(Resp{
			Code: "0",
			Data: "Incorrect number of arguments. Expecting 0",
		})
		return shim.Error(respAsByte)
	}

	var actionLogs []ActionLog

	actionLogsIterator, err := stub.GetStateByRange("0000-00-00 00:00:00", "9999-99-99 99:99:99")
	if err != nil {
		respAsByte, _ := json.Marshal(Resp{
			Code: "0",
			Data: err.Error(),
		})
		return shim.Error(respAsByte)
	}

	defer actionLogsIterator.Close()

	for actionLogsIterator.HasNext() {
		kv, err := actionLogsIterator.Next()
		if err != nil {
			return shim.Error(err.Error())
		}
		// keyAsString := kv.Key
		valAsByte := kv.Value
		var actionLog ActionLog
		json.Unmarshal(valAsByte, &actionLog)
		actionLogs = append(actionLogs, actionLog)
	}

	actionLogsAsByte, _ := json.Marshal(Resp{
		Code: "1",
		Data: actionLogs,
	})
	return shim.Success(actionLogsAsByte)
}

func main() {
	err := shim.Start(new(ActionLogChainCode))
	if err != nil {
		fmt.Printf("Error starting Simple Chaincode is %s \n", err)
	}
}
