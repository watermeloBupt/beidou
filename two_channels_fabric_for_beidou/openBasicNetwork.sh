set -x
## 清理环境
cp -r ./projectChaincode01 ../chaincode/
cp -r ./projectChaincode02 ../chaincode/
##  合约3开始
cp -r ./projectChaincode03 ../chaincode/
cp -r ./projectChaincode04 ../chaincode/
##  合约3结束

rm -rf ./channel-artifacts && rm -rf ./crypto-config
docker-compose down -v
docker rm $(docker ps -aq)
docker rmi $(docker images dev-* -q)

##
../bin/cryptogen generate --config=./crypto-config.yaml

##
mkdir channel-artifacts && export FABRIC_CFG_PATH=${PWD}

../bin/configtxgen -profile OrdererGenesis \
  -outputBlock ./channel-artifacts/genesis.block

export CHANNEL_ONE_NAME=channel01
export CHANNEL_ONE_PROFILE=Channel01
export CHANNEL_TWO_NAME=channel02
export CHANNEL_TWO_PROFILE=Channel02

../bin/configtxgen -profile ${CHANNEL_ONE_PROFILE} \
  -outputCreateChannelTx ./channel-artifacts/${CHANNEL_ONE_NAME}.tx \
  -channelID $CHANNEL_ONE_NAME

../bin/configtxgen -profile ${CHANNEL_TWO_PROFILE} \
  -outputCreateChannelTx ./channel-artifacts/${CHANNEL_TWO_NAME}.tx \
  -channelID $CHANNEL_TWO_NAME

../bin/configtxgen -profile ${CHANNEL_ONE_PROFILE} \
  -outputAnchorPeersUpdate ./channel-artifacts/Org1MSPanchors_${CHANNEL_ONE_NAME}.tx \
  -channelID $CHANNEL_ONE_NAME -asOrg Org1MSP

../bin/configtxgen -profile ${CHANNEL_ONE_PROFILE} \
  -outputAnchorPeersUpdate ./channel-artifacts/Org2MSPanchors_${CHANNEL_ONE_NAME}.tx \
  -channelID $CHANNEL_ONE_NAME -asOrg Org2MSP

../bin/configtxgen -profile ${CHANNEL_TWO_PROFILE} \
  -outputAnchorPeersUpdate ./channel-artifacts/Org1MSPanchors_${CHANNEL_TWO_NAME}.tx \
  -channelID $CHANNEL_TWO_NAME -asOrg Org1MSP

../bin/configtxgen -profile ${CHANNEL_TWO_PROFILE} \
  -outputAnchorPeersUpdate ./channel-artifacts/Org2MSPanchors_${CHANNEL_TWO_NAME}.tx \
  -channelID $CHANNEL_TWO_NAME -asOrg Org2MSP

cd crypto-config/peerOrganizations/org1.example.com/ca/
export PRIV_KEY=$(ls *_sk)
cd "$FABRIC_CFG_PATH"
cp docker-compose.yaml.temp docker-compose.yaml

sed -i "s/PRIV_KEY/${PRIV_KEY}/g" docker-compose.yaml

##
docker-compose up -d
docker ps

chmod 777 ./scripts/org1_option.sh
chmod 777 ./scripts/org2_option.sh

bash -c "docker exec -it cli bash -c \"cd scripts;chmod 777 ./org1_option.sh;./org1_option.sh\""
bash -c "docker exec -e "CORE_PEER_LOCALMSPID=Org2MSP" -e "CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt" -e "CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org2.example.com/users/Admin@org2.example.com/msp" -e "CORE_PEER_ADDRESS=peer0.org2.example.com:7051" -it cli bash -c \"cd scripts;chmod 777 ./org2_option.sh;./org2_option.sh\""

#chmod 777 ./org1_option.sh
#chmod 777 ./org2_option.sh
#
#gnome-terminal -e 'bash -c "docker exec -it cli bash -c \"cd scripts;chmod 777 ./org1_option.sh;./org1_option.sh\""'
#gnome-terminal -e 'bash -c "docker exec -e "CORE_PEER_LOCALMSPID=Org2MSP" -e "CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt" -e "CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org2.example.com/users/Admin@org2.example.com/msp" -e "CORE_PEER_ADDRESS=peer0.org2.example.com:7051" -it cli bash -c \"cd scripts;chmod 777 ./org2_option.sh;./org2_option.sh\""'

##
sleep 22
cd javascript/
./startapp.sh

set +x