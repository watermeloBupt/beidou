echo "Installing smart contract on peer0.org1.example.com"
set -x
export ORDERER_CA=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem
peer channel create \
  -o orderer.example.com:7050 \
  -c channel01 \
  -f /opt/gopath/src/github.com/hyperledger/fabric/peer/channel-artifacts/channel01.tx \
  --tls \
  --cafile ${ORDERER_CA}
peer channel join \
  -b channel01.block \
  --tls \
  --cafile ${ORDERER_CA}
peer channel update \
  -o orderer.example.com:7050 \
  -c channel01 \
  -f /opt/gopath/src/github.com/hyperledger/fabric/peer/channel-artifacts/Org1MSPanchors_channel01.tx \
  --tls \
  --cafile ${ORDERER_CA}
peer channel create \
  -o orderer.example.com:7050 \
  -c channel02 \
  -f /opt/gopath/src/github.com/hyperledger/fabric/peer/channel-artifacts/channel02.tx \
  --tls \
  --cafile ${ORDERER_CA}
peer channel join \
  -b channel02.block \
  --tls \
  --cafile ${ORDERER_CA}
peer channel update \
  -o orderer.example.com:7050 \
  -c channel02 \
  -f /opt/gopath/src/github.com/hyperledger/fabric/peer/channel-artifacts/Org1MSPanchors_channel02.tx \
  --tls \
  --cafile ${ORDERER_CA}
peer channel list
sleep 5
peer chaincode install -n myccone -p github.com/chaincode/projectChaincode01 -v 1.0
peer chaincode install -n mycctwo -p github.com/chaincode/projectChaincode02 -v 1.0
