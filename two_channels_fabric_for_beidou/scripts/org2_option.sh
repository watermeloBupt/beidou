echo "Installing smart contract on peer0.org2.example.com"
set -x
export ORDERER_CA=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem
peer channel join \
  -b channel01.block \
  --tls \
  --cafile $ORDERER_CA
peer channel update \
  -o orderer.example.com:7050 \
  -c channel01 \
  -f /opt/gopath/src/github.com/hyperledger/fabric/peer/channel-artifacts/Org2MSPanchors_channel01.tx \
  --tls --cafile $ORDERER_CA
peer channel join \
  -b channel02.block \
  --tls \
  --cafile $ORDERER_CA
peer channel update \
  -o orderer.example.com:7050 \
  -c channel02 \
  -f /opt/gopath/src/github.com/hyperledger/fabric/peer/channel-artifacts/Org2MSPanchors_channel02.tx \
  --tls \
  --cafile $ORDERER_CA
peer channel list

sleep 10

peer chaincode install -n myccone -p github.com/chaincode/projectChaincode01 -v 1.0
peer chaincode install -n mycctwo -p github.com/chaincode/projectChaincode02 -v 1.0

peer chaincode instantiate -o orderer.example.com:7050 --tls \
  --cafile $ORDERER_CA -C channel01 -c '{"Args":[]}' \
  -n myccone -v 1.0 -P "OR('Org1MSP.peer', 'Org2MSP.peer')"
peer chaincode instantiate -o orderer.example.com:7050 --tls \
  --cafile $ORDERER_CA -C channel02 -c '{"Args":[]}' \
  -n mycctwo -v 1.0 -P "OR('Org1MSP.peer', 'Org2MSP.peer')"