# Anonymous, Interoperable, & Extensible ID
Broken into a few components
## Leaves 
Leaves are hashes of preimages. These preimages have the following structure:

`address` **20 bytes**, issuer of credential

`creds` **28 bytes**, credential itself

`nullifier` **16 bytes**, random bytes that only the user knows

## Tree
An on-chain Merkle tree constructed from all the leaves. It has a fixed depth (because snarks mandate fixed size input), so adding a leaf is really changing a 0-leaf.
It can only be edited by a smart contract which checks a leaf is valid first before adding them.

## Verifier
There are two types of verifier contracts: one to verify that a user has a certain identity, and another to verify leaves to be added to the Tree.
Both of them are generated by ZoKrates to accept ZK proofs.
### Verifying user has a certain identity
This involves a proof with private inputs `leaf`, `path`, `directionSelector`, and `nullifier` and public inputs `root`, `address`, and `creds`.
It proves knowledge of a merkle leaf (and corresponding path + directionSelector) that it belongs to the tree indicated by root `root`. But the leaf is kept private. Essentially, a merkle proof in zk. The leaf is then checked to be the hash of `address` + `creds` + `nullifier`. This publically reveals the issuer address and credential. 

*Optionally*, a proof with a public input `nullifierHash` can be submitted too. This nullifies the credential, or at least records that the credential has been used before. This has Sybil resistance use cases, such as proving someone with a certain credential has never voted before.
