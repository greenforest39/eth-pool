const hre = require("hardhat");

async function main() {
  const pool = await hre.ethers.getContractAt(
    "ETHPool",
    "0x9631113Da8f950D60AA65Ad8fCc746a0E5D40fEa"
  );

  const balance = await hre.ethers.provider.getBalance(pool.address);

  console.log(
    "Total ETH in the pool: ",
    parseInt(balance.toString()) / 10 ** 18
  );
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
