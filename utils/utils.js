const { poseidonContract } = require("circomlibjs");
const abiPoseidon = poseidonContract.generateABI(5);
const bytecodePoseidon = poseidonContract.createCode(5);
const { ethers } = require("hardhat");
const { readFileSync } = require("fs");
const util = require("util");
const { randomBytes } = require("crypto");
const exec = util.promisify(require("child_process").exec);

// All inputs should be in field format (i.e., an integer modulo the 254-bit prime)
const createLeaf = async (address, secret, countryCode, subdivision, completedAt, birthdate) => {
  const r = randomBytes(16).toString("hex"); // Random bytes in the tmp filename so it won't be overwritten by another process runnign in parallel
  const cliArgs = [address, secret, countryCode, subdivision, completedAt, birthdate].join(" ");
  await exec(`zokrates compute-witness -a ${cliArgs} -i zk/compiled/createLeaf.out -o zk/tmp/${r}.tmp.witness`);
  // Format output to just get witness:
  return readFileSync(`zk/tmp/${r}.tmp.witness`).toString().split("\n")[0].split(" ")[1];
}

// All inputs should be in field format (i.e., an integer modulo the 254-bit prime)
const createLeafAdditionProof = async (address, countryCode, subdivision, completedAt, birthdate, oldSecret, newSecret) => {
    const r = randomBytes(16).toString("hex"); // Random bytes in the tmp filename so it won't be overwritten by another process runnign in parallel
    const oldLeaf = await createLeaf(address, oldSecret, countryCode, subdivision, completedAt, birthdate);
    const newLeaf = await createLeaf(address, newSecret, countryCode, subdivision, completedAt, birthdate);
    const cliArgs = [oldLeaf, newLeaf, address, countryCode, subdivision, completedAt, birthdate, oldSecret, newSecret].join(" ");
    await exec(`zokrates compute-witness -a ${cliArgs} -i zk/compiled/onAddLeaf.out -o zk/tmp/${r}.tmp.witness`);
    await exec(`zokrates generate-proof -i zk/compiled/onAddLeaf.out -w zk/tmp/${r}.tmp.witness -p zk/pvkeys/onAddLeaf.proving.key -j zk/tmp/${r}.proof.json`);
    
    return JSON.parse(readFileSync(`zk/tmp/${r}.proof.json`));
}

const deployPoseidon = async () => {
    const [account] = await ethers.getSigners();
    const PoseidonContractFactory = new ethers.ContractFactory(
        abiPoseidon,
        bytecodePoseidon,
        account
    );
    return await PoseidonContractFactory.deploy();
}

// gets a Posiedon contract at address
const attachPoseidon = async (address) => {
    const [account] = await ethers.getSigners();
    const PoseidonContractFactory = new ethers.ContractFactory(
        abiPoseidon,
        bytecodePoseidon,
        account
    );
    return await PoseidonContractFactory.attach(address);
}

/* Initializes all relevant smart contracts and return their addresses
 * Can pass addresses for contracts that have already been deployed like such:
 * init({
 *   POSEIDONT6_ADDRESS : "0xabc",
 *   RESSTORE_ADDRESS : "0x123",
 * })
 */
async function initContracts(addresses) {
    const {
        POSEIDONT6_ADDRESS,
        INCREMENTALQUINTREE_ADDRESS,
        HUB_ADDRESS,
        COUNTRYVERIFIER_ADDRESS,
        RESSTORE_ADDRESS,
    } = 
    {
        POSEIDONT6_ADDRESS : "",
        INCREMENTALQUINTREE_ADDRESS : "",
        HUB_ADDRESS : "",
        COUNTRYVERIFIER_ADDRESS : "",
        RESSTORE_ADDRESS : "",
        ...addresses
    }
    
  
    const [admin] = await ethers.getSigners();
    const pt6 = POSEIDONT6_ADDRESS ? await attachPoseidon(POSEIDONT6_ADDRESS) : await deployPoseidon();
    await pt6.deployed();
  
    const iqtFactory = await ethers.getContractFactory("IncrementalQuinTree", 
    {
        libraries : {
        PoseidonT6 : pt6.address
        }
    });
  
    const iqt = INCREMENTALQUINTREE_ADDRESS ? await iqtFactory.attach(INCREMENTALQUINTREE_ADDRESS) : await iqtFactory.deploy();
    await iqt.deployed();
  
    const hubFactory = await ethers.getContractFactory("Hub", {
      libraries : {
          IncrementalQuinTree : iqt.address
      } 
    });
    const hub = HUB_ADDRESS ? await hubFactory.attach(HUB_ADDRESS) : await hubFactory.deploy(admin.address);
    await hub.deployed();
  
    const router = await (await ethers.getContractFactory("ProofRouter")).attach(await hub.router());
    await router.deployed();
  
    const verifierFactory = await ethers.getContractFactory("ProofOfCountry");
    const verifier = COUNTRYVERIFIER_ADDRESS ? await verifierFactory.attach(COUNTRYVERIFIER_ADDRESS) : await verifierFactory.deploy();
    await verifier.deployed();
  
    try {
      await router.addRoute("USResident", verifier.address)
    } catch(e) {
      console.error("There was an error adding the USResident route. This probably means the route has already been added and is no big deal in this case. However, we cannot gaurantee that was the case. Error was", e)
    }
  
    const resStoreFactory = await ethers.getContractFactory("ResidencyStore"); 
    const resStore = RESSTORE_ADDRESS ? await resStoreFactory.attach(RESSTORE_ADDRESS) : await (resStoreFactory).deploy(hub.address);
    await resStore.deployed();
  
    const result = {
      pt6 : pt6, 
      iqt : iqt, 
      hub : hub, 
      router : router, 
      verifier : verifier, 
      resStore : resStore
    }
    // Log all contract addresses
    console.log("------------Contract addresses:------------");
    Object.keys(result).forEach((key) => console.log(key, result[key].address));
    console.log("-------------------------------------------");
    return result;
    
}

exports.createLeaf = createLeaf; 
exports.createLeafAdditionProof = createLeafAdditionProof; 
exports.attachPoseidon = attachPoseidon;
exports.deployPoseidon = deployPoseidon;
exports.initContracts = initContracts;