
const { expect } = require("chai");
const { ethers } = require("hardhat");
const abi = ethers.utils.defaultAbiCoder;

describe("proveIHaveCredential", function () {
    before(async function() {
        // Set up the credentials
        [this.account, this.admin] = await ethers.getSigners();
        this.alb = await (await ethers.getContractFactory("AddLeafBig")).deploy();
        this.als = await (await ethers.getContractFactory("AddLeafSmall")).deploy();
        this.hub = await (await ethers.getContractFactory("Hub")).deploy(this.alb.address, this.als.address, this.admin.address);
        this.proofData = {"scheme":"g16","curve":"bn128","proof":{"a":["0x23fa30977e37089a0dcde3eb1ebe71275f96d5249dd7eb49379301c29edf1215","0x0fb0200d506286cc5fc3d199a1bb1963833b5db6111103932f73d16007988894"],"b":[["0x0a1d1b73761cfd92b4c8d144c4db38d7396a50f2587b1bd81d72daca79f80dfa","0x1a725882a5ac720b8261acec24277adfe64716a1ffa70981f6bff501f5541e35"],["0x2fac2cd0f0f88108fbb36d9d69c9f94d09abcd087aee5ceee50908c436a0d088","0x07a3de4247cf418cfdded0f8700b27c609dc95abb6602e980acec1ec997dca41"]],"c":["0x191e112004f4f097fa82c98012626bf29476dcb88458967913f513c26be225e9","0x18996704456fe392c34297dcc8c042536b697a6f8624ce11b393d0fdc53bc431"]},"inputs":["0x000000000000000000000000000000000000000000000000000000000a3f6bc8","0x00000000000000000000000000000000000000000000000000000000e3c5f0c9","0x00000000000000000000000000000000000000000000000000000000d4b1b69d","0x0000000000000000000000000000000000000000000000000000000043f060ac","0x000000000000000000000000000000000000000000000000000000003c976c78","0x0000000000000000000000000000000000000000000000000000000074f2e5fd","0x00000000000000000000000000000000000000000000000000000000c4a00592","0x00000000000000000000000000000000000000000000000000000000b332a9f1","0x000000000000000000000000000000000000000000000000000000007fdbe8c7","0x000000000000000000000000000000000000000000000000000000009888e835","0x000000000000000000000000000000000000000000000000000000000b61ca17","0x0000000000000000000000000000000000000000000000000000000031e83ebf","0x00000000000000000000000000000000000000000000000000000000cee524f9","0x00000000000000000000000000000000000000000000000000000000ddd7878b","0x00000000000000000000000000000000000000000000000000000000c9fccf12","0x00000000000000000000000000000000000000000000000000000000e7074647","0x00000000000000000000000000000000000000000000000000000000c8834c1f","0x00000000000000000000000000000000000000000000000000000000cf0df662","0x000000000000000000000000000000000000000000000000000000003fc8c8ed","0x0000000000000000000000000000000000000000000000000000000025064a41","0x0000000000000000000000000000000000000000000000000000000048d99388"]};
        this.oldLeaf = Buffer.from("0a3f6bc8e3c5f0c9d4b1b69d43f060ac3c976c7874f2e5fdc4a00592b332a9f1", "hex");
        this.newLeaf = Buffer.from("7fdbe8c79888e8350b61ca1731e83ebfcee524f9ddd7878bc9fccf12e7074647", "hex")
        this.issuerAddress = "0xC8834C1FcF0Df6623Fc8C8eD25064A4148D99388";
        this.creds = Buffer.from("abcde");
        this.paddedCreds = paddedCreds = Buffer.concat([this.creds], 28);
        const sig_ = await this.account.signMessage(this.oldLeaf);
        this.sig = ethers.utils.splitSignature(sig_);

        // Add the credential
        let tx = await this.hub.addLeafSmall(this.issuerAddress, this.sig.v, this.sig.r, this.sig.s, this.proofData.proof, this.proofData.inputs)
        await tx.wait();

        // Set up the Proof Router
        this.router = await (await ethers.getContractFactory("ProofRouter")).attach(await this.hub.router());
        this.alcc = await (await ethers.getContractFactory("AssertLeafContainsCredsVerifier")).deploy();
        await this.router.connect(this.admin).addRoute("proveIHaveCredential", this.alcc.address);        

    })

    it("Proving the new credential works with correct parameters", async function (){
        const credProofData = {"scheme":"g16","curve":"bn128","proof":{"a":["0x020d723eff1ce68e218a21fa7b31e0a96a81028351a82a839384dd90ce628a24","0x0349466222ba3e6a5b1e7a12adcb99c99f71230d25cd7a43a56aee57bf13697e"],"b":[["0x1c7aec32bdb0ca05c32710bbba340a7f846baaacff9ea1cf166da3a8050f47ab","0x1dd7a7f98b96ada3abe69e838f6b0bb240947e7bf8a83d15d8a73df133be92ac"],["0x1adcefca1c74db8d3a5ecc43f85f5c5f8404048c1652b2b1a11fda34c543a609","0x2f7311cc55b5f74ad481b7c161b1c6019a74852df2f3416645e35e339dfa8eeb"]],"c":["0x17ed70a8c239f10adf3ebb83da9d014887037099b355d25cd3136c23d38259de","0x2a3b10e36e881460105b06785299aa3576fcd3b39648fd58aa667059af35c7d8"]},"inputs":["0x000000000000000000000000000000000000000000000000000000000a3f6bc8","0x00000000000000000000000000000000000000000000000000000000e3c5f0c9","0x00000000000000000000000000000000000000000000000000000000d4b1b69d","0x0000000000000000000000000000000000000000000000000000000043f060ac","0x000000000000000000000000000000000000000000000000000000003c976c78","0x0000000000000000000000000000000000000000000000000000000074f2e5fd","0x00000000000000000000000000000000000000000000000000000000c4a00592","0x00000000000000000000000000000000000000000000000000000000b332a9f1","0x00000000000000000000000000000000000000000000000000000000c8834c1f","0x00000000000000000000000000000000000000000000000000000000cf0df662","0x000000000000000000000000000000000000000000000000000000003fc8c8ed","0x0000000000000000000000000000000000000000000000000000000025064a41","0x0000000000000000000000000000000000000000000000000000000048d99388","0x0000000000000000000000000000000000000000000000000000000061626364","0x0000000000000000000000000000000000000000000000000000000065000000","0x0000000000000000000000000000000000000000000000000000000000000000","0x0000000000000000000000000000000000000000000000000000000000000000","0x0000000000000000000000000000000000000000000000000000000000000000","0x0000000000000000000000000000000000000000000000000000000000000000","0x0000000000000000000000000000000000000000000000000000000000000000","0x00000000000000000000000000000000000000000000000000000000c8834c1f","0x00000000000000000000000000000000000000000000000000000000cf0df662","0x000000000000000000000000000000000000000000000000000000003fc8c8ed","0x0000000000000000000000000000000000000000000000000000000025064a41","0x0000000000000000000000000000000000000000000000000000000048d99388"]};

        expect(await this.hub.verifyProof("proveIHaveCredential", credProofData.proof, credProofData.inputs)).to.equal(true);
    })

    it("Proving the new credential does not work with incorrect parameters", async function (){
        const badCredProofData1 = {"scheme":"g16","curve":"bn128","proof":{"a":["0x123456789abcdefe218a21fa7b31e0a96a81028351a82a839384dd90ce628a24","0x0349466222ba3e6a5b1e7a12adcb99c99f71230d25cd7a43a56aee57bf13697e"],"b":[["0x1c7aec32bdb0ca05c32710bbba340a7f846baaacff9ea1cf166da3a8050f47ab","0x1dd7a7f98b96ada3abe69e838f6b0bb240947e7bf8a83d15d8a73df133be92ac"],["0x1adcefca1c74db8d3a5ecc43f85f5c5f8404048c1652b2b1a11fda34c543a609","0x2f7311cc55b5f74ad481b7c161b1c6019a74852df2f3416645e35e339dfa8eeb"]],"c":["0x17ed70a8c239f10adf3ebb83da9d014887037099b355d25cd3136c23d38259de","0x2a3b10e36e881460105b06785299aa3576fcd3b39648fd58aa667059af35c7d8"]},"inputs":["0x000000000000000000000000000000000000000000000000000000000a3f6bc8","0x00000000000000000000000000000000000000000000000000000000e3c5f0c9","0x00000000000000000000000000000000000000000000000000000000d4b1b69d","0x0000000000000000000000000000000000000000000000000000000043f060ac","0x000000000000000000000000000000000000000000000000000000003c976c78","0x0000000000000000000000000000000000000000000000000000000074f2e5fd","0x00000000000000000000000000000000000000000000000000000000c4a00592","0x00000000000000000000000000000000000000000000000000000000b332a9f1","0x00000000000000000000000000000000000000000000000000000000c8834c1f","0x00000000000000000000000000000000000000000000000000000000cf0df662","0x000000000000000000000000000000000000000000000000000000003fc8c8ed","0x0000000000000000000000000000000000000000000000000000000025064a41","0x0000000000000000000000000000000000000000000000000000000048d99388","0x0000000000000000000000000000000000000000000000000000000061626364","0x0000000000000000000000000000000000000000000000000000000065000000","0x0000000000000000000000000000000000000000000000000000000000000000","0x0000000000000000000000000000000000000000000000000000000000000000","0x0000000000000000000000000000000000000000000000000000000000000000","0x0000000000000000000000000000000000000000000000000000000000000000","0x0000000000000000000000000000000000000000000000000000000000000000","0x00000000000000000000000000000000000000000000000000000000c8834c1f","0x00000000000000000000000000000000000000000000000000000000cf0df662","0x000000000000000000000000000000000000000000000000000000003fc8c8ed","0x0000000000000000000000000000000000000000000000000000000025064a41","0x0000000000000000000000000000000000000000000000000000000048d99388"]};
        const badCredProofData2 = {"scheme":"g16","curve":"bn128","proof":{"a":["0x020d723eff1ce68e218a21fa7b31e0a96a81028351a82a839384dd90ce628a24","0x0349466222ba3e6a5b1e7a12adcb99c99f71230d25cd7a43a56aee57bf13697e"],"b":[["0x1c7aec32bdb0ca05c32710bbba340a7f846baaacff9ea1cf166da3a8050f47ab","0x1dd7a7f98b96ada3abe69e838f6b0bb240947e7bf8a83d15d8a73df133be92ac"],["0x1adcefca1c74db8d3a5ecc43f85f5c5f8404048c1652b2b1a11fda34c543a609","0x2f7311cc55b5f74ad481b7c161b1c6019a74852df2f3416645e35e339dfa8eeb"]],"c":["0x17ed70a8c239f10adf3ebb83da9d014887037099b355d25cd3136c23d38259de","0x2a3b10e36e881460105b06785299aa3576fcd3b39648fd58aa667059af35c7d8"]},"inputs":["0x000000000000000000000000000000000000000000000000000000000a3f6bc8","0x00000000000000000000000000000000000000000000000000000000e3c5f0c9","0x00000000000000000000000000000000000000000000000000000000d4b1b69d","0x0000000000000000000000000000000000000000000000000000000043f060ac","0x000000000000000000000000000000000000000000000000000000003c976c78","0x0000000000000000000000000000000000000000000000000000000074f2e5fd","0x00000000000000000000000000000000000000000000000000000000c4a00592","0x00000000000000000000000000000000000000000000000000000000b332a9f1","0x00000000000000000000000000000000000000000000000000000000c8834c1f","0x00000000000000000000000000000000000000000000000000000000cf0df662","0x000000000000000000000000000000000000000000000000000000003fc8c8ed","0x0000000000000000000000000000000000000000000000000000000025064a41","0x0000000000000000000000000000000000000000000000000000000048d99388","0x0000000000000000000000000000000000000000000000000000000061626364","0x0000000000000000000000000000000000000000000000000000000065000000","0x0000000000000000000000000000000000000000000000000000000000000000","0x0000000000000000000000000000000000000000000000000000000000000000","0x0000000000000000000000000000000000000000000000000000000000000000","0x0000000000000000000000000000000000000000000000000000000000000000","0x0000000000000000000000000000000000000000000000000000000000000000","0x00000000000000000000000000000000000000000000000000000000c8834c1f","0x00000000000000000000000000000000000000000000000000000000cf0df662","0x000000000000000000000000000000000000000000000000000000003fc8c8ed","0x0000000000000000000000000000000000000000000000000000000025064a41","0x0000000000000000000000000000000000000000000000000000000069696969"]};

        await expect(this.hub.verifyProof("proveIHaveCredential", badCredProofData1.proof, badCredProofData1.inputs)).to.be.reverted;
        expect(await this.hub.verifyProof("proveIHaveCredential", badCredProofData2.proof, badCredProofData2.inputs)).to.equal(false);
    })


});