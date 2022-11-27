const { ethers } = require("hardhat")

async function main() {
  const Whitelist = await ethers.getContractFactory("Whitelist")
  const whitlelist = await Whitelist.deploy(15)

  await whitlelist.deployed()

  console.log(`Whitelist contract deployed to: ${whitlelist.address}`)
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
