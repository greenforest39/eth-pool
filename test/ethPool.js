const { expect } = require("chai");
const { ethers } = require("hardhat");

const { takeSnapshot, revertToSnapshot } = require("./utils/snapshot");

describe("ETHPool", function () {
  let admin;
  let user1;
  let user2;
  let newAdmin;
  let nonAdmin;

  let pool;

  let snapshotId;

  beforeEach(async () => {
    const signers = await ethers.getSigners();
    admin = signers[0];
    user1 = signers[1];
    user2 = signers[2];
    newAdmin = signers[3];
    nonAdmin = signers[4];

    const ETHPoolFactory = ethers.getContractFactory("ETHPool");
    pool = await (await ETHPoolFactory).deploy();
    await pool.deployed();

    const _admin = await pool.admin();
    expect(_admin).to.be.eq(admin.address);

    snapshotId = await takeSnapshot();
  });

  afterEach(async function () {
    await revertToSnapshot(snapshotId);
  });

  it("should be deployed", async function () {});

  it("should deposit ETH to pool", async function () {
    const amount = ethers.utils.parseEther("10");
    const r = await pool.connect(user1).deposit({ value: amount });
    expect(r).to.emit(pool, "Deposited").withArgs(user1.address, amount);

    const shares = await pool.balanceOf(user1.address);
    expect(shares).to.be.eq(amount);
  });

  it("admin should add reward", async function () {
    const amount = ethers.utils.parseEther("5");
    await expect(
      pool.connect(nonAdmin).addReward({
        value: amount,
      })
    ).to.be.revertedWith("not admin");

    await pool.connect(admin).addReward({
      value: amount,
    });
  });

  it("should distribute reward properly #1", async function () {
    // user1 deposit 10 ETH
    const amount1 = ethers.utils.parseEther("10");
    let r = await pool.connect(user1).deposit({ value: amount1 });
    expect(r).to.emit(pool, "Deposited").withArgs(user1.address, amount1);

    let shares1 = await pool.balanceOf(user1.address);
    expect(shares1).to.be.eq(amount1);

    // user1 deposit 30 ETH
    const amount2 = ethers.utils.parseEther("30");
    r = await pool.connect(user2).deposit({ value: amount2 });
    expect(r).to.emit(pool, "Deposited").withArgs(user2.address, amount2);

    let shares2 = await pool.balanceOf(user2.address);
    expect(shares2).to.be.eq(amount2);

    // add 20 ETH for reward
    const reward = ethers.utils.parseEther("20");
    await pool.connect(admin).addReward({
      value: reward,
    });

    // user1 withdraw
    r = await pool.connect(user1).withdraw();
    expect(r)
      .to.emit(pool, "Withdrawn")
      .withArgs(
        user1.address,
        amount1.add(reward.div(amount1.add(amount2)).mul(amount1))
      );
    shares1 = await pool.balanceOf(user1.address);
    expect(shares1).to.be.eq(0);

    // user2 withdraw
    r = await pool.connect(user2).withdraw();
    expect(r)
      .to.emit(pool, "Withdrawn")
      .withArgs(
        user2.address,
        amount2.add(reward.div(amount1.add(amount2)).mul(amount2))
      );
    shares2 = await pool.balanceOf(user2.address);
    expect(shares2).to.be.eq(0);
  });

  it("should distribute reward properly #2", async function () {
    // user1 deposit 10 ETH
    const amount1 = ethers.utils.parseEther("10");
    let r = await pool.connect(user1).deposit({ value: amount1 });
    expect(r).to.emit(pool, "Deposited").withArgs(user1.address, amount1);

    let shares1 = await pool.balanceOf(user1.address);
    expect(shares1).to.be.eq(amount1);

    // add 20 ETH for reward
    const reward = ethers.utils.parseEther("20");
    await pool.connect(admin).addReward({
      value: reward,
    });

    // user1 withdraw
    r = await pool.connect(user1).withdraw();
    expect(r)
      .to.emit(pool, "Withdrawn")
      .withArgs(user1.address, amount1.add(reward));
    shares1 = await pool.balanceOf(user1.address);
    expect(shares1).to.be.eq(0);

    // user1 deposit 30 ETH
    const amount2 = ethers.utils.parseEther("30");
    r = await pool.connect(user2).deposit({ value: amount2 });
    expect(r).to.emit(pool, "Deposited").withArgs(user2.address, amount2);

    let shares2 = await pool.balanceOf(user2.address);
    expect(shares2).to.be.eq(amount2);

    // user2 withdraw
    r = await pool.connect(user2).withdraw();
    expect(r).to.emit(pool, "Withdrawn").withArgs(user2.address, amount2);
    shares2 = await pool.balanceOf(user2.address);
    expect(shares2).to.be.eq(0);
  });

  it("should update admin", async function () {
    await expect(
      pool.connect(nonAdmin).setAdmin(newAdmin.address)
    ).to.be.revertedWith("not admin");

    await expect(
      pool.connect(admin).setAdmin("0x0000000000000000000000000000000000000000")
    ).to.be.revertedWith("invalid admin");

    await expect(
      pool.connect(admin).setAdmin(admin.address)
    ).to.be.revertedWith("same admin");

    const r = await pool.connect(admin).setAdmin(newAdmin.address);
    expect(r).to.emit(pool, "AdminUpdated").withArgs(newAdmin.address);
  });
});
