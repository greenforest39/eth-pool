const hre = require("hardhat");

async function main() {
  const ETHPool = await hre.ethers.getContractFactory("ETHPool");
  const pool = await ETHPool.deploy();

  await pool.deployed();

  console.log("ETHPool deployed to:", pool.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
